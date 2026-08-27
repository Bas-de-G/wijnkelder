import type { Metadata, Viewport } from 'next';
import { serif, sans, mono } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wijnkelder',
  description: 'Houd je wijnkelder bij: voorraad, drinkvensters, dagboek en advies bij het eten.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F2F0EA' },
    { media: '(prefers-color-scheme: dark)', color: '#131013' },
  ],
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
