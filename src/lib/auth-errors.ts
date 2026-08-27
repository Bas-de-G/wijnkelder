/**
 * Foutmeldingen van Supabase omzetten naar iets waar je wat aan hebt.
 *
 * Let op de twee verschillende limieten op mails, die makkelijk verward worden:
 *   1. 60 seconden wachttijd per e-mailadres, tussen twee aanvragen voor
 *      hetzelfde adres. Daar helpt even wachten tegen.
 *   2. Twee mails per uur voor het hele project, zolang de ingebouwde
 *      mailversturing van Supabase aanstaat. Daar helpt wachten nauwelijks
 *      tegen — dat vraagt om eigen SMTP.
 * Ze allebei afdoen met "wacht even" stuurt mensen het verkeerde gat in.
 */
import { isNetwerkProbleem, NETWERK_FOUT } from './timeout';

export interface AuthErrorLike {
  message?: string;
  code?: string;
  status?: number;
}

/**
 * De Supabase-client geeft een netwerkstoring soms terug als foutwaarde in plaats
 * van hem te gooien. Dan komt "Failed to fetch" ongefilterd op het scherm, wat
 * niemand verder helpt. Vandaar dat elke vertaling hier begint.
 */
function netwerkText(error: AuthErrorLike): string | null {
  return isNetwerkProbleem(error) ? NETWERK_FOUT : null;
}

function rateLimitText(error: AuthErrorLike): string | null {
  const code = error.code ?? '';
  const msg = error.message ?? '';

  // Supabase noemt de resterende wachttijd meestal in de melding zelf.
  const seconden = msg.match(/after (\d+) seconds?/i)?.[1];
  if (seconden) {
    return `Er is net al een mail naar dit adres gestuurd. Probeer het over ${seconden} seconden opnieuw.`;
  }
  if (code === 'over_email_send_rate_limit') {
    return 'Er is net al een mail naar dit adres gestuurd. Probeer het over een minuut opnieuw.';
  }
  if (code === 'over_request_rate_limit' || /email rate limit/i.test(msg)) {
    return 'Het maximale aantal mails voor dit uur is bereikt. Dat is een limiet van de ingebouwde mailversturing (twee per uur), niet van je account — probeer het over een uur opnieuw.';
  }
  return null;
}

export function loginErrorText(error: AuthErrorLike): string {
  const netwerk = netwerkText(error);
  if (netwerk) return netwerk;

  const limiet = rateLimitText(error);
  if (limiet) return limiet;

  const code = error.code ?? '';
  const msg = error.message ?? '';

  if (code === 'invalid_credentials' || /invalid login credentials/i.test(msg)) {
    return 'Dat e-mailadres en wachtwoord horen niet bij elkaar. Weet je zeker dat je hier al een account hebt?';
  }
  if (code === 'email_not_confirmed' || /email not confirmed/i.test(msg)) {
    return 'Dit account is nog niet bevestigd. Klik eerst op de link in de mail die je bij het aanmaken kreeg.';
  }
  if (/invalid/i.test(msg) && /email/i.test(msg)) {
    return 'Dat e-mailadres ziet er niet geldig uit. Controleer of er geen typefout in zit.';
  }
  return msg ? `Inloggen lukte niet: ${msg}` : 'Inloggen lukte niet. Probeer het zo nog eens.';
}

export function signupErrorText(error: AuthErrorLike): string {
  const netwerk = netwerkText(error);
  if (netwerk) return netwerk;

  const limiet = rateLimitText(error);
  if (limiet) return limiet;

  const code = error.code ?? '';
  const msg = error.message ?? '';

  if (code === 'user_already_exists' || /already registered|already been registered/i.test(msg)) {
    return 'Er bestaat al een account met dit e-mailadres. Log in plaats daarvan in.';
  }
  if (code === 'weak_password' || /password.*(6|at least|should be)/i.test(msg)) {
    return 'Kies een wachtwoord van minstens acht tekens.';
  }
  if (code === 'signup_disabled' || /signups? not allowed|signup is disabled/i.test(msg)) {
    return 'Registreren staat op dit moment uit.';
  }
  if (/invalid/i.test(msg) && /email/i.test(msg)) {
    return 'Dat e-mailadres ziet er niet geldig uit. Controleer of er geen typefout in zit.';
  }
  return msg ? `Account maken lukte niet: ${msg}` : 'Account maken lukte niet. Probeer het zo nog eens.';
}

export function resetErrorText(error: AuthErrorLike): string {
  return netwerkText(error) ?? rateLimitText(error) ??
    (error.message ? `Versturen lukte niet: ${error.message}` : 'Versturen lukte niet.');
}
