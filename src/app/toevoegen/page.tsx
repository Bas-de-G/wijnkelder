import { Nav, TabBar } from '../Nav';
import { PageHeader } from '../Masthead';
import { WineForm } from '../WineForm';

export const metadata = { title: 'Wijn toevoegen · Wijnkelder' };

export default function ToevoegenPage() {
  return (
    <>
      <PageHeader titel="Nieuwe" cursief="fles"
        sub="Alleen de naam is verplicht. De rest kun je later aanvullen." />
      <main className="shell" style={{ maxWidth: 720 }}>
      <Nav />
      <WineForm />
    </main>
      <TabBar />
    </>
  );
}
