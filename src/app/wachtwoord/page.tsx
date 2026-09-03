import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { gebruikerId } from '@/lib/auth';
import { PasswordForm } from './PasswordForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Nieuw wachtwoord · Wijnkelder' };

export default async function WachtwoordPage() {
  const supabase = await createClient();
  // De middleware heeft de sessie hier al gecontroleerd; dit leest het token
  // alleen nog lokaal uit.
  const uid = await gebruikerId(supabase);
  if (!uid) redirect('/inloggen');

  return (
    <main className="shell" style={{ maxWidth: 460 }}>
      <header style={{ padding: '72px 0 30px' }}>
        <h1 className="wordmark" style={{ fontSize: 'clamp(26px, 4.5vw, 34px)' }}>
          Nieuw <em>wachtwoord</em>
        </h1>
        <p style={{ marginTop: 12, color: 'var(--ink-2)', fontSize: 14.5, lineHeight: 1.6 }}>
          Je bent ingelogd via de herstellink. Kies hieronder een nieuw wachtwoord.
        </p>
      </header>
      <PasswordForm />
    </main>
  );
}
