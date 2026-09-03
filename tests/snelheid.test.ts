import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const WORTEL = path.resolve(__dirname, '..');
const lees = (p: string) => fs.readFileSync(path.join(WORTEL, p), 'utf8');

function bestanden(map: string, naam: RegExp): string[] {
  const uit: string[] = [];
  const loop = (dir: string) => {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const vol = path.join(dir, item.name);
      if (item.isDirectory()) loop(vol);
      else if (naam.test(item.name)) uit.push(path.relative(WORTEL, vol));
    }
  };
  loop(path.join(WORTEL, map));
  return uit;
}

/**
 * Elk netwerkritje naar Supabase telt: ze gebeuren achter elkaar, en pas daarna
 * begint de pagina te renderen. Deze tests bewaken de twee die we eruit hebben
 * gehaald, zodat ze niet ongemerkt terugkomen.
 */
describe('geen tweede aanroep naar de auth-server', () => {
  // De middleware doet er één, geverifieerd, en ververst daarmee de sessie.
  // Alles daarachter leest het token lokaal via getClaims().
  const buitenMiddleware = [
    ...bestanden('src/app', /^page\.tsx$/),
    ...bestanden('src/lib', /\.ts$/),
  ].filter((f) => !f.includes('middleware'));

  it.each(buitenMiddleware)('%s roept auth.getUser() niet aan', (bestand) => {
    expect(lees(bestand)).not.toMatch(/auth\.getUser\(/);
  });

  it('de middleware doet het wél, precies één keer', () => {
    const mw = lees('src/middleware.ts');
    expect(mw.match(/auth\.getUser\(/g)).toHaveLength(1);
  });
});

describe('de kelder en de wijnen komen in één aanvraag', () => {
  const cellar = lees('src/lib/cellar.ts');

  it('vraagt de wijnen mee op met de kelder', () => {
    expect(cellar).toMatch(/select\(\s*'id, owner_id, name, wines\(\*\)'/);
  });

  it('haalt de wijnen niet apart op', () => {
    expect(cellar).not.toMatch(/from\('wines'\)/);
  });

  it('laat verwijderde wijnen weg zonder de kelder zelf te laten vallen', () => {
    // Een filter op de meegestuurde tabel dunt die lijst uit; met een !inner-join
    // zou een kelder zonder wijnen helemaal wegvallen.
    expect(cellar).toMatch(/\.is\('wines\.deleted_at', null\)/);
    expect(cellar).not.toMatch(/wines!inner/);
  });
});

describe('schrijven ververst elk scherm dat de wijnlijst toont', () => {
  // Met een clientcache eronder valt het meteen op als er ergens nog een oude
  // lijst staat, dus alle vier moeten mee.
  const SCHERMEN = ['/', '/tijdlijn', '/inzichten', '/advies'];
  const acties = lees('src/lib/actions.ts');

  it('de hulpfunctie noemt alle vier de schermen', () => {
    const blok = /function verversWijnschermen\(\) \{([\s\S]*?)\n\}/.exec(acties)?.[1] ?? '';
    for (const scherm of SCHERMEN) expect(blok, scherm).toContain(`'${scherm}'`);
  });

  it('wijn opslaan, verwijderen en drinken gebruiken hem', () => {
    for (const fn of ['saveWine', 'deleteWine', 'drinkBottle']) {
      const start = acties.indexOf(`export async function ${fn}`);
      expect(start, fn).toBeGreaterThan(-1);
      const body = acties.slice(start, acties.indexOf('\nexport ', start + 10));
      expect(body, fn).toContain('verversWijnschermen()');
    }
  });

  it('een import ook', () => {
    const imp = lees('src/lib/import-actions.ts');
    for (const scherm of SCHERMEN) expect(imp, scherm).toContain(`'${scherm}'`);
  });
});

describe('de router houdt een bezocht scherm even vast', () => {
  it('staleTimes staat aan', () => {
    const cfg = lees('next.config.ts');
    expect(cfg).toMatch(/staleTimes:\s*\{\s*dynamic:\s*[1-9]/);
  });

  it('de tabbladen halen hun scherm alvast op', () => {
    expect(lees('src/app/Nav.tsx')).toMatch(/<Link key=\{href\} href=\{href\} prefetch/);
  });
});
