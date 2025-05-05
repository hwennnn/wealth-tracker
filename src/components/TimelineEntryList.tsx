
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Entry, TimelineEntry } from '@/lib/types';
import { format } from 'date-fns';
import { ChartBar, Trash2 } from 'lucide-react';

type TimelineEntryListProps = {
  timelineEntries: TimelineEntry[];
  onViewDetails: (entry: TimelineEntry) => void;
  onDelete: (entry: TimelineEntry) => void;
};

const TimelineEntryList = ({ timelineEntries, onViewDetails, onDelete }: TimelineEntryListProps) => {
  const formatCurrency = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline Entries</CardTitle>
      </CardHeader>
      <CardContent>
        {timelineEntries.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No entries recorded yet. Create your first wealth snapshot to start tracking.
          </p>
        ) : (
          <div className="space-y-3">
            {timelineEntries.sort((a, b) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            ).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-background border rounded-md"
              >
                <div>
                  <h3 className="font-medium">
                    {format(new Date(entry.date), 'PPP')}
                  </h3>
                  <p className="text-sm font-semibold text-primary">
                    {formatCurrency(entry.total_amount, entry.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.entries.length} asset{entry.entries.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onViewDetails(entry)}
                  >
                    <ChartBar className="h-4 w-4 text-primary" />
                    <span className="sr-only md:not-sr-only md:ml-2">View</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onDelete(entry)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimelineEntryList;
