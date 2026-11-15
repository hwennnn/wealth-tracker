import BulkEntryForm from "@/components/BulkEntryForm";
import {
  Category,
  CreditCard,
  CreditCardInput,
  Currency,
  ExchangeRates,
  StatementInput,
} from "@/lib/types";

type NewEntryProps = {
  categories: Category[];
  currencies: Currency[];
  cards?: CreditCard[];
  displayCurrency?: string;
  exchangeRates?: ExchangeRates | null;
  onAddEntries: (
    entries: {
      categoryId: string;
      amount: number;
      currencyCode: string;
      date: Date;
      notes: string;
    }[]
  ) => Promise<void>;
  onAddStatements?: (statements: StatementInput[]) => Promise<void>;
  onAddCard?: (input: CreditCardInput) => Promise<void>;
};

const NewEntry = ({
  categories,
  currencies,
  cards,
  displayCurrency,
  exchangeRates,
  onAddEntries,
  onAddStatements,
  onAddCard,
}: NewEntryProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">New Entry</h2>
        <p className="text-sm text-muted-foreground">
          Record asset balances and credit card statements in one snapshot
        </p>
      </div>
      <div className="max-w-4xl">
        <BulkEntryForm
          categories={categories}
          currencies={currencies}
          cards={cards}
          displayCurrency={displayCurrency}
          exchangeRates={exchangeRates}
          onSubmit={onAddEntries}
          onAddStatements={onAddStatements}
          onAddCard={onAddCard}
        />
      </div>
    </div>
  );
};

export default NewEntry;
