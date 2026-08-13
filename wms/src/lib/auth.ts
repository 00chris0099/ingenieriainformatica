import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { compare, hash } from 'bcryptjs';
import { SUPER_ADMIN_EMAIL } from '@/lib/super-admin';
import { isImpersonationActive, IMPERSONATION_MAX_RENEWALS } from '@/lib/impersonation';
import { createSessionRecord, isSessionActive } from '@/lib/sessions';

let prismaClient: any = null;
async function getPrisma() {
  if (!prismaClient) {
    const { prisma } = await import('@repo/prisma');
    prismaClient = prisma;
  }
  return prismaClient;
}

// Google OAuth environment variables (empty = Google login disabled)
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

        // ═══════════════ STANDARD AUTHENTICATION (all users, including Super Admin) ═══════════════
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
          // No fail-safe authentication: never grant a session when the DB is unreachable
          console.error('Auth DB error:', error);
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

        // Enterprise: registrar la sesión del dispositivo en el JWT (`sid`).
        // El impersonador se excluye: sus tokens se firman a mano sin este paso.
        if (!(token as any).impersonating) {
          const sid = await createSessionRecord({ userId: String(user.id), email: userEmail });
          if (sid) (token as any).sid = sid;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        const t = token as any;
        if (t.impersonating) {
          // The server-side record is the source of truth: if the impersonation
          // was closed (super-admin panel, remote close) or expired, REVOKE it
          // and restore the original admin identity — even in another browser.
          const active = await isImpersonationActive(t.impersonatedBy, t.id);
          if (active) {
            // Temporary impersonation session: role comes from the token (client),
            // never overridden by the email shortcut — the impersonator is confined
            // to the client portal by the middleware + multi-tenant guards.
            (session.user as any).role = t.role || 'client';
            (session.user as any).impersonating = true;
            (session.user as any).impersonatedBy = t.impersonatedBy;
            (session.user as any).impersonatedByEmail = t.impersonatedByEmail;
            (session.user as any).impersonatedUntil = t.impersonatedUntil;
            (session.user as any).impersonationMode = t.impersonationMode || 'full';
            (session.user as any).impersonationRenewalsLeft =
              Math.max(0, IMPERSONATION_MAX_RENEWALS - (Number(t.impersonationRenewals) || 0));
          } else {
            try {
              const prisma = await getPrisma();
              const admin = await prisma.user.findUnique({
                where: { id: t.impersonatedBy },
                select: { id: true, email: true, fullName: true, role: true, isActive: true },
              });
              if (admin && admin.isActive) {
                session.user.id = admin.id;
                session.user.email = admin.email;
                session.user.name = admin.fullName;
                (session.user as any).role = admin.role;
                (session.user as any).impersonationRevoked = true;
              } else {
                // El admin original ya no existe/está inactivo: conserva la identidad
                // del token pero sin impersonación.
                (session.user as any).role = t.role || 'client';
              }
            } catch {
              (session.user as any).role = t.role || 'client';
            }
          }
        } else {
          const userEmail = (session.user.email || '').toLowerCase();
          (session.user as any).role = userEmail === SUPER_ADMIN_EMAIL ? 'super_admin' : (token.role || 'client');
        }
        (session.user as any).isActive = token.isActive;

        // Revocación de sesión: el `sid` es la fuente de verdad. Si la fila
        // desapareció o fue revocada (Configuración → Seguridad), la sesión
        // muere: el layout hace signOut y las APIs responden 401.
        const sid = (token as any).sid as string | undefined;
        if (sid && !(token as any).impersonating) {
          const active = await isSessionActive(sid);
          if (active) {
            (session.user as any).sid = sid;
          } else {
            (session.user as any).sessionRevoked = true;
          }
        }
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
