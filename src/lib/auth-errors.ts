/**
 * Supabase kent twee verschillende limieten op inlogmails, en ze vragen om een
 * ander antwoord:
 *
 *   1. 60 seconden wachttijd per e-mailadres, tussen twee aanvragen voor
 *      hetzelfde adres. Daar helpt even wachten inderdaad tegen.
 *   2. Twee mails per uur voor het hele project, als je de ingebouwde
 *      mailversturing van Supabase gebruikt. Daar helpt wachten nauwelijks
 *      tegen — dat vraagt om een eigen SMTP-server.
 *
 * Ze allebei afdoen met "wacht even" stuurt mensen het verkeerde gat in.
 */
export interface AuthErrorLike {
  message?: string;
  code?: string;
}

export function loginErrorText(error: AuthErrorLike): string {
  const code = error.code ?? '';
  const msg = error.message ?? '';

  // Supabase noemt de resterende wachttijd meestal in de melding zelf.
  const seconden = msg.match(/after (\d+) seconds?/i)?.[1];
  if (seconden) {
    return `Er is net al een link naar dit adres gestuurd. Probeer het over ${seconden} seconden opnieuw.`;
  }
  if (code === 'over_email_send_rate_limit') {
    return 'Er is net al een link naar dit adres gestuurd. Probeer het over een minuut opnieuw.';
  }

  if (code === 'over_request_rate_limit' || /email rate limit/i.test(msg)) {
    return 'Het maximale aantal inlogmails voor dit uur is bereikt. Dat is een limiet van de ingebouwde mailversturing (twee per uur), niet van je account — probeer het over een uur opnieuw.';
  }

  if (/invalid/i.test(msg) && /email/i.test(msg)) {
    return 'Dat e-mailadres ziet er niet geldig uit. Controleer of er geen typefout in zit.';
  }

  return msg ? `Versturen lukte niet: ${msg}` : 'Versturen lukte niet. Probeer het zo nog eens.';
}
