import BulkEntryForm from "@/components/BulkEntryForm";
import { Category, Currency } from "@/lib/types";

type NewEntryProps = {
  categories: Category[];
  currencies: Currency[];
  onAddEntries: (
    entries: {
      categoryId: string;
      amount: number;
      currencyCode: string;
      date: Date;
      notes: string;
    }[]
  ) => Promise<void>;
};

const NewEntry = ({ categories, currencies, onAddEntries }: NewEntryProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">New Entry</h2>
        <p className="text-sm text-muted-foreground">
          Record a wealth snapshot across all your assets at once
        </p>
      </div>
      <div className="max-w-4xl">
        <BulkEntryForm
          categories={categories}
          currencies={currencies}
          onSubmit={onAddEntries}
        />
      </div>
    </div>
  );
};

export default NewEntry;
