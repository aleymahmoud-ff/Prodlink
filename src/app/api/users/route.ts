import { NextRequest, NextResponse } from 'next/server';
import {
  db,
  profiles,
  userLineAssignments,
  lines,
  approvalLevelAssignments,
  wasteApprovals,
} from '@/shared/lib/db';
import { eq, desc, inArray, sql } from 'drizzle-orm';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

function validateUsername(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) return 'Username is required';
  if (value.length < 3) return 'Username must be at least 3 characters';
  if (!/^[a-z0-9._-]+$/.test(value)) return 'Username may only contain lowercase letters, digits, . _ -';
  return null;
}

function explainDbError(error: unknown, fallback: string, action: 'update' | 'delete' | 'create' = 'update'): string {
  // Drizzle wraps the pg driver error; the real reason lives on .cause
  type PgErr = { code?: string; detail?: string; constraint?: string; message?: string };
  const root = (error as { cause?: PgErr } | null)?.cause ?? (error as PgErr);
  if (root?.code === '23505') {
    const field = root.constraint?.includes('email') ? 'email'
      : root.constraint?.includes('username') ? 'username'
      : 'value';
    return `That ${field} is already in use by another user.`;
  }
  if (root?.code === '23503') {
    return action === 'delete'
      ? 'Cannot delete: this user has records in the system. Deactivate the account instead.'
      : `Cannot ${action}: this user is referenced by other records.`;
  }
  if (root?.detail) return root.detail;
  if (root?.message) return root.message;
  return error instanceof Error ? error.message : fallback;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allUsers = await db
      .select()
      .from(profiles)
      .orderBy(desc(profiles.createdAt));

    // Get line assignments for all users
    const userIds = allUsers.map(u => u.id);
    const assignments = userIds.length > 0 ? await db
      .select({
        userId: userLineAssignments.userId,
        lineId: userLineAssignments.lineId,
        lineName: lines.name,
        lineCode: lines.code,
      })
      .from(userLineAssignments)
      .leftJoin(lines, eq(userLineAssignments.lineId, lines.id))
      .where(inArray(userLineAssignments.userId, userIds)) : [];

    const result = allUsers.map(user => {
      const userAssignments = assignments.filter(a => a.userId === user.id);
      return {
        ...user,
        full_name: user.fullName,
        is_active: user.isActive,
        created_at: user.createdAt?.toISOString(),
        updated_at: user.updatedAt?.toISOString(),
        user_line_assignments: userAssignments.map(a => ({
          line_id: a.lineId,
          lines: {
            id: a.lineId,
            name: a.lineName,
            code: a.lineCode,
          },
        })),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, username, full_name, password, role, is_active, line_ids } = body;

    const usernameError = validateUsername(username);
    if (usernameError) return NextResponse.json({ error: usernameError }, { status: 400 });
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    if (!full_name) return NextResponse.json({ error: 'Full name is required' }, { status: 400 });

    // Hash password if provided
    const passwordHash = password ? await bcrypt.hash(password, 12) : null;

    const [newUser] = await db.insert(profiles).values({
      email,
      username,
      fullName: full_name,
      passwordHash,
      role: role || 'engineer',
      isActive: is_active !== false,
    }).returning();

    // Add line assignments
    if (line_ids && line_ids.length > 0) {
      await db.insert(userLineAssignments).values(
        line_ids.map((lineId: string) => ({
          userId: newUser.id,
          lineId,
        }))
      );
    }

    return NextResponse.json({
      ...newUser,
      full_name: newUser.fullName,
      is_active: newUser.isActive,
      created_at: newUser.createdAt?.toISOString(),
      updated_at: newUser.updatedAt?.toISOString(),
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: explainDbError(error, 'Failed to create user', 'create') }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, email, username, full_name, password, role, is_active, line_ids } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    if (username !== undefined) {
      const usernameError = validateUsername(username);
      if (usernameError) return NextResponse.json({ error: usernameError }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (email !== undefined) updateData.email = email;
    if (username !== undefined) updateData.username = username;
    if (full_name !== undefined) updateData.fullName = full_name;
    if (role !== undefined) updateData.role = role;
    if (is_active !== undefined) updateData.isActive = is_active;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 12);

    const [updated] = Object.keys(updateData).length > 0
      ? await db.update(profiles).set(updateData).where(eq(profiles.id, id)).returning()
      : await db.select().from(profiles).where(eq(profiles.id, id));

    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update line assignments
    if (line_ids !== undefined) {
      // Remove existing assignments
      await db.delete(userLineAssignments).where(eq(userLineAssignments.userId, id));

      // Add new assignments
      if (line_ids.length > 0) {
        await db.insert(userLineAssignments).values(
          line_ids.map((lineId: string) => ({
            userId: id,
            lineId,
          }))
        );
      }
    }

    return NextResponse.json({
      ...updated,
      full_name: updated.fullName,
      is_active: updated.isActive,
      created_at: updated.createdAt?.toISOString(),
      updated_at: updated.updatedAt?.toISOString(),
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: explainDbError(error, 'Failed to update user') }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    // Block delete if the user actually authored production data — those FKs are RESTRICT.
    const result = await db.execute<{
      production: number; damage: number; reprocessing: number; waste: number;
    }>(sql`
      select
        (select count(*)::int from production_entries where created_by = ${id}) as production,
        (select count(*)::int from damage_entries where created_by = ${id}) as damage,
        (select count(*)::int from reprocessing_entries where created_by = ${id}) as reprocessing,
        (select count(*)::int from waste_entries where created_by = ${id}) as waste
    `);
    const counts = result.rows[0];
    const blocking = Object.entries(counts ?? {}).filter(([, n]) => Number(n) > 0);
    if (blocking.length > 0) {
      const summary = blocking.map(([t, n]) => `${n} ${t}`).join(', ');
      return NextResponse.json(
        { error: `Cannot delete: user authored ${summary} record(s). Deactivate the account instead.` },
        { status: 409 }
      );
    }

    // Detach references that are safe to clear so the delete won't trip on stale FK rules.
    await db.update(lines).set({ formApproverId: null }).where(eq(lines.formApproverId, id));
    await db.update(wasteApprovals).set({ approvedBy: null }).where(eq(wasteApprovals.approvedBy, id));
    await db.delete(approvalLevelAssignments).where(eq(approvalLevelAssignments.userId, id));
    await db.delete(userLineAssignments).where(eq(userLineAssignments.userId, id));

    await db.delete(profiles).where(eq(profiles.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: explainDbError(error, 'Failed to delete user', 'delete') }, { status: 500 });
  }
}
