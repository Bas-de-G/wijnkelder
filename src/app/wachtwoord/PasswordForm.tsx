'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { metTimeout, isNetwerkProbleem, NETWERK_FOUT } from '@/lib/timeout';

const MIN = 8;

export function PasswordForm() {
  const router = useRouter();
  const [wachtwoord, setWachtwoord] = useState('');
  const [herhaal, setHerhaal] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [klaar, setKlaar] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFout(null);

    if (wachtwoord.length < MIN) return setFout(`Kies een wachtwoord van minstens ${MIN} tekens.`);
    if (wachtwoord !== herhaal) return setFout('De twee wachtwoorden zijn niet gelijk.');

    setBezig(true);
    try {
      const supabase = createClient();
      const { error } = await metTimeout(supabase.auth.updateUser({ password: wachtwoord }));
      if (error) return setFout(`Opslaan lukte niet: ${error.message}`);
    } catch (e) {
      return setFout(isNetwerkProbleem(e) ? NETWERK_FOUT : 'Er ging iets mis. Probeer het zo nog eens.');
    } finally {
      setBezig(false);
    }
    setKlaar(true);
    setTimeout(() => { router.push('/'); router.refresh(); }, 1200);
  }

  if (klaar) {
    return (
      <div className="notice good" role="status">
        <strong>Gelukt.</strong> Je nieuwe wachtwoord staat klaar — we brengen je naar je kelder.
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="field">
        <label htmlFor="pw">Nieuw wachtwoord</label>
        <input id="pw" type="password" required autoComplete="new-password" minLength={MIN}
          value={wachtwoord} onChange={(e) => setWachtwoord(e.target.value)} />
        <span className="hint">Minstens {MIN} tekens.</span>
      </div>
      <div className="field">
        <label htmlFor="pw2">Nog een keer</label>
        <input id="pw2" type="password" required autoComplete="new-password"
          value={herhaal} onChange={(e) => setHerhaal(e.target.value)} />
      </div>
      {fout && <div className="notice" role="alert">{fout}</div>}
      <button className="btn btn-primary" type="submit" disabled={bezig}>
        {bezig ? 'Bezig…' : 'Wachtwoord opslaan'}
      </button>
    </form>
  );
}
