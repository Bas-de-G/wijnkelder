'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { loginErrorText, signupErrorText, resetErrorText } from '@/lib/auth-errors';
import { metTimeout, isNetwerkProbleem, NETWERK_FOUT } from '@/lib/timeout';

type Modus = 'inloggen' | 'registreren' | 'vergeten';

const MIN_WACHTWOORD = 8;

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const verder = params.get('verder') || '/';

  const [modus, setModus] = useState<Modus>('inloggen');
  const [email, setEmail] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [is18, setIs18] = useState(false);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [melding, setMelding] = useState<string | null>(null);

  function wissel(nieuw: Modus) {
    setModus(nieuw);
    setFout(null);
    setMelding(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFout(null);
    setMelding(null);
    setBezig(true);

    const supabase = createClient();
    const adres = email.trim();

    try {
      if (modus === 'vergeten') {
        const base = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
        const { error } = await metTimeout(supabase.auth.resetPasswordForEmail(adres, {
          redirectTo: `${base}/auth/bevestigen?verder=%2Fwachtwoord`,
        }));
        if (error) { setFout(resetErrorText(error)); return; }
        setMelding(`Als er een account bij ${adres} hoort, is er een herstelmail onderweg.`);
        return;
      }

      if (modus === 'registreren') {
        if (wachtwoord.length < MIN_WACHTWOORD) {
          setFout(`Kies een wachtwoord van minstens ${MIN_WACHTWOORD} tekens.`);
          return;
        }
        const { data, error } = await metTimeout(
          supabase.auth.signUp({ email: adres, password: wachtwoord })
        );
        if (error) { setFout(signupErrorText(error)); return; }

        // Staat e-mailbevestiging aan, dan komt er geen sessie terug en moet de
        // gebruiker eerst op de link in zijn mail klikken.
        if (!data.session) {
          setMelding(
            `Je account is aangemaakt. Klik op de link in de mail naar ${adres} om het te bevestigen, dan kun je inloggen.`
          );
          return;
        }
        router.push(verder);
        router.refresh();
        return;
      }

      const { error } = await metTimeout(
        supabase.auth.signInWithPassword({ email: adres, password: wachtwoord })
      );
      if (error) { setFout(loginErrorText(error)); return; }
      router.push(verder);
      router.refresh();
    } catch (e) {
      // Zonder deze vangst blijft de knop op "Bezig…" staan als het verzoek
      // nooit aankomt — de Supabase-client blijft dat namelijk zelf herproberen.
      setFout(isNetwerkProbleem(e) ? NETWERK_FOUT : 'Er ging iets mis. Probeer het zo nog eens.');
    } finally {
      setBezig(false);
    }
  }

  const titels: Record<Modus, string> = {
    inloggen: 'Inloggen',
    registreren: 'Account maken',
    vergeten: 'Wachtwoord vergeten',
  };

  return (
    <>
      <div className="auth-tabs" role="tablist" aria-label="Inloggen of registreren">
        {(['inloggen', 'registreren'] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={modus === m}
            className={`auth-tab${modus === m ? ' on' : ''}`}
            onClick={() => wissel(m)}
          >
            {titels[m]}
          </button>
        ))}
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {modus === 'vergeten' && (
          <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>
            Vul je e-mailadres in, dan sturen we een link waarmee je een nieuw wachtwoord kunt
            instellen.
          </p>
        )}

        <div className="field">
          <label htmlFor="email">E-mailadres</label>
          <input
            id="email" type="email" required autoComplete="email"
            placeholder="jij@voorbeeld.nl"
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {modus !== 'vergeten' && (
          <div className="field">
            <label htmlFor="wachtwoord">Wachtwoord</label>
            <input
              id="wachtwoord" type="password" required
              autoComplete={modus === 'registreren' ? 'new-password' : 'current-password'}
              minLength={modus === 'registreren' ? MIN_WACHTWOORD : undefined}
              value={wachtwoord} onChange={(e) => setWachtwoord(e.target.value)}
            />
            {modus === 'registreren' && (
              <span className="hint">Minstens {MIN_WACHTWOORD} tekens.</span>
            )}
          </div>
        )}

        {modus === 'registreren' && (
          <label className="check">
            <input
              type="checkbox" required checked={is18}
              onChange={(e) => setIs18(e.target.checked)}
            />
            <span>Ik ben 18 jaar of ouder.</span>
          </label>
        )}

        {fout && <div className="notice" role="alert">{fout}</div>}
        {melding && <div className="notice good" role="status">{melding}</div>}

        <button className="btn btn-primary" type="submit" disabled={bezig}>
          {bezig ? 'Bezig…' : modus === 'registreren' ? 'Account maken'
            : modus === 'vergeten' ? 'Stuur een herstellink' : 'Inloggen'}
        </button>

        <div style={{ fontSize: 13.5, color: 'var(--ink-3)' }}>
          {modus === 'vergeten' ? (
            <button type="button" className="linkish" onClick={() => wissel('inloggen')}>
              Terug naar inloggen
            </button>
          ) : modus === 'inloggen' ? (
            <button type="button" className="linkish" onClick={() => wissel('vergeten')}>
              Wachtwoord vergeten?
            </button>
          ) : null}
        </div>
      </form>
    </>
  );
}
