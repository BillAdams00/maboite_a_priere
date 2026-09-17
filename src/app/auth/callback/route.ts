import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/admin';

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Server route handling
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Synchronise ou active la ligne Admin correspondante
      const email = data.user.email?.toLowerCase();
      if (email) {
        const existingAdmin = await prisma.admin.findUnique({ where: { email } });
        if (existingAdmin) {
          await prisma.admin.update({
            where: { id: existingAdmin.id },
            data: {
              authUserId: data.user.id,
              status: 'ACTIVE',
              lastLoginAt: new Date(),
            },
          });
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Échec de l'authentification
  return NextResponse.redirect(`${origin}/admin/connexion?error=auth_callback_failed`);
}
