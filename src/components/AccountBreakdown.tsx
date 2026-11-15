import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Category } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { AccountPosition } from "@/lib/netWorth";
import { CreditCard, Landmark } from "lucide-react";

type AccountBreakdownProps = {
  accounts: AccountPosition[];
  categories: Category[];
  currency: string;
};

const AccountBreakdown = ({
  accounts,
  categories,
  currency,
}: AccountBreakdownProps) => {
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));

  if (accounts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Landmark className="h-4 w-4 text-primary" />
              Accounts
            </CardTitle>
            <CardDescription>
              Assets, credit card balances, and net for each account
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {accounts.map((account) => {
            const name = categoryMap.get(account.categoryId) || "Account";
            return (
              <div key={account.categoryId} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-sm font-bold tabular-nums">
                    {formatCurrency(account.net, currency)}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Assets</p>
                    <p className="font-medium tabular-nums mt-0.5">
                      {formatCurrency(account.assets, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cards</p>
                    <p
                      className={`font-medium tabular-nums mt-0.5 ${
                        account.liabilities > 0 ? "text-red-500" : ""
                      }`}
                    >
                      {account.liabilities > 0
                        ? formatCurrency(-account.liabilities, currency)
                        : formatCurrency(0, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Net</p>
                    <p className="font-medium tabular-nums mt-0.5">
                      {formatCurrency(account.net, currency)}
                    </p>
                  </div>
                </div>
                {account.cards.length > 0 && (
                  <ul className="relative ml-1.5 mt-1 border-l border-foreground/30">
                    {account.cards.map((card, index) => (
                      <li key={card.categoryId} className="relative py-1 pl-3">
                        <span
                          aria-hidden
                          className="absolute left-0 top-1/2 h-px w-2.5 -translate-y-1/2 bg-foreground/30"
                        />
                        {index === account.cards.length - 1 && (
                          <span aria-hidden className="absolute -left-px top-1/2 bottom-0 w-px bg-card" />
                        )}
                        <div
                          className="flex items-center justify-between gap-2 text-xs"
                          title={`Linked to ${name}`}
                        >
                          <span className="min-w-0 truncate text-muted-foreground flex items-center gap-1.5">
                            <CreditCard className="h-3 w-3 shrink-0" />
                            {categoryMap.get(card.categoryId) || "Card"}
                          </span>
                          <span className="tabular-nums font-medium text-red-500 flex-shrink-0">
                            {formatCurrency(-card.amount, currency)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountBreakdown;
