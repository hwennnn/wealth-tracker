import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Category, CreditCard } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { AccountPosition } from "@/lib/netWorth";
import { format } from "date-fns";
import { CreditCard as CreditCardIcon, Landmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { parseDateKey } from "@/lib/netWorth";

type AccountBreakdownProps = {
  accounts: AccountPosition[];
  categories: Category[];
  cards: CreditCard[];
  currency: string;
};

const AccountBreakdown = ({
  accounts,
  categories,
  cards,
  currency,
}: AccountBreakdownProps) => {
  const navigate = useNavigate();
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));
  const cardMap = new Map(cards.map((card) => [card.id, card]));

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
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 self-start"
            onClick={() => navigate("/cards")}
          >
            <CreditCardIcon className="h-3.5 w-3.5" />
            Manage cards
          </Button>
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
                  <ul className="space-y-1.5 border-t pt-2">
                    {account.cards.map((outstanding) => {
                      const card = cardMap.get(outstanding.cardId);
                      return (
                        <li
                          key={outstanding.cardId}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="min-w-0 truncate text-muted-foreground">
                            {card?.name || "Card"}
                            {outstanding.statementDate
                              ? ` · ${format(parseDateKey(outstanding.statementDate), "dd MMM yyyy")}`
                              : " · no statement yet"}
                          </span>
                          <span className="tabular-nums font-medium text-red-500 flex-shrink-0">
                            {outstanding.statementId
                              ? formatCurrency(-outstanding.convertedAmount, currency)
                              : "—"}
                          </span>
                        </li>
                      );
                    })}
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
