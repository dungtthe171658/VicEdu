export interface BookDto {
  _id: string;
  title: string;
  slug: string;
  author?: string;
  description?: string;
  price_cents: number;
  stock?: number;
  category_id: {
    _id: string;
    name: string;
  };
  is_published?: boolean;
  images?: string[];
  created_at?: string;
  updated_at?: string;
}
