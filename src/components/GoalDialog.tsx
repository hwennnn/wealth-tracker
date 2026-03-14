import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Target, Plus, Trash2 } from "lucide-react";
import { WealthGoal, addGoal, removeGoal } from "@/lib/goals";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";

type GoalDialogProps = {
  goals: WealthGoal[];
  currency: string;
  onGoalsChange: () => void;
};

const GoalDialog = ({ goals, currency, onGoalsChange }: GoalDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");

  const handleAdd = () => {
    if (!name || !amount) return;
    addGoal({
      name,
      targetAmount: parseFloat(amount),
      currency,
      deadline: deadline || new Date(Date.now() + 365 * 86400000).toISOString(),
    });
    setName("");
    setAmount("");
    setDeadline("");
    onGoalsChange();
  };

  const handleRemove = (id: string) => {
    removeGoal(id);
    onGoalsChange();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
          <Target className="h-3.5 w-3.5" />
          Goals
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Net Worth Goals</DialogTitle>
          <DialogDescription>
            Set targets to track your progress
          </DialogDescription>
        </DialogHeader>

        {/* Existing goals */}
        {goals.length > 0 && (
          <div className="space-y-2">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="text-sm font-medium">{goal.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(goal.targetAmount, currency, true)}
                    {goal.deadline &&
                      ` by ${format(new Date(goal.deadline), "MMM yyyy")}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemove(goal.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add new goal */}
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Goal Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., First $100K"
              className="h-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Target Amount</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100000"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Deadline (optional)</Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleAdd} disabled={!name || !amount} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add Goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GoalDialog;
