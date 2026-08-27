// End-to-end controle van de gehardde legacy-app (fase 1).
// Draait met: node tests/legacy.spec.mjs
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import os from 'os';

const here = path.dirname(fileURLToPath(import.meta.url));
const appUrl = 'file://' + path.resolve(here, '..', 'legacy', 'wijnkelder.html');

let failed = 0;
function check(name, cond, detail = '') {
  console.log(`${cond ? '  PASS' : '  FAIL'}  ${name}${cond || !detail ? '' : ' — ' + detail}`);
  if (!cond) failed++;
}

const browser = await chromium.launch();
// Ruim venster: de zwevende plus-knop en de onderbalk staan anders over de kaarten heen.
const ctx = await browser.newContext({ viewport: { width: 900, height: 1400 } });
const page = await ctx.newPage();

const dialogs = [];
page.on('dialog', async d => { dialogs.push(d.message()); await d.dismiss(); });
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(String(e)));

await page.goto(appUrl);
await page.waitForFunction(() => window.storageReady === true || typeof wines !== 'undefined');

// helper: voeg een wijn toe via het formulier
async function addWine(naam, extra = {}) {
  await page.evaluate(({ naam, extra }) => {
    clearForm();
    document.getElementById('f-naam').value = naam;
    for (const [id, v] of Object.entries(extra)) document.getElementById(id).value = v;
  }, { naam, extra });
  await page.evaluate(() => saveWine());
  // eventuele duplicaat-bevestiging wegklikken
  if (await page.locator('#confirm-modal.open').count()) {
    await page.evaluate(() => confirmAnswer(true));
  }
}

console.log('\n1. XSS — wijnnaam met script-payload');
const payload = '<img src=x onerror=alert(1)>';
await addWine(payload, { 'f-note': '<b>vet</b> & "aanhalingstekens"', 'f-regio': '<script>alert(2)</script>' });
await page.waitForTimeout(300);
const cardText = await page.locator('#wine-list .wcc-name').first().innerText();
check('naam wordt als tekst getoond', cardText === payload, `kreeg: ${cardText}`);
check('geen <img> geinjecteerd in de lijst',
  (await page.locator('#wine-list img').count()) === 0);
check('geen <script> geinjecteerd in de lijst',
  (await page.locator('#wine-list script').count()) === 0);
check('geen alert-dialoog', dialogs.length === 0, dialogs.join(' | '));

// ook de uitgeklapte weergave (chips + notitie) controleren
await page.evaluate(() => { collapsedIds.clear(); renderList(); });
await page.waitForTimeout(200);
check('notitie ge-escaped', (await page.locator('#wine-list .wc-notes').first().innerText()).includes('<b>vet</b>'));
check('regio-chip ge-escaped', (await page.locator('#wine-list script, #wine-list img').count()) === 0);

console.log('\n2. ID-uniciteit — twee wijnen direct achter elkaar');
await addWine('Wijn A');
await addWine('Wijn B');
const ids = await page.evaluate(() => wines.map(w => String(w.id)));
check('alle id\'s uniek', new Set(ids).size === ids.length, ids.join(', '));
check('id\'s zijn tekst', ids.every(i => typeof i === 'string'));
check('nieuwe id\'s zijn geen tijdstempel', ids.slice(-2).every(i => !/^\d+$/.test(i)), ids.slice(-2).join(', '));

console.log('\n3. Knoppen werken met tekst-id\'s');
await page.evaluate(() => { collapsedIds.clear(); renderList(); });
await page.waitForTimeout(200);
const before = await page.evaluate(() => wines.length);
await page.locator('#wine-list .btn-del').first().click();
await page.evaluate(() => confirmAnswer(true));
await page.waitForTimeout(200);
const after = await page.evaluate(() => wines.length);
check('verwijderknop verwijdert precies één wijn', after === before - 1, `${before} -> ${after}`);
check('geen JS-fouten bij klikken', pageErrors.length === 0, pageErrors.join(' | '));

console.log('\n4. Export draagt versienummer');
const payloadV2 = await page.evaluate(() => backupPayload());
check('version === 2', payloadV2.version === 2);
check('bevat wines/log/wishlist',
  Array.isArray(payloadV2.wines) && Array.isArray(payloadV2.log) && Array.isArray(payloadV2.wishlist));

console.log('\n5. Import voegt samen in plaats van te vervangen');
await page.evaluate(() => {
  wines = [
    { id: 'a1', naam: 'Bestaande wijn', type: 'Rood', jaar: '2019', aantal: 2, note: '' },
    { id: 'a2', naam: 'Ongewijzigd', type: 'Wit', jaar: '2020', aantal: 1, note: 'zelfde' }
  ];
  dlog = []; wishlist = [];
});
// plan en toepassing moeten in dezelfde JS-context blijven: plan.ops bevat
// verwijzingen naar de live wijn-objecten, en die overleven serialisatie niet.
const { plan, merged } = await page.evaluate(() => {
  const plan = planWineMerge([
    { id: 'a1', naam: 'Bestaande wijn', type: 'Rood', jaar: '2019', aantal: 2, note: 'aangevuld door Claude' },
    { id: 'a2', naam: 'Ongewijzigd', type: 'Wit', jaar: '2020', aantal: 1, note: 'zelfde' },
    { naam: 'Nieuwe wijn', type: 'Rood', jaar: '2021', aantal: 1 }
  ]);
  const counts = { nieuw: plan.nieuw, bijgewerkt: plan.bijgewerkt, ongewijzigd: plan.ongewijzigd };
  applyWineMerge(plan);
  return { plan: counts, merged: wines.map(w => ({ naam: w.naam, note: w.note })) };
});
check('1 nieuw', plan.nieuw === 1, String(plan.nieuw));
check('1 bijgewerkt', plan.bijgewerkt === 1, String(plan.bijgewerkt));
check('1 ongewijzigd', plan.ongewijzigd === 1, String(plan.ongewijzigd));
check('bestaande wijn behouden en aangevuld',
  merged.find(w => w.naam === 'Bestaande wijn')?.note === 'aangevuld door Claude');
