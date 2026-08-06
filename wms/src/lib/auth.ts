import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { compare, hash } from 'bcryptjs';

// Lazy Prisma import
let prismaClient: any = null;
async function getPrisma() {
  if (!prismaClient) {
    const { prisma } = await import('@repo/prisma');
    prismaClient = prisma;
  }
  return prismaClient;
}

const SUPER_ADMIN_EMAIL = 'anchillo00@gmail.com';

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const emailStr = (credentials.email as string).toLowerCase().trim();

        try {
          const prisma = await getPrisma();
          let user = await prisma.user.findUnique({
            where: { email: emailStr },
          });

          // Special Auto-Provision for Super Admin anchillo00@gmail.com if not present or password updated
          if (!user && emailStr === SUPER_ADMIN_EMAIL) {
            const passwordHash = await hash(credentials.password as string, 10);
            user = await prisma.user.create({
              data: {
                email: SUPER_ADMIN_EMAIL,
                passwordHash,
                fullName: 'Super Admin Agency',
                role: 'super_admin',
                isActive: true,
              },
            });
          }

          if (!user || !user.isActive) return null;

          const isValid = await compare(credentials.password as string, user.passwordHash);
          if (!isValid) return null;

          // Update last login & ensure anchillo00@gmail.com is super_admin
          await prisma.user.update({
            where: { id: user.id },
            data: {
              lastLoginAt: new Date(),
              role: emailStr === SUPER_ADMIN_EMAIL ? 'super_admin' : user.role,
            },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            image: user.avatarUrl,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
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
              where: { id: user.id },
              select: { role: true, isActive: true },
            });
            if (dbUser) {
              token.role = dbUser.role;
              token.isActive = dbUser.isActive;
            }
          } catch {}
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        const userEmail = (session.user.email || '').toLowerCase();
        (session.user as any).role = userEmail === SUPER_ADMIN_EMAIL ? 'super_admin' : token.role;
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
  secret: process.env.NEXTAUTH_SECRET,
});
