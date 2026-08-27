import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase/server';
import { getCellarWithWines } from '@/lib/cellar';
import { Nav, TabBar } from '../Nav';
import { PageHeader } from '../Masthead';
import { Downloads } from './Downloads';
import { ShareList } from './ShareList';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Exporteren & delen · Wijnkelder' };

export interface Deellink {
  id: string;
  url: string;
  qr: string;
  aangemaakt: string;
}

/** Het adres waarop de app draait, zodat de deel-link ook op een preview klopt. */
async function basisUrl(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const protocol = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${protocol}://${host}`;
}

export default async function ExportPage() {
  const data = await getCellarWithWines();
  if (!data) redirect('/inloggen');

  const supabase = await createClient();
  const { data: rijen } = await supabase
    .from('shares')
    .select('id, token, created_at')
    .eq('cellar_id', data.cellar.id)
    .is('revoked_at', null)
    .order('created_at', { ascending: false });

  const basis = await basisUrl();
  const links: Deellink[] = await Promise.all(
    (rijen ?? []).map(async (r) => {
      const url = `${basis}/s/${r.token}`;
      return {
        id: r.id,
        url,
        // De QR wijst naar de link, niet naar de kelderinhoud zelf — zo loopt hij
        // nooit vol bij een grote kelder, en blijft hij actueel.
        qr: await QRCode.toString(url, {
          type: 'svg', margin: 0, errorCorrectionLevel: 'M',
          color: { dark: '#191416', light: '#0000' },
        }),
        aangemaakt: new Date(r.created_at).toLocaleDateString('nl-NL', {
          day: 'numeric', month: 'long', year: 'numeric',
        }),
      };
    })
  );

  return (
    <>
      <PageHeader titel="Exporteren &" cursief="delen" />
      <main className="shell" style={{ maxWidth: 760 }}>
      <Nav />

      <Downloads leeg={data.wines.length === 0} />
      <ShareList links={links} heeftWijnen={data.wines.length > 0} />
    </main>
      <TabBar />
    </>
  );
}
