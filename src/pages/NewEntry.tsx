
import { useState, useEffect } from 'react';
import EntryForm from '@/components/EntryForm';
import { Category, Currency } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type NewEntryProps = {
  categories: Category[];
  currencies: Currency[];
  onAddEntry: (data: {
    categoryId: string;
    amount: number;
    currencyCode: string;
    date: Date;
    notes: string;
  }) => Promise<void>;
};

const NewEntry = ({ categories, currencies, onAddEntry }: NewEntryProps) => {
  const [showHelpCard, setShowHelpCard] = useState(true);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Record New Entry</h2>
        <p className="text-muted-foreground mt-1">Track your wealth at a specific point in time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <EntryForm 
            categories={categories} 
            currencies={currencies} 
            onSubmit={onAddEntry} 
          />
        </div>
        
        {showHelpCard && (
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Tips for Recording Entries</CardTitle>
                <CardDescription>
                  How to track your wealth effectively
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">Select the right category</h4>
                  <p className="text-sm text-muted-foreground">
                    Choose or create appropriate categories for different accounts or asset types.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Be consistent with dates</h4>
                  <p className="text-sm text-muted-foreground">
                    Try to record entries on the same date each month for better tracking.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Add helpful notes</h4>
                  <p className="text-sm text-muted-foreground">
                    Include relevant information like account numbers or investment details.
                  </p>
                </div>
                <button 
                  onClick={() => setShowHelpCard(false)}
                  className="text-sm text-primary underline mt-4"
                >
                  Hide Tips
                </button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewEntry;
