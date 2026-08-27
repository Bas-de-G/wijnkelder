// Fonts worden bij het bouwen opgehaald en vanaf ons eigen domein geserveerd.
// Dat scheelt een externe aanvraag bij elk bezoek, voorkomt dat de pagina zonder
// letters staat als Google onbereikbaar is, en houdt bezoekersgegevens bij ons —
// wat met open registratie in de EU ook juridisch schoner is.
import { Bodoni_Moda, Karla, DM_Mono } from 'next/font/google';

export const serif = Bodoni_Moda({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-serif',
});

export const sans = Karla({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
});

export const mono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono',
});
