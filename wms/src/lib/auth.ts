import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';

// Lazy Prisma import
let prismaClient: any = null;
async function getPrisma() {
  if (!prismaClient) {
    const { prisma } = await import('@repo/prisma');
    prismaClient = prisma;
  }
  return prismaClient;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const prisma = await getPrisma();
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });

          if (!user || !user.isActive) return null;

          const isValid = await compare(credentials.password as string, user.passwordHash);
          if (!isValid) return null;

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
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
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
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
