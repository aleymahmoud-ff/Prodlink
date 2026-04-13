import { NextRequest, NextResponse } from 'next/server';
import { db, profiles, userLineAssignments, lines } from '@/shared/lib/db';
import { eq, desc, inArray } from 'drizzle-orm';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

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

    // Hash password if provided
    const passwordHash = password ? await bcrypt.hash(password, 12) : null;

    const [newUser] = await db.insert(profiles).values({
      email,
      username: username || null,
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
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
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

    const updateData: Record<string, unknown> = {
      email,
      username: username || null,
      fullName: full_name,
      role,
      isActive: is_active,
    };

    // Only update password if provided
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    const [updated] = await db.update(profiles)
      .set(updateData)
      .where(eq(profiles.id, id))
      .returning();

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
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
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

    // Delete line assignments first
    await db.delete(userLineAssignments).where(eq(userLineAssignments.userId, id));

    // Delete user
    await db.delete(profiles).where(eq(profiles.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
