import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { heeftSchil, kopTitel, TITELS } from '../src/lib/schil';

const APP = path.resolve(__dirname, '..', 'src', 'app');

function paginas(): string[] {
  const uit: string[] = [];
  const loop = (dir: string) => {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const vol = path.join(dir, item.name);
      if (item.isDirectory()) loop(vol);
      else if (item.name === 'page.tsx') uit.push(vol);
    }
  };
  loop(APP);
  return uit;
}

/** '/home/user/wijnkelder/src/app/dagboek/page.tsx' → '/dagboek' */
function routeVan(bestand: string): string {
  const rel = path.relative(APP, path.dirname(bestand));
  return rel === '' ? '/' : '/' + rel;
}

describe('welke schermen de app-schil krijgen', () => {
  it('de tabbladen wel', () => {
    for (const p of ['/', '/tijdlijn', '/dagboek', '/inzichten', '/advies', '/verlanglijst']) {
      expect(heeftSchil(p), p).toBe(true);
    }
  });

  it('de pagina van één wijn ook', () => {
    expect(heeftSchil('/wijn/abc-123')).toBe(true);
  });

  it('inloggen, wachtwoord herstellen en een deel-link niet', () => {
    for (const p of ['/inloggen', '/wachtwoord', '/auth/bevestigen', '/s/tok3n', '/ontwerp']) {
      expect(heeftSchil(p), p).toBe(false);
    }
  });

  it('een pad dat alleen begint als een kaal pad krijgt de schil wel', () => {
    // /inloggenX is geen /inloggen; zonder de scheiding op / zou dat misgaan.
    expect(heeftSchil('/inloggenX')).toBe(true);
    expect(heeftSchil('/sommelier')).toBe(true);
  });
});

describe('de titel in de balk', () => {
  it('het wordmerk op de kelder en op de pagina van één wijn', () => {
    expect(kopTitel('/')).toBeUndefined();
    expect(kopTitel('/wijn/abc-123')).toBeUndefined();
  });

  it('een titel op de andere schermen', () => {
    expect(kopTitel('/dagboek')).toEqual({ titel: 'Dagboek' });
    expect(kopTitel('/advies')).toEqual({ titel: 'Wat drink ik', cursief: 'vanavond' });
  });
});

describe('de schil staat in de layout, niet in de paginas', () => {
  // Stonden ze in de paginas, dan werden ze bij elk tabblad opnieuw opgebouwd —
  // precies de sprong en de traagheid die dit moest verhelpen. Deze test valt om
  // zodra iemand een kop of tabbalk terugzet in een pagina.
  const chroom = /<(?:Kop|TabBar|AppHeader|PageHeader)\b/;

  it.each(paginas().filter((f) => !f.includes('ontwerp')).map((f) => [routeVan(f), f]))(
    '%s rendert de schil niet zelf',
    (_route, bestand) => {
      expect(fs.readFileSync(bestand, 'utf8')).not.toMatch(chroom);
    }
  );

  it('de layout doet het wel', () => {
    const layout = fs.readFileSync(path.join(APP, 'layout.tsx'), 'utf8');
    expect(layout).toMatch(/<Chrome>/);
  });

  it('er is een plaatshouder, anders wacht een tabblad op de server', () => {
    expect(fs.existsSync(path.join(APP, 'loading.tsx'))).toBe(true);
  });
});

describe('elk tabblad met een titel bestaat ook echt', () => {
  const routes = new Set(paginas().map(routeVan));

  it.each(Object.keys(TITELS))('%s heeft een page.tsx', (route) => {
    expect(routes.has(route)).toBe(true);
  });
});
