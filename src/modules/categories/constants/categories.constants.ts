/**
 * Age brackets for athletes. Ranges are non-overlapping:
 * Sub-8 (0–8), Sub-10 (9–10), …, Sub-20 (19–20), Adulto (21–34), Master (35+).
 */
export interface CategoryItem {
  name: string;
  minAge: number;
  maxAge: number | null;
  displayOrder: number;
}

export const CATEGORIES: CategoryItem[] = [
  { name: 'Sub-8', minAge: 0, maxAge: 8, displayOrder: 1 },
  { name: 'Sub-10', minAge: 9, maxAge: 10, displayOrder: 2 },
  { name: 'Sub-12', minAge: 11, maxAge: 12, displayOrder: 3 },
  { name: 'Sub-14', minAge: 13, maxAge: 14, displayOrder: 4 },
  { name: 'Sub-16', minAge: 15, maxAge: 16, displayOrder: 5 },
  { name: 'Sub-18', minAge: 17, maxAge: 18, displayOrder: 6 },
  { name: 'Sub-20', minAge: 19, maxAge: 20, displayOrder: 7 },
  { name: 'Adulto', minAge: 21, maxAge: 34, displayOrder: 8 },
  { name: 'Master', minAge: 35, maxAge: null, displayOrder: 9 },
];
