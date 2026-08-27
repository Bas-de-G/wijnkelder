import type { Metadata, Viewport } from 'next';
import { serif, sans, mono } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wijnkelder',
  description: 'Houd je wijnkelder bij: voorraad, drinkvensters, dagboek en advies bij het eten.',
  appleWebApp: {
    capable: true,
    title: 'Wijnkelder',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Laat de pagina achter de statusbalk en de home-indicator doorlopen; de
  // kop en de onderbalk houden zelf rekening met die randen.
  viewportFit: 'cover',
  // De kop is in beide thema's donker, dus de statusbalk hoort daarbij te kleuren.
  themeColor: '#52091F',
};

// Zet het opgeslagen thema vóór de eerste verf, anders flitst de app even in de
// verkeerde kleur. Bewust inline en synchroon.
const THEME_SCRIPT = `try{var t=localStorage.getItem('wk-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="nl"
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
