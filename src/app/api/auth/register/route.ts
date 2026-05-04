import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, profiles } from '@/shared/lib/db';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email, username, password, fullName } = await request.json();

    if (!email || !password || !username) {
      return NextResponse.json(
        { error: 'Username, email and password are required' },
        { status: 400 }
      );
    }

    if (typeof username !== 'string' || username.length < 3 || !/^[a-z0-9._-]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters (lowercase letters, digits, . _ -)' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Check if this is the first user (becomes admin)
    const [anyUser] = await db.select().from(profiles).limit(1);
    const isFirstUser = !anyUser;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const [newUser] = await db
      .insert(profiles)
      .values({
        email,
        username,
        passwordHash,
        fullName: fullName || email,
        role: isFirstUser ? 'admin' : 'engineer',
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
