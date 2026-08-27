'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { loginErrorText } from '@/lib/auth-errors';

export default function LoginForm() {
  const params = useSearchParams();
  const verder = params.get('verder') || '/';

  const [email, setEmail] = useState('');
  const [is18, setIs18] = useState(false);
  const [state, setState] = useState<'idle' | 'bezig' | 'verstuurd'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setState('bezig');

    const supabase = createClient();
    const base = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${base}/auth/bevestigen?verder=${encodeURIComponent(verder)}`,
      },
    });

    if (error) {
      setError(loginErrorText(error));
      setState('idle');
      return;
    }
    setState('verstuurd');
  }

  if (state === 'verstuurd') {
    return (
      <div className="notice good" role="status">
        <strong>Kijk in je mail.</strong> We stuurden een inloglink naar {email}. De link is
        één keer te gebruiken en verloopt na een uur.
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="field">
        <label htmlFor="email">E-mailadres</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="jij@voorbeeld.nl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <span className="hint">
          Je krijgt een inloglink toegestuurd. Geen wachtwoord om te onthouden.
        </span>
      </div>

      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: 'var(--ink-2)', cursor: 'pointer' }}>
        <input
          type="checkbox"
          required
          checked={is18}
          onChange={(e) => setIs18(e.target.checked)}
          style={{ marginTop: 3, accentColor: 'var(--oxblood)' }}
        />
        <span>Ik ben 18 jaar of ouder.</span>
      </label>

      {error && <div className="notice" role="alert">{error}</div>}

      <button className="btn btn-primary" type="submit" disabled={state === 'bezig'}>
        {state === 'bezig' ? 'Bezig…' : 'Stuur me een inloglink'}
      </button>
    </form>
  );
}
