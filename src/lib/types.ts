export type WineType = 'Rood' | 'Wit' | 'Rosé' | 'Mousserend' | 'Overig';

export const WINE_TYPES: WineType[] = ['Rood', 'Wit', 'Rosé', 'Mousserend', 'Overig'];

export interface Wine {
  id: string;
  cellar_id: string;
  legacy_id: string | null;
  naam: string;
  type: WineType;
  regio: string | null;
  druif: string | null;
  producent: string | null;
  herkomst: string | null;
  locatie: string | null;
  jaar: number | null;
  aantal: number;
  prijs: number | null;
  drink_from: number | null;
  drink_to: number | null;
  sterren: number;
  note: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DrinkLogEntry {
  id: string;
  cellar_id: string;
  wine_id: string | null;
  naam_snapshot: string;
  type: WineType | null;
  jaar: number | null;
  producent: string | null;
  sterren: number | null;
  met_wie: string | null;
  gelegenheid: string | null;
  note: string | null;
  gedronken_op: string;
}

export interface WishlistItem {
  id: string;
  cellar_id: string;
  naam: string;
  type: WineType;
  regio: string | null;
  druif: string | null;
  producent: string | null;
  richtprijs: number | null;
  note: string | null;
  created_at: string;
}

export interface Cellar {
  id: string;
  owner_id: string;
  name: string;
}
