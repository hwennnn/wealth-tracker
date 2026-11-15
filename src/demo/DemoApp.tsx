import { useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import CardsPage from "@/pages/Cards";
import NewEntry from "@/pages/NewEntry";
import { currencies } from "@/lib/currencyData";
import type { CreditCard, CreditCardInput, CreditCardStatement, StatementInput } from "@/lib/types";
import {
  demoCards,
  demoCategories,
  demoLatestEntries,
  demoRates,
  demoStatements,
  demoTimeline,
} from "./demoData";

/**
 * Dev-only preview. `npm run dev` then open `/?demo=1`.
 * Production builds replace import.meta.env.DEV with false, so this route stays closed.
 */
const DemoApp = () => {
  const [displayCurrency, setDisplayCurrency] = useState("SGD");
  const [cards, setCards] = useState<CreditCard[]>(demoCards);
  const [statements, setStatements] = useState<CreditCardStatement[]>(demoStatements);

  const latestEntries = useMemo(() => demoLatestEntries, []);

  const addCard = async (input: CreditCardInput) => {
    setCards((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        category_id: input.category_id,
        name: input.name,
        currency: input.currency,
        notes: input.notes ?? null,
        user_id: "demo-user",
        created_at: new Date().toISOString(),
      },
    ]);
  };

  const updateCard = async (id: string, input: CreditCardInput) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === id
          ? {
              ...card,
              category_id: input.category_id,
              name: input.name,
              currency: input.currency,
              notes: input.notes ?? null,
            }
          : card
      )
    );
  };

  const deleteCard = async (id: string) => {
    setCards((prev) => prev.filter((card) => card.id !== id));
    setStatements((prev) => prev.filter((statement) => statement.credit_card_id !== id));
  };

  const addStatement = async (input: StatementInput) => {
    setStatements((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        credit_card_id: input.credit_card_id,
        statement_date: input.statement_date,
        period_start: input.period_start ?? null,
        balance_owed: input.balance_owed,
        due_date: input.due_date ?? null,
        minimum_payment: input.minimum_payment ?? null,
        currency: input.currency,
        notes: input.notes ?? null,
        user_id: "demo-user",
        created_at: new Date().toISOString(),
      },
    ]);
  };

  const updateStatement = async (id: string, input: StatementInput) => {
    setStatements((prev) =>
      prev.map((statement) =>
        statement.id === id
          ? {
              ...statement,
              statement_date: input.statement_date,
              period_start: input.period_start ?? null,
              balance_owed: input.balance_owed,
              due_date: input.due_date ?? null,
              minimum_payment: input.minimum_payment ?? null,
              currency: input.currency,
              notes: input.notes ?? null,
            }
          : statement
      )
    );
  };

  const deleteStatement = async (id: string) => {
    setStatements((prev) => prev.filter((statement) => statement.id !== id));
  };

  return (
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route
            path="/"
            element={
              <Layout demo onCurrencyChange={setDisplayCurrency}>
                <Dashboard
                  timelineEntries={demoTimeline}
                  latestEntries={latestEntries}
                  totalAmount={0}
                  displayCurrency={displayCurrency}
                  categories={demoCategories}
                  exchangeRates={demoRates}
                  allEntries={demoTimeline.flatMap((timeline) => timeline.entries)}
                  cards={cards}
                  statements={statements}
                  suppressMilestones
                />
              </Layout>
            }
          />
          <Route
            path="/cards"
            element={
              <Layout demo onCurrencyChange={setDisplayCurrency}>
                <CardsPage
                  categories={demoCategories}
                  latestEntries={latestEntries}
                  cards={cards}
                  statements={statements}
                  displayCurrency={displayCurrency}
                  exchangeRates={demoRates}
                  onAddCard={addCard}
                  onUpdateCard={updateCard}
                  onDeleteCard={deleteCard}
                  onAddStatement={addStatement}
                  onUpdateStatement={updateStatement}
                  onDeleteStatement={deleteStatement}
                />
              </Layout>
            }
          />
          <Route
            path="/new-entry"
            element={
              <Layout demo onCurrencyChange={setDisplayCurrency}>
                <NewEntry
                  categories={demoCategories}
                  currencies={currencies}
                  cards={cards}
                  displayCurrency={displayCurrency}
                  exchangeRates={demoRates}
                  onAddEntries={async () => {}}
                  onAddStatements={async (inputs) => {
                    for (const input of inputs) await addStatement(input);
                  }}
                  onAddCard={addCard}
                />
              </Layout>
            }
          />
          <Route path="*" element={<Navigate to="/?demo=1" replace />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  );
};

export default DemoApp;
