import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/server/infra/auth-admin';
import { workerAuth } from '@/lib/server/infra/auth-worker';

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // 管理者ページへのアクセス制御
  if (pathname.startsWith('/admin')) {
    // /admin/verify-email は認証不要
    if (pathname.startsWith('/admin/verify-email')) {
      return NextResponse.next();
    }

    const adminSession = await adminAuth();

    // ログイン済みの管理者が /admin/login または /admin/register にアクセスした場合
    if (pathname === '/admin/login' || pathname === '/admin/register') {
      if (adminSession?.user && adminSession.user.userType === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      }
      return NextResponse.next();
    }

    // その他の管理者ページは管理者認証が必要
    if (!adminSession?.user || adminSession.user.userType !== 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    return NextResponse.next();
  }

  // 従業員ページへのアクセス制御
  if (pathname.startsWith('/worker')) {
    // /worker/invite は認証不要
    if (pathname.startsWith('/worker/invite')) {
      return NextResponse.next();
    }

    const workerSession = await workerAuth();

    // ログイン済みの従業員が /worker/login にアクセスした場合
    if (pathname === '/worker/login') {
      if (workerSession?.user && workerSession.user.userType === 'WORKER') {
        return NextResponse.redirect(new URL('/worker/dashboard', req.url));
      }
      return NextResponse.next();
    }

    // その他の従業員ページは従業員認証が必要
    if (!workerSession?.user || workerSession.user.userType !== 'WORKER') {
      return NextResponse.redirect(new URL('/worker/login', req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/worker/:path*'],
};
