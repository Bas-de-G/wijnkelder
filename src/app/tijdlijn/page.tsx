import { redirect } from 'next/navigation';
import { getCellarWithWines } from '@/lib/cellar';
import { Nav, TabBar } from '../Nav';
import { PageHeader } from '../Masthead';
import { Tijdlijn } from './Tijdlijn';

export const dynamic = 'force-dynamic';

export default async function TijdlijnPagina() {
  const data = await getCellarWithWines();
  if (!data) redirect('/inloggen');

  return (
    <>
      <PageHeader titel="Tijdlijn" />
      <main className="shell" style={{ maxWidth: 900 }}>
        <Nav />
        <p className="inleiding">
          Elk drinkvenster op dezelfde schaal, gegroepeerd op wat er als eerste om aandacht vraagt.
          De verticale lijn is dit jaar: wat erlinks van eindigt heb je gemist, wat erover heen
          loopt kun je nu opentrekken.
        </p>
        <Tijdlijn wines={data.wines} />
      </main>
      <TabBar />
    </>
  );
}
