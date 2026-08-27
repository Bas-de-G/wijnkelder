import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Supabase stuurt de gebruiker hier naartoe vanuit de inlogmail.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const verder = searchParams.get('verder') || '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${verder}`);
  }

  const url = new URL('/inloggen', origin);
  url.searchParams.set('fout', 'link-verlopen');
  return NextResponse.redirect(url);
}
