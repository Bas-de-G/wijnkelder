import { Nav, TabBar } from '../Nav';
import { PageHeader } from '../Masthead';
import { WineForm } from '../WineForm';

export const metadata = { title: 'Wijn toevoegen · Wijnkelder' };

export default function ToevoegenPage() {
  return (
    <>
      <PageHeader titel="Nieuwe" cursief="fles" />
      <main className="shell" style={{ maxWidth: 720 }}>
      <Nav />
      <p className="inleiding">Alleen de naam is verplicht. De rest kun je later aanvullen.</p>
      <WineForm />
    </main>
      <TabBar />
    </>
  );
}
