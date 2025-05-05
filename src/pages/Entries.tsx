
import { useState } from 'react';
import TimelineEntryList from '@/components/TimelineEntryList';
import { TimelineEntry } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

type EntriesProps = {
  timelineEntries: TimelineEntry[];
  onDeleteEntry: (id: string) => Promise<void>;
  defaultCurrency: string;
};

const Entries = ({ timelineEntries, onDeleteEntry, defaultCurrency }: EntriesProps) => {
  const navigate = useNavigate();
  const [selectedEntry, setSelectedEntry] = useState<TimelineEntry | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<TimelineEntry | null>(null);

  const handleViewDetails = (entry: TimelineEntry) => {
    setSelectedEntry(entry);
    setIsViewDialogOpen(true);
  };

  const handleDeleteEntry = (entry: TimelineEntry) => {
    setEntryToDelete(entry);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteEntry = async () => {
    if (entryToDelete) {
      await onDeleteEntry(entryToDelete.id);
      setIsDeleteDialogOpen(false);
      setEntryToDelete(null);
    }
  };

  const formatCurrency = (amount: number, currencyCode: string = defaultCurrency) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Timeline Entries</h2>
        <Button 
          onClick={() => navigate('/new-entry')}
        >
          <Plus className="mr-1 h-4 w-4" /> New Entry
        </Button>
      </div>

      <TimelineEntryList
        timelineEntries={timelineEntries}
        onViewDetails={handleViewDetails}
        onDelete={handleDeleteEntry}
      />

      {/* View Entry Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedEntry && format(new Date(selectedEntry.date), 'PPP')}
            </DialogTitle>
            <DialogDescription>
              Wealth snapshot details
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-primary">
                {selectedEntry && formatCurrency(selectedEntry.total_amount, selectedEntry.currency)}
              </span>
            </div>

            <div className="space-y-2">
              {selectedEntry?.entries.map((entry) => (
                <div key={entry.id} className="flex justify-between items-center py-1 border-b">
                  <span>{entry.notes}</span>
                  <span className="font-medium">
                    {formatCurrency(entry.amount, entry.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this timeline entry and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteEntry} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Entries;
