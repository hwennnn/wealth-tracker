
export type Currency = {
  code: string;
  name: string;
  symbol: string;
};

export type Category = {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  user_id: string;
};

export type Entry = {
  id: string;
  category_id: string;
  amount: number;
  currency: string;
  date: string;
  notes?: string;
  user_id: string;
};

export type TimelineEntry = {
  id: string;
  date: string;
  entries: Entry[];
  total_amount: number;
  currency: string;
  user_id: string;
};
