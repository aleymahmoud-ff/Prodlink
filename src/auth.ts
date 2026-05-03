import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

class InvalidLoginError extends CredentialsSignin {
  constructor(code: string) {
    super();
    this.code = code;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        login: { label: 'Username or Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) {
          throw new InvalidLoginError('missing_credentials');
        }

        const login = (credentials.login as string).trim();
        const password = credentials.password as string;

        // Dynamic imports to avoid loading pg in Edge runtime (middleware)
        const { db, profiles } = await import('@/shared/lib/db');
        const { eq, or } = await import('drizzle-orm');
        const bcrypt = await import('bcryptjs');

        // Find user by email or username
        const [user] = await db
          .select()
          .from(profiles)
          .where(
            login.includes('@')
              ? eq(profiles.email, login)
              : or(eq(profiles.username, login), eq(profiles.email, login))
          )
          .limit(1);

        if (!user) {
          throw new InvalidLoginError('invalid_credentials');
        }

        if (!user.isActive) {
          throw new InvalidLoginError('account_disabled');
        }

        if (!user.passwordHash) {
          throw new InvalidLoginError('no_password_set');
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          throw new InvalidLoginError('invalid_credentials');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
        };
      },
    }),
    // Uncomment and add Google credentials to enable Google sign-in
    // Google({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  trustHost: true,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
});

// Type augmentation for NextAuth
declare module 'next-auth' {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }
}
