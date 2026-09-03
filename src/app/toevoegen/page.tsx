import { Nav } from '../Nav';
import { WineForm } from '../WineForm';

export const metadata = { title: 'Wijn toevoegen · Wijnkelder' };

export default function ToevoegenPage() {
  return (
    <main className="shell" style={{ maxWidth: 720 }}>
      <Nav />
      <p className="inleiding">Alleen de naam is verplicht. De rest kun je later aanvullen.</p>
      <WineForm />
    </main>
  );
}
