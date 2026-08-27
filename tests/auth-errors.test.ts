import { describe, it, expect } from 'vitest';
import { loginErrorText } from '../src/lib/auth-errors';

describe('loginErrorText', () => {
  it('noemt de resterende seconden bij de wachttijd per adres', () => {
    const t = loginErrorText({
      message: 'For security purposes, you can only request this after 47 seconds.',
      code: 'over_email_send_rate_limit',
    });
    expect(t).toContain('47 seconden');
  });

  it('valt terug op "een minuut" als er geen aantal in de melding staat', () => {
    const t = loginErrorText({ message: 'rate limit', code: 'over_email_send_rate_limit' });
    expect(t).toContain('een minuut');
  });

  it('legt de uurlimiet uit en stuurt niet naar "wacht een minuut"', () => {
    const t = loginErrorText({ message: 'email rate limit exceeded', code: 'over_request_rate_limit' });
    expect(t).toContain('uur');
    expect(t).toContain('twee per uur');
    expect(t).not.toContain('een minuut');
  });

  it('herkent de uurlimiet ook zonder foutcode', () => {
    expect(loginErrorText({ message: 'Email rate limit exceeded' })).toContain('uur');
  });

  it('wijst een typefout in het adres aan', () => {
    expect(loginErrorText({ message: 'Unable to validate email address: invalid format' }))
      .toContain('typefout');
  });

  it('geeft onbekende fouten letterlijk door, zodat er niets verdwijnt', () => {
    expect(loginErrorText({ message: 'Signups not allowed for otp' }))
      .toBe('Versturen lukte niet: Signups not allowed for otp');
  });

  it('overleeft een fout zonder melding', () => {
    expect(loginErrorText({})).toBe('Versturen lukte niet. Probeer het zo nog eens.');
  });
});
