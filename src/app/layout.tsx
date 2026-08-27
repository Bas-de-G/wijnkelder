import type { Metadata, Viewport } from 'next';
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
    <html lang="nl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..600;1,6..96,400..500&family=Karla:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
