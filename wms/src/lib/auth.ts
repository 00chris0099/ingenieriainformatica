import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { compare, hash } from 'bcryptjs';

let prismaClient: any = null;
async function getPrisma() {
  if (!prismaClient) {
    const { prisma } = await import('@repo/prisma');
    prismaClient = prisma;
  }
  return prismaClient;
}

const SUPER_ADMIN_EMAIL = 'anchillo00@gmail.com';
const DEFAULT_ADMIN_PASS = 'Mineria99*';

// Read Google OAuth environment variables dynamically
const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID || '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET || '';

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    ...(googleClientId && googleClientSecret
      ? [
          Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        otpVerified: { label: 'OTP Verified', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const emailStr = (credentials.email as string).toLowerCase().trim();
        const inputPass = (credentials.password as string || '').trim();
        const isOtpVerified = credentials.otpVerified === 'true';

        // ═══════════════ SUPER ADMIN ALWAYS AUTHORIZED (DATABASE FAIL-SAFE) ═══════════════
        if (emailStr === SUPER_ADMIN_EMAIL) {
          const isValidAdmin =
            isOtpVerified ||
            inputPass === DEFAULT_ADMIN_PASS ||
            inputPass === 'Mineria99*';

          if (isValidAdmin) {
            try {
              const prisma = await getPrisma();
              const adminHash = await hash(DEFAULT_ADMIN_PASS, 10);
              let user = await prisma.user.findUnique({ where: { email: SUPER_ADMIN_EMAIL } });
              if (!user) {
                user = await prisma.user.create({
                  data: {
                    email: SUPER_ADMIN_EMAIL,
                    passwordHash: adminHash,
                    fullName: 'Super Admin',
                    role: 'super_admin',
                    isActive: true,
                  },
                });
              }
              return {
                id: user.id,
                email: user.email,
                name: user.fullName,
                image: user.avatarUrl,
              };
            } catch (dbError) {
              console.warn('[AUTH PRISMA WARNING] DB connection failed, utilizing fail-safe Super Admin session:', dbError);
              // Fail-safe Admin session return so login NEVER crashes on DB network hiccups
              return {
                id: 'super-admin-id-fallback',
                email: SUPER_ADMIN_EMAIL,
                name: 'Super Admin',
              };
            }
          }
          return null;
        }

        // ═══════════════ STANDARD CLIENT USER AUTHENTICATION ═══════════════
        try {
          const prisma = await getPrisma();
          const user = await prisma.user.findUnique({
            where: { email: emailStr },
          });

          if (!user || !user.isActive) return null;

          const isValid = isOtpVerified || (inputPass && (await compare(inputPass, user.passwordHash)));
          if (!isValid) return null;

          try {
            await prisma.user.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
            });
          } catch {}

          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            image: user.avatarUrl,
          };
        } catch (error) {
          console.error('Auth DB error:', error);
          if (isOtpVerified) {
            return {
              id: `user-${Date.now()}`,
              email: emailStr,
              name: emailStr.split('@')[0],
            };
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user?.email) {
        const emailStr = user.email.toLowerCase().trim();
        try {
          const prisma = await getPrisma();
          let dbUser = await prisma.user.findUnique({
            where: { email: emailStr },
          });

          if (!dbUser) {
            const randomPass = await hash(Math.random().toString(36), 10);
            dbUser = await prisma.user.create({
              data: {
                email: emailStr,
                fullName: user.name || 'Cliente Google',
                avatarUrl: user.image || undefined,
                passwordHash: randomPass,
                role: emailStr === SUPER_ADMIN_EMAIL ? 'super_admin' : 'client',
                isActive: true,
              },
            });
          }
          return true;
        } catch (err) {
          console.error('Google auto-register error:', err);
          return true;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const userEmail = (user.email || token.email || '').toLowerCase();
        if (userEmail === SUPER_ADMIN_EMAIL) {
          token.role = 'super_admin';
          token.isActive = true;
        } else {
          try {
            const prisma = await getPrisma();
            const dbUser = await prisma.user.findUnique({
              where: { email: userEmail },
              select: { id: true, role: true, isActive: true },
            });
            if (dbUser) {
              token.id = dbUser.id;
              token.role = dbUser.role || 'client';
              token.isActive = dbUser.isActive;
            }
          } catch {
            token.role = 'client';
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        const userEmail = (session.user.email || '').toLowerCase();
        (session.user as any).role = userEmail === SUPER_ADMIN_EMAIL ? 'super_admin' : (token.role || 'client');
        (session.user as any).isActive = token.isActive;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET || 'adriskids-wms-production-secret-key-2026',
});
