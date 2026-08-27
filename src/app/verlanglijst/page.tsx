import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Nav, TabBar } from '../Nav';
import { PageHeader } from '../Masthead';
import { WishPanel } from './WishPanel';
import type { WishlistItem } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Verlanglijst · Wijnkelder' };

export default async function VerlanglijstPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/inloggen');

  const { data: cellar } = await supabase
    .from('cellars').select('id').eq('owner_id', user.id)
    .order('created_at').limit(1).maybeSingle();

  const { data } = cellar
    ? await supabase
        .from('wishlist').select('*').eq('cellar_id', cellar.id)
        .order('created_at', { ascending: false })
    : { data: [] };

  return (
    <>
      <PageHeader titel="Nog te" cursief="proeven"
        sub="Wijnen die je nog wilt kopen. Koop je er een, dan verhuist hij met één druk naar je kelder." />
      <main className="shell" style={{ maxWidth: 720 }}>
      <Nav />
      <WishPanel items={(data ?? []) as WishlistItem[]} />
    </main>
      <TabBar />
    </>
  );
}
