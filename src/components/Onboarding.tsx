import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  Plus,
  X,
  ArrowRight,
  Check,
  Landmark,
  Wallet,
  PiggyBank,
  LineChart,
  CreditCard,
  Home,
  Car,
  Bitcoin,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SUGGESTED_CATEGORIES = [
  { name: "Savings", desc: "Bank savings accounts", icon: PiggyBank },
  { name: "Investments", desc: "Stocks, ETFs, funds", icon: LineChart },
  { name: "Cash", desc: "Physical cash & wallets", icon: Wallet },
  { name: "Crypto", desc: "Bitcoin, Ethereum, etc.", icon: Bitcoin },
  { name: "Property", desc: "Real estate value", icon: Home },
  { name: "CPF/Retirement", desc: "Retirement funds", icon: Landmark },
  { name: "Credit Card", desc: "Credit card debt (negative)", icon: CreditCard },
  { name: "Vehicle", desc: "Car or vehicle value", icon: Car },
];

type OnboardingProps = {
  onComplete: (categories: { name: string; description: string }[]) => Promise<void>;
};

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSuggestion = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (customCategories.includes(trimmed) || selected.has(trimmed)) {
      toast.error("Category already exists");
      return;
    }
    setCustomCategories((prev) => [...prev, trimmed]);
    setCustomInput("");
  };

  const removeCustom = (name: string) => {
    setCustomCategories((prev) => prev.filter((c) => c !== name));
  };

  const totalSelected = selected.size + customCategories.length;

  const handleSubmit = async () => {
    if (totalSelected === 0) {
      toast.error("Select at least one category");
      return;
    }

    setIsSubmitting(true);
    try {
      const categories: { name: string; description: string }[] = [];

      for (const name of selected) {
        const suggestion = SUGGESTED_CATEGORIES.find((s) => s.name === name);
        categories.push({
          name,
          description: suggestion?.desc || "",
        });
      }

      for (const name of customCategories) {
        categories.push({ name, description: "" });
      }

      await onComplete(categories);
    } catch {
      toast.error("Failed to create categories");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <TrendingUp className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Let's set up your tracker
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Choose the categories you want to track. You can always add, edit,
              or remove these later.
            </p>
          </div>

          {/* Suggested categories */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {SUGGESTED_CATEGORIES.map((cat) => {
              const isSelected = selected.has(cat.name);
              return (
                <button
                  key={cat.name}
                  onClick={() => toggleSuggestion(cat.name)}
                  className={cn(
                    "relative flex flex-col items-center gap-2 rounded-xl border p-4 transition-all text-center",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:border-primary/30 hover:bg-muted/50"
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  <cat.icon
                    className={cn(
                      "h-6 w-6",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium">{cat.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cat.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom categories */}
          {customCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {customCategories.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm"
                >
                  {name}
                  <button
                    onClick={() => removeCustom(name)}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add custom input */}
          <div className="flex gap-2 mb-8">
            <Input
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Add a custom category..."
              className="h-10"
              onKeyDown={(e) => e.key === "Enter" && addCustom()}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={addCustom}
              disabled={!customInput.trim()}
              className="h-10 px-4"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {totalSelected} categor{totalSelected === 1 ? "y" : "ies"}{" "}
              selected
            </p>
            <Button
              onClick={handleSubmit}
              disabled={totalSelected === 0 || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
