import { Nav } from '../Nav';
import { ImportPanel } from './ImportPanel';

export const metadata = { title: 'Back-up importeren · Wijnkelder' };

export default function ImporterenPage() {
  return (
    <main className="shell" style={{ maxWidth: 720 }}>
      <Nav />
      <p className="inleiding">Neem je bestaande kelder over uit een back-up. Je ziet eerst wat er verandert, en pas daarna wordt er iets weggeschreven.</p>
      <ImportPanel />
    </main>
  );
}
