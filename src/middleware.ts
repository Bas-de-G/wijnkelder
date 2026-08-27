import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/inloggen', '/auth', '/s'];

// De ontwerpvoorbeeldpagina bestaat alleen tijdens ontwikkelen (de route zelf
// geeft in productie een 404), dus die hoeft daar ook niet achter de login.
if (process.env.NODE_ENV !== 'production') PUBLIC_PATHS.push('/ontwerp');

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Ververst de sessie als dat nodig is. Niet weglaten: zonder deze aanroep
  // verloopt de sessie stilletjes tijdens gebruik.
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/inloggen';
    url.searchParams.set('verder', pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname === '/inloggen') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|woff2)$).*)'],
};
