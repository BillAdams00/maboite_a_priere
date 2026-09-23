import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Rafraîchit le jeton s'il a expiré
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/admin/connexion') ||
    request.nextUrl.pathname.startsWith('/auth/callback');

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');

  // Redirection si tentative d'accès à l'espace admin sans session
  if (
    isAdminRoute &&
    !isAuthRoute &&
    !user &&
    !(process.env.NODE_ENV === 'development' && process.env.DEV_ADMIN_BYPASS === 'true')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/connexion';
    return NextResponse.redirect(url);
  }

  // Redirection vers le dashboard si l'admin connecté visite la page de connexion
  if (isAuthRoute && user && !request.nextUrl.pathname.startsWith('/auth/callback')) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
