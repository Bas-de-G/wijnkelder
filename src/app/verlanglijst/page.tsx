import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Nav } from '../Nav';
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
    <main className="shell" style={{ maxWidth: 720 }}>
      <div className="masthead">
        <h1 className="wordmark" style={{ fontSize: 'clamp(26px, 4.5vw, 36px)' }}>
          Nog te <em>proeven</em>
        </h1>
      </div>
      <div className="masthead-sub">
        <p style={{ fontSize: 14, color: 'var(--ink-3)', maxWidth: '54ch' }}>
          Wijnen die je nog wilt kopen. Koop je er een, dan verhuist hij met één druk naar je
          kelder.
        </p>
      </div>
      <Nav />
      <WishPanel items={(data ?? []) as WishlistItem[]} />
    </main>
  );
}
