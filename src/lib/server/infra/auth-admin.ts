import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/server/infra/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const ADMIN_LOGIN_SCHEMA = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  organizationId: z.string().optional().transform(val => val || undefined),
});

export const {
  handlers: adminHandlers,
  signIn: adminSignIn,
  signOut: adminSignOut,
  auth: adminAuth,
} = NextAuth({
  basePath: '/api/auth/admin',
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7日
  },
  cookies: {
    sessionToken: {
      name: 'seneca.session-token.admin',
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
      id: 'admin-credentials',
      name: 'Admin Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        organizationId: { label: 'Organization ID', type: 'text' },
      },
      async authorize(credentials): Promise<{
        id: string;
        email: string;
        name: string;
        userType: 'ADMIN';
        organizationId: string;
      } | null> {
        try {
          const validatedData = ADMIN_LOGIN_SCHEMA.parse(credentials);
          console.log('[AdminAuth] Attempting login for:', validatedData.email);

          // AdminUserを検索
          let adminUser;
          if (validatedData.organizationId && validatedData.organizationId !== 'undefined') {
            // organizationIdが指定されている場合
            console.log('[AdminAuth] Searching with organizationId:', validatedData.organizationId);
            adminUser = await prisma.adminUser.findUnique({
              where: {
                email_organizationId: {
                  email: validatedData.email,
                  organizationId: validatedData.organizationId,
                },
              },
            });
          } else {
            // organizationIdが指定されていない場合は最初の管理者を取得
            console.log('[AdminAuth] Searching without organizationId');
            const adminUsers = await prisma.adminUser.findMany({
              where: {
                email: validatedData.email,
              },
              take: 1,
            });
            adminUser = adminUsers[0];
          }

          if (!adminUser) {
            console.log('[AdminAuth] User not found for email:', validatedData.email);
            return null;
          }

          console.log('[AdminAuth] User found:', {
            id: adminUser.id,
            email: adminUser.email,
            isActive: adminUser.isActive,
            emailVerified: adminUser.emailVerified,
          });

          // アクティブチェック
          if (!adminUser.isActive) {
            console.log('[AdminAuth] User is not active');
            return null;
          }

          // パスワード検証
          console.log('[AdminAuth] Verifying password...');
          const isValid = await bcrypt.compare(
            validatedData.password,
            adminUser.passwordHash
          );

          if (!isValid) {
            console.log('[AdminAuth] Password is invalid');
            return null;
          }

          console.log('[AdminAuth] Login successful');
          return {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            userType: 'ADMIN',
            organizationId: adminUser.organizationId,
          };
        } catch (error) {
          console.error('Admin auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userType = 'ADMIN';
        token.organizationId = user.organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub!;
      session.user.userType = 'ADMIN';
      session.user.organizationId = token.organizationId as string;
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
});