check('nieuwe wijn toegevoegd', !!merged.find(w => w.naam === 'Nieuwe wijn'));
check('niets verdwenen', merged.length === 3, String(merged.length));

console.log('\n6. Samenvoegen matcht ook op naam+jaar als id\'s verschillen');
await page.evaluate(() => {
  wines = [{ id: 'x1', naam: 'Barolo', type: 'Rood', jaar: '2016', aantal: 1, note: '' }];
});
const plan2 = await page.evaluate(() => planWineMerge([
  { id: 'heel-ander-id', naam: 'Barolo', type: 'Rood', jaar: '2016', aantal: 1, note: 'van ander apparaat' }
]));
check('geen duplicaat bij afwijkend id', plan2.nieuw === 0 && plan2.bijgewerkt === 1,
  `nieuw=${plan2.nieuw} bijgewerkt=${plan2.bijgewerkt}`);

console.log('\n7. normalizeIds maakt oude getal-id\'s tekst');
await page.evaluate(() => {
  wines = [{ id: 1756219000000, naam: 'Oud record', type: 'Rood' }];
  dlog = [{ id: 1756219000001, wid: 1756219000000, naam: 'Oud record' }];
  wishlist = [{ id: 1756219000002, naam: 'Wens' }];
  normalizeIds();
});
const norm = await page.evaluate(() => ({
  w: typeof wines[0].id, l: typeof dlog[0].id, wid: typeof dlog[0].wid, wl: typeof wishlist[0].id,
  waarde: wines[0].id
}));
check('wijn-id is tekst', norm.w === 'string');
check('dagboek-id is tekst', norm.l === 'string');
check('dagboek-verwijzing is tekst', norm.wid === 'string');
check('verlanglijst-id is tekst', norm.wl === 'string');
check('waarde blijft behouden', norm.waarde === '1756219000000', norm.waarde);

console.log('\n8. Echte import via bestandskeuze (het pad dat in de app gebruikt wordt)');
await page.evaluate(() => {
  wines = [{ id: 'b1', naam: 'Chablis', type: 'Wit', jaar: '2021', aantal: 3, note: '' }];
  dlog = []; wishlist = [];
  renderList();
});
const backupFile = path.join(os.tmpdir(), 'wijnkelder-test-backup.json');
fs.writeFileSync(backupFile, JSON.stringify({
  version: 2,
  wines: [
    { id: 'b1', naam: 'Chablis', type: 'Wit', jaar: '2021', aantal: 3, note: 'Wijnhuis: aangevuld' },
    { id: 'b2', naam: 'Rioja Reserva', type: 'Rood', jaar: '2018', aantal: 2 }
  ],
  log: [{ id: 'l1', wid: 'b1', naam: 'Chablis', ts: Date.now() }],
  wishlist: [{ id: 'q1', naam: 'Chateau Musar', type: 'Rood' }]
}));

await page.setInputFiles('#imp', backupFile);
await page.waitForSelector('#confirm-modal.open', { timeout: 5000 });
const modalText = await page.locator('#confirm-msg').innerText();
check('bevestiging toont telling vooraf', /1 nieuw/.test(modalText) && /1 bijgewerkt/.test(modalText), modalText);
check('keuze "Alles vervangen" is zichtbaar',
  await page.locator('#confirm-alt:visible').count() === 1);
check('hoofdknop heet "Samenvoegen"',
  (await page.locator('#confirm-primary').innerText()).includes('Samenvoegen'));

await page.locator('#confirm-primary').click();
await page.waitForTimeout(400);
const na = await page.evaluate(() => ({
  wijnen: wines.map(w => w.naam).sort(),
  chablisNote: wines.find(w => w.naam === 'Chablis').note,
  log: dlog.length, wish: wishlist.length
}));
check('bestaande wijn behouden, nieuwe erbij',
  na.wijnen.join(',') === 'Chablis,Rioja Reserva', na.wijnen.join(','));
check('bestaande wijn is aangevuld', na.chablisNote === 'Wijnhuis: aangevuld', na.chablisNote);
check('dagboekregel overgenomen', na.log === 1, String(na.log));
check('verlanglijst-item overgenomen', na.wish === 1, String(na.wish));

const preBackup = await page.evaluate(async () => {
  const r = await Store.get('wijnkelder-preimport-backup', false);
  return r && r.value ? JSON.parse(r.value) : null;
});
check('veiligheidskopie voor de import bewaard',
  !!preBackup && preBackup.wines.length === 1 && preBackup.wines[0].naam === 'Chablis',
  preBackup ? String(preBackup.wines.length) : 'ontbreekt');

fs.unlinkSync(backupFile);

check('geen onverwachte JS-fouten', pageErrors.length === 0, pageErrors.join(' | '));

await browser.close();
console.log(`\n${failed === 0 ? 'Alle controles geslaagd.' : failed + ' controle(s) mislukt.'}`);
process.exit(failed ? 1 : 0);
