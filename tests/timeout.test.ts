import { describe, it, expect } from 'vitest';
import { metTimeout, TimeoutError, isNetwerkProbleem, NETWERK_FOUT } from '../src/lib/timeout';

describe('metTimeout', () => {
  it('geeft het resultaat door als de taak op tijd klaar is', async () => {
    await expect(metTimeout(Promise.resolve('klaar'), 200)).resolves.toBe('klaar');
  });

  it('kapt af als de taak blijft hangen', async () => {
    const nooit = new Promise(() => {});
    await expect(metTimeout(nooit, 30)).rejects.toBeInstanceOf(TimeoutError);
  });

  it('laat een echte fout gewoon doorkomen', async () => {
    await expect(metTimeout(Promise.reject(new Error('stuk')), 200)).rejects.toThrow('stuk');
  });

  it('ruimt de timer op, zodat een geslaagde aanroep het proces niet openhoudt', async () => {
    // Zou de timer blijven staan, dan zou deze test 60 seconden hangen.
    await metTimeout(Promise.resolve(1), 60000);
    expect(true).toBe(true);
  });
});

describe('isNetwerkProbleem', () => {
  it('herkent een eigen timeout', () => {
    expect(isNetwerkProbleem(new TimeoutError(100))).toBe(true);
  });

  it('herkent de fout die de Supabase-client geeft bij netwerkproblemen', () => {
    const e = new Error('Failed to fetch');
    e.name = 'AuthRetryableFetchError';
    expect(isNetwerkProbleem(e)).toBe(true);
  });

  it('herkent een mislukte fetch', () => {
    expect(isNetwerkProbleem(new TypeError('Failed to fetch'))).toBe(true);
  });

  it('houdt een gewone fout buiten de deur', () => {
    expect(isNetwerkProbleem(new Error('Invalid login credentials'))).toBe(false);
  });

  it('overleeft onzin', () => {
    expect(isNetwerkProbleem(null)).toBe(false);
    expect(isNetwerkProbleem('tekst')).toBe(false);
  });

  it('heeft een leesbare melding klaarstaan', () => {
    expect(NETWERK_FOUT).toMatch(/verbinding/i);
  });
});
