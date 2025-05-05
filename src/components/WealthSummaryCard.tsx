
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Entry } from '@/lib/types';

type WealthSummaryProps = {
  entries: Entry[];
  totalAmount: number;
  currency: string;
};

const WealthSummaryCard = ({ entries, totalAmount, currency }: WealthSummaryProps) => {
  const formatCurrency = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Current Wealth</CardTitle>
        <CardDescription>Summary of your assets</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <span className="text-muted-foreground">Total</span>
          <span className="text-2xl font-bold text-primary">
            {formatCurrency(totalAmount, currency)}
          </span>
        </div>
        
        <div className="space-y-1">
          {entries.map((entry) => (
            <div key={entry.id} className="flex justify-between items-center py-1 border-b">
              <span>{entry.notes}</span>
              <span className="font-medium">{formatCurrency(entry.amount, entry.currency)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WealthSummaryCard;
