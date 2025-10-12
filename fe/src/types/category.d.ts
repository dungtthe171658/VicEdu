
export interface Category {
  _id: string;
  name: string;
  slug: string;
  parent_id: number | null;
  description?: string;
  created_at?: string;
  updated_at?: string;
}