import { useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Categories from "@/pages/Categories";
import NewEntry from "@/pages/NewEntry";
import { currencies } from "@/lib/currencyData";
import type { Category } from "@/lib/types";
import type { CategoryDraft } from "@/components/CategoryForm";
import { demoCategories, demoLatestEntries, demoRates, demoTimeline } from "./demoData";

/**
 * Dev-only preview. `npm run dev` then open `/?demo=1`.
 * Production builds replace import.meta.env.DEV with false, so this route stays closed.
 */
const DemoApp = () => {
  const [displayCurrency, setDisplayCurrency] = useState("SGD");
  const [categories, setCategories] = useState<Category[]>(demoCategories);
  const latestEntries = useMemo(() => demoLatestEntries, []);

  const addCategory = async (draft: CategoryDraft) => {
    setCategories((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: draft.name,
        description: draft.description,
        kind: draft.kind,
        parent_id: draft.kind === "credit_card" ? draft.parentId : null,
        created_at: new Date().toISOString(),
        user_id: "demo-user",
      },
    ]);
  };

  const updateCategory = async (id: string, draft: CategoryDraft) => {
    setCategories((prev) =>
      prev.map((category) =>
        category.id === id
          ? {
              ...category,
              name: draft.name,
              description: draft.description,
              kind: draft.kind,
              parent_id: draft.kind === "credit_card" ? draft.parentId : null,
            }
          : category
      )
    );
  };

  const deleteCategory = async (id: string) => {
    setCategories((prev) =>
      prev
        .filter((category) => category.id !== id)
        .map((category) =>
          category.parent_id === id ? { ...category, parent_id: null } : category
        )
    );
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
                  categories={categories}
                  exchangeRates={demoRates}
                  allEntries={demoTimeline.flatMap((timeline) => timeline.entries)}
                  suppressMilestones
                />
              </Layout>
            }
          />
          <Route
            path="/categories"
            element={
              <Layout demo onCurrencyChange={setDisplayCurrency}>
                <Categories
                  categories={categories}
                  onAddCategory={addCategory}
                  onUpdateCategory={updateCategory}
                  onDeleteCategory={deleteCategory}
                />
              </Layout>
            }
          />
          <Route
            path="/new-entry"
            element={
              <Layout demo onCurrencyChange={setDisplayCurrency}>
                <NewEntry
                  categories={categories}
                  currencies={currencies}
                  onAddEntries={async () => {}}
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
