import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { compare } from 'bcryptjs';

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
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
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
          const user = await prisma.customer.findFirst({
            where: { email: credentials.email as string },
          });
          if (!user || !user.isActive) return null;
          if (!user.password || user.password === '') return null;
          const isValid = await compare(credentials.password as string, user.password);
          if (!isValid) return null;
          return { id: user.id, email: user.email, name: user.fullName, image: null };
        } catch { return null; }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const prisma = await getPrisma();
          const existing = await prisma.customer.findFirst({
            where: { email: user.email! },
          });
          if (!existing) {
            const newCustomer = await prisma.customer.create({
              data: {
                email: user.email!,
                fullName: user.name || 'Cliente Google',
                password: '',
                source: 'store',
              },
            });
            user.id = newCustomer.id;
          } else {
            user.id = existing.id;
          }
        } catch (e) {
          console.error('Google sign-in error:', e);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) { token.id = user.id; }
      return token;
    },
    async session({ session, token }) {
      if (session.user) { session.user.id = token.id as string; }
      return session;
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
});
