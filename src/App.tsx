import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { toast } from "sonner";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  useUser,
  useClerk,
} from "@clerk/clerk-react";
import Layout from "./components/Layout";
import { supabase } from "./integrations/supabase/client";
import { currencies } from "./lib/currencyData";
import { fetchExchangeRates, getDisplayCurrency } from "./lib/currency";
import { migrateUserData } from "./lib/auth";
import { Category, Entry, ExchangeRates, TimelineEntry } from "./lib/types";
import Auth from "./pages/Auth";
import Categories from "./pages/Categories";
import Dashboard from "./pages/Dashboard";
import Entries from "./pages/Entries";
import NewEntry from "./pages/NewEntry";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Onboarding from "./components/Onboarding";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

const queryClient = new QueryClient();

const AuthenticatedApp = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const userId = user?.id ?? null;

  const [categories, setCategories] = useState<Category[]>([]);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [latestEntries, setLatestEntries] = useState<Entry[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [displayCurrency, setDisplayCurrency] = useState(getDisplayCurrency());
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  // Fetch exchange rates on mount
  useEffect(() => {
    fetchExchangeRates("USD").then(setExchangeRates).catch(console.error);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out");
    }
  };

  // Category CRUD
  const handleAddCategory = async (name: string, description: string) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("categories")
      .insert([{ name, description, user_id: userId }])
      .select()
      .single();
    if (error) throw error;
    setCategories((prev) => [...prev, data]);
  };

  const handleUpdateCategory = async (
    id: string,
    name: string,
    description: string
  ) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("categories")
      .update({ name, description })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw error;
    setCategories((prev) => prev.map((c) => (c.id === id ? data : c)));
  };

  const handleDeleteCategory = async (id: string) => {
    if (!userId) return;
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Bulk entry creation
  const handleAddEntries = async (
    entries: {
      categoryId: string;
      amount: number;
      currencyCode: string;
      date: Date;
      notes: string;
    }[]
  ) => {
    if (!userId) return;

    const rows = entries.map((e) => ({
      category_id: e.categoryId,
      amount: e.amount,
      currency: e.currencyCode,
      date: e.date.toISOString(),
      notes: e.notes,
      user_id: userId,
    }));

    const { data: insertedData, error } = await supabase
      .from("entries")
      .insert(rows)
      .select();

    if (error) throw error;
    if (!insertedData) return;

    setTimelineEntries((prev) => {
      const updated = [...prev];
      for (const entry of insertedData) {
        const dateStr = new Date(entry.date).toDateString();
        const existingIdx = updated.findIndex(
          (t) => new Date(t.date).toDateString() === dateStr
        );
        if (existingIdx >= 0) {
          const timeline = { ...updated[existingIdx] };
          timeline.entries = [...timeline.entries, entry];
          timeline.total_amount = timeline.entries.reduce(
            (sum, e) => sum + e.amount,
            0
          );
          updated[existingIdx] = timeline;
        } else {
          updated.push({
            id: `timeline-${dateStr}`,
            date: entry.date,
            entries: [entry],
            total_amount: entry.amount,
            currency: entry.currency,
            user_id: entry.user_id,
          });
        }
      }
      return updated;
    });
  };

  // Update a single entry
  const handleUpdateEntry = async (
    entryId: string,
    updates: { amount?: number; currency?: string; category_id?: string; notes?: string }
  ) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("entries")
      .update(updates)
      .eq("id", entryId)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw error;

    setTimelineEntries((prev) =>
      prev.map((timeline) => {
        const idx = timeline.entries.findIndex((e) => e.id === entryId);
        if (idx === -1) return timeline;
        const updatedEntries = [...timeline.entries];
        updatedEntries[idx] = data;
        return {
          ...timeline,
          entries: updatedEntries,
          total_amount: updatedEntries.reduce((s, e) => s + e.amount, 0),
        };
      })
    );
  };

  // Delete entries by their real DB IDs
  const handleDeleteEntries = async (entryIds: string[]) => {
    if (!userId) return;
    const { error } = await supabase
      .from("entries")
      .delete()
      .in("id", entryIds)
      .eq("user_id", userId);
    if (error) throw error;

    setTimelineEntries((prev) => {
      const updated: TimelineEntry[] = [];
      for (const timeline of prev) {
        const remaining = timeline.entries.filter(
          (e) => !entryIds.includes(e.id)
        );
        if (remaining.length > 0) {
          updated.push({
            ...timeline,
            entries: remaining,
            total_amount: remaining.reduce((s, e) => s + e.amount, 0),
          });
        }
      }
      return updated;
    });
  };

  // Derive latest entries from timeline
  const updateLatestEntries = useCallback(() => {
    if (timelineEntries.length > 0) {
      const sorted = [...timelineEntries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const mostRecent = sorted[0];
      setLatestEntries(mostRecent.entries);
      setTotalAmount(mostRecent.total_amount);
    } else {
      setLatestEntries([]);
      setTotalAmount(0);
    }
  }, [timelineEntries]);

  // Fetch data + run migration when user is available
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      // Run one-time migration from Supabase auth user_id to Clerk user_id
      await migrateUserData(userId);

      const [catResult, entryResult] = await Promise.all([
        supabase.from("categories").select("*").eq("user_id", userId),
        supabase
          .from("entries")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: false }),
      ]);

      if (catResult.error)
        console.error("Error fetching categories:", catResult.error);
      else setCategories(catResult.data || []);

      if (entryResult.error) {
        console.error("Error fetching entries:", entryResult.error);
        return;
      }

      const grouped: Record<string, TimelineEntry> = {};
      for (const entry of entryResult.data || []) {
        const dateStr = new Date(entry.date).toDateString();
        if (!grouped[dateStr]) {
          grouped[dateStr] = {
            id: `timeline-${dateStr}`,
            date: entry.date,
            entries: [],
            total_amount: 0,
            currency: entry.currency,
            user_id: entry.user_id,
          };
        }
        grouped[dateStr].entries.push(entry);
        grouped[dateStr].total_amount += entry.amount;
      }
      setTimelineEntries(Object.values(grouped));
      setIsLoading(false);
    };

    fetchData();
  }, [userId]);

  useEffect(() => {
    updateLatestEntries();
  }, [timelineEntries, updateLatestEntries]);

  const handleCurrencyChange = (code: string) => {
    setDisplayCurrency(code);
  };

  // Onboarding: bulk-create categories
  const handleOnboardingComplete = async (
    cats: { name: string; description: string }[]
  ) => {
    if (!userId) return;
    const rows = cats.map((c) => ({
      name: c.name,
      description: c.description,
      user_id: userId,
    }));
    const { data, error } = await supabase
      .from("categories")
      .insert(rows)
      .select();
    if (error) throw error;
    setCategories(data || []);
    toast.success(`Created ${cats.length} categories!`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center animate-pulse">
            <svg className="h-5 w-5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          </div>
          <p className="text-sm text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if user has no categories
  if (categories.length === 0) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout onLogout={handleLogout} onCurrencyChange={handleCurrencyChange}>
            <Dashboard
              timelineEntries={timelineEntries}
              latestEntries={latestEntries}
              totalAmount={totalAmount}
              displayCurrency={displayCurrency}
              categories={categories}
              exchangeRates={exchangeRates}
              allEntries={timelineEntries.flatMap((t) => t.entries)}
            />
          </Layout>
        }
      />
      <Route
        path="/categories"
        element={
          <Layout onLogout={handleLogout} onCurrencyChange={handleCurrencyChange}>
            <Categories
              categories={categories}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          </Layout>
        }
      />
      <Route
        path="/new-entry"
        element={
          <Layout onLogout={handleLogout} onCurrencyChange={handleCurrencyChange}>
            <NewEntry
              categories={categories}
              currencies={currencies}
              onAddEntries={handleAddEntries}
            />
          </Layout>
        }
      />
      <Route
        path="/entries"
        element={
          <Layout onLogout={handleLogout} onCurrencyChange={handleCurrencyChange}>
            <Entries
              timelineEntries={timelineEntries}
              onDeleteEntries={handleDeleteEntries}
              onUpdateEntry={handleUpdateEntry}
              onImportEntries={handleAddEntries}
              displayCurrency={displayCurrency}
              categories={categories}
              exchangeRates={exchangeRates}
            />
          </Layout>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const clerkAppearance = {
  variables: {
    colorPrimary: "hsl(220, 70%, 50%)",
    colorText: "hsl(224, 71%, 4%)",
    colorTextSecondary: "hsl(220, 9%, 46%)",
    colorBackground: "hsl(0, 0%, 100%)",
    colorInputBackground: "hsl(0, 0%, 100%)",
    colorInputText: "hsl(224, 71%, 4%)",
    borderRadius: "0.75rem",
    fontFamily: "inherit",
  },
  elements: {
    card: "shadow-none border rounded-2xl",
    socialButtonsBlockButton: "border font-medium",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm",
    footerActionLink: "text-primary hover:text-primary/80",
    headerTitle: "text-xl font-semibold",
    headerSubtitle: "text-sm text-muted-foreground",
    formFieldLabel: "text-xs font-medium",
    formFieldInput: "h-10 border rounded-lg",
    dividerLine: "bg-border",
    dividerText: "text-muted-foreground text-xs",
    userButtonAvatarBox: "h-8 w-8",
  },
};

const App = () => {
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      appearance={clerkAppearance}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route
                path="/*"
                element={
                  <>
                    <SignedIn>
                      <AuthenticatedApp />
                    </SignedIn>
                    <SignedOut>
                      <Auth />
                    </SignedOut>
                  </>
                }
              />
            </Routes>
          </TooltipProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ClerkProvider>
  );
};

export default App;
