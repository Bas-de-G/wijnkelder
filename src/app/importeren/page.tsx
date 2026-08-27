import { Nav } from '../Nav';
import { ImportPanel } from './ImportPanel';

export const metadata = { title: 'Back-up importeren · Wijnkelder' };

export default function ImporterenPage() {
  return (
    <main className="shell" style={{ maxWidth: 720 }}>
      <div className="masthead">
        <h1 className="wordmark" style={{ fontSize: 'clamp(26px, 4.5vw, 36px)' }}>
          Kelder <em>overnemen</em>
        </h1>
      </div>
      <div className="masthead-sub">
        <p style={{ fontSize: 14, color: 'var(--ink-3)', maxWidth: '58ch' }}>
          Neem je bestaande kelder over uit een back-up van de oude app. Je ziet eerst wat er
          verandert, en pas daarna wordt er iets weggeschreven.
        </p>
      </div>
      <Nav />
      <ImportPanel />
    </main>
  );
}
