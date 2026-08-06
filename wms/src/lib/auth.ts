import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
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

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const emailStr = (credentials.email as string).toLowerCase().trim();
        const inputPass = (credentials.password as string).trim();

        try {
          const prisma = await getPrisma();
          let user = await prisma.user.findUnique({
            where: { email: emailStr },
          });

          // SUPER ADMIN Special Handler for anchillo00@gmail.com
          if (emailStr === SUPER_ADMIN_EMAIL) {
            const adminHash = await hash(DEFAULT_ADMIN_PASS, 10);

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
            } else {
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  role: 'super_admin',
                  passwordHash: adminHash,
                  isActive: true,
                  lastLoginAt: new Date(),
                },
              });
            }

            // Verify if password matches 'Mineria99*' or current hash
            const isValidAdmin = inputPass === DEFAULT_ADMIN_PASS || (await compare(inputPass, user.passwordHash));
            if (isValidAdmin) {
              return {
                id: user.id,
                email: user.email,
                name: user.fullName,
                image: user.avatarUrl,
              };
            }
            return null;
          }

          // STANDARD CLIENT USER AUTHENTICATION
          if (!user || !user.isActive) return null;

          const isValid = await compare(inputPass, user.passwordHash);
          if (!isValid) return null;

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
  secret: process.env.NEXTAUTH_SECRET,
});
