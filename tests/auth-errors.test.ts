import { describe, it, expect } from 'vitest';
import { loginErrorText, signupErrorText, resetErrorText } from '../src/lib/auth-errors';

describe('limieten op mails — de twee gevallen uit elkaar houden', () => {
  it('noemt de resterende seconden bij de wachttijd per adres', () => {
    const t = resetErrorText({
      message: 'For security purposes, you can only request this after 47 seconds.',
      code: 'over_email_send_rate_limit',
    });
    expect(t).toContain('47 seconden');
  });

  it('valt terug op "een minuut" als er geen aantal in de melding staat', () => {
    expect(resetErrorText({ message: 'rate limit', code: 'over_email_send_rate_limit' }))
      .toContain('een minuut');
  });

  it('legt de uurlimiet uit en stuurt niet naar "wacht een minuut"', () => {
    const t = signupErrorText({ message: 'email rate limit exceeded', code: 'over_request_rate_limit' });
    expect(t).toContain('twee per uur');
    expect(t).not.toContain('een minuut');
  });

  it('herkent de uurlimiet ook zonder foutcode', () => {
    expect(loginErrorText({ message: 'Email rate limit exceeded' })).toContain('uur');
  });
});

describe('loginErrorText', () => {
  // Deze code en melding zijn geverifieerd tegen de echte Supabase-API.
  it('legt verkeerde inloggegevens uit zonder te verklappen of het adres bestaat', () => {
    const t = loginErrorText({ code: 'invalid_credentials', message: 'Invalid login credentials' });
    expect(t).toContain('horen niet bij elkaar');
    expect(t).not.toMatch(/bestaat niet|onbekend adres/i);
  });

  it('wijst een onbevestigd account aan', () => {
    expect(loginErrorText({ code: 'email_not_confirmed', message: 'Email not confirmed' }))
      .toContain('nog niet bevestigd');
  });

  it('geeft onbekende fouten letterlijk door, zodat er niets verdwijnt', () => {
    expect(loginErrorText({ message: 'Iets onverwachts' })).toBe('Inloggen lukte niet: Iets onverwachts');
  });

  it('overleeft een fout zonder melding', () => {
    expect(loginErrorText({})).toBe('Inloggen lukte niet. Probeer het zo nog eens.');
  });
});

describe('signupErrorText', () => {
  it('stuurt een bestaand adres naar inloggen', () => {
    expect(signupErrorText({ code: 'user_already_exists', message: 'User already registered' }))
      .toContain('Log in plaats daarvan in');
  });

  it('herkent een te kort wachtwoord', () => {
    expect(signupErrorText({ code: 'weak_password', message: 'Password should be at least 6 characters' }))
      .toContain('acht tekens');
  });

  it('meldt het als registreren uitstaat', () => {
    expect(signupErrorText({ code: 'signup_disabled', message: 'Signups not allowed' }))
      .toContain('staat op dit moment uit');
  });

  it('wijst een typefout in het adres aan', () => {
    expect(signupErrorText({ message: 'Unable to validate email address: invalid format' }))
      .toContain('typefout');
  });
});

describe('netwerkstoringen', () => {
  // De Supabase-client geeft deze soms terug als waarde in plaats van hem te
  // gooien; dan kwam "Failed to fetch" eerder ongefilterd op het scherm.
  it('vertaalt een teruggegeven fetch-fout bij inloggen', () => {
    expect(loginErrorText({ message: 'Failed to fetch' })).toMatch(/verbinding/i);
  });

  it('vertaalt de retryable fout van de Supabase-client', () => {
    expect(signupErrorText({ message: 'Failed to fetch', code: 'AuthRetryableFetchError' }))
      .toMatch(/verbinding/i);
  });

  it('vertaalt hem ook bij het herstellen van een wachtwoord', () => {
    expect(resetErrorText({ message: 'Load failed' })).toMatch(/verbinding/i);
  });

  it('houdt een gewone inlogfout ongemoeid', () => {
    expect(loginErrorText({ code: 'invalid_credentials', message: 'Invalid login credentials' }))
      .toContain('horen niet bij elkaar');
  });
});
