import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/server/infra/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const WORKER_LOGIN_SCHEMA = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  organizationId: z.string().optional().transform(val => val || undefined),
});

export const {
  handlers: workerHandlers,
  signIn: workerSignIn,
  signOut: workerSignOut,
  auth: workerAuth,
} = NextAuth({
  basePath: '/api/auth/worker',
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7日
  },
  cookies: {
    sessionToken: {
      name: 'seneca.session-token.worker',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    Credentials({
      id: 'worker-credentials',
      name: 'Worker Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        organizationId: { label: 'Organization ID', type: 'text' },
      },
      async authorize(credentials): Promise<{
        id: string;
        email: string;
        name: string;
        userType: 'WORKER';
        organizationId: string;
      } | null> {
        try {
          console.log('[WORKER AUTH] Starting authorization');
          console.log('[WORKER AUTH] Credentials:', {
            email: credentials?.email,
            hasPassword: !!credentials?.password,
            organizationId: credentials?.organizationId
          });

          const validatedData = WORKER_LOGIN_SCHEMA.parse(credentials);
          console.log('[WORKER AUTH] Validated data:', {
            email: validatedData.email,
            organizationId: validatedData.organizationId
          });

          // WorkerUserを検索
          let workerUser;
          if (validatedData.organizationId && validatedData.organizationId !== 'undefined') {
            // organizationIdが指定されている場合
            console.log('[WORKER AUTH] Searching with organizationId');
            workerUser = await prisma.workerUser.findUnique({
              where: {
                email_organizationId: {
                  email: validatedData.email,
                  organizationId: validatedData.organizationId,
                },
              },
            });
          } else {
            // organizationIdが指定されていない場合は最初の従業員を取得
            console.log('[WORKER AUTH] Searching without organizationId');
            const workerUsers = await prisma.workerUser.findMany({
              where: {
                email: validatedData.email,
              },
              take: 1,
            });
            workerUser = workerUsers[0];
            console.log('[WORKER AUTH] Found workers:', workerUsers.length);
          }

          if (!workerUser) {
            console.log('[WORKER AUTH] No worker user found');
            return null;
          }

          console.log('[WORKER AUTH] Found worker:', {
            id: workerUser.id,
            email: workerUser.email,
            isActive: workerUser.isActive
          });

          // アクティブチェック
          if (!workerUser.isActive) {
            console.log('[WORKER AUTH] Worker is not active');
            return null;
          }

          // パスワード検証
          const isValid = await bcrypt.compare(
            validatedData.password,
            workerUser.passwordHash
          );

          console.log('[WORKER AUTH] Password valid:', isValid);

          if (!isValid) {
            return null;
          }

          const result = {
            id: workerUser.id,
            email: workerUser.email,
            name: workerUser.name,
            userType: 'WORKER' as const,
            organizationId: workerUser.organizationId,
          };

          console.log('[WORKER AUTH] Returning user:', result);
          return result;
        } catch (error) {
          console.error('[WORKER AUTH] Error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log('[WORKER JWT] Token callback:', { token, user });
      if (user) {
        token.userType = 'WORKER';
        token.organizationId = user.organizationId;
      }
      console.log('[WORKER JWT] Returning token:', token);
      return token;
    },
    async session({ session, token }) {
      console.log('[WORKER SESSION] Session callback:', { session, token });
      session.user.id = token.sub!;
      session.user.userType = 'WORKER';
      session.user.organizationId = token.organizationId as string;
      console.log('[WORKER SESSION] Returning session:', session);
      return session;
    },
  },
  pages: {
    signIn: '/worker/login',
  },
});
