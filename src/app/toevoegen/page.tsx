import { Nav } from '../Nav';
import { WineForm } from '../WineForm';

export const metadata = { title: 'Wijn toevoegen · Wijnkelder' };

export default function ToevoegenPage() {
  return (
    <main className="shell" style={{ maxWidth: 720 }}>
      <div className="masthead">
        <h1 className="wordmark" style={{ fontSize: 'clamp(26px, 4.5vw, 36px)' }}>
          Nieuwe <em>fles</em>
        </h1>
      </div>
      <div className="masthead-sub">
        <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>
          Alleen de naam is verplicht. De rest kun je later aanvullen.
        </p>
      </div>
      <Nav />
      <WineForm />
    </main>
  );
}
