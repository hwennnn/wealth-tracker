import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Session, User } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { toast } from "sonner";
import Layout from "./components/Layout";
import { supabase } from "./integrations/supabase/client";
import { signInWithEmail, signOut, signUpWithEmail } from "./lib/auth";
import { currencies, getDefaultCurrency } from "./lib/currencyData";
import { Category, Entry, TimelineEntry } from "./lib/types";
import Auth from "./pages/Auth";
import Categories from "./pages/Categories";
import Dashboard from "./pages/Dashboard";
import Entries from "./pages/Entries";
import NewEntry from "./pages/NewEntry";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [latestEntries, setLatestEntries] = useState<Entry[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const defaultCurrency = getDefaultCurrency().code;

  // Check for existing session and set up auth state listener
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
    });

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);

      if (event === "SIGNED_IN") {
        toast.success("Successfully logged in!");
      } else if (event === "SIGNED_OUT") {
        toast.success("Successfully logged out!");
      }
    });

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle login with email
  const handleLogin = async (email: string, password: string) => {
    try {
      await signInWithEmail(email, password);
      // Auth state listener will handle the session update
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Handle sign-up with email
  const handleSignUp = async (email: string, password: string) => {
    try {
      await signUpWithEmail(email, password);
      toast.success(
        "Account created successfully! Please check your email for verification."
      );
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      // Auth state listener will handle the session update
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out");
    }
  };

  // Supabase category management
  const handleAddCategory = async (name: string, description: string) => {
    if (!user) return;

    await supabase
      .from("categories")
      .insert([
        {
          name,
          description,
          user_id: user.id,
        },
      ])
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) throw error;
        console.log("🚀 ~ App ~ data:", data);
        setCategories([...categories, data]);
      });
  };

  const handleUpdateCategory = async (
    id: string,
    name: string,
    description: string
  ) => {
    if (!user) return;

    await supabase
      .from("categories")
      .update({ name, description })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) throw error;
        const updatedCategories = categories.map((category) =>
          category.id === id ? data : category
        );
        setCategories(updatedCategories);
      });
  };

  const handleDeleteCategory = async (id: string) => {
    if (!user) return;

    await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .then(({ error }) => {
        if (error) throw error;

        const filteredCategories = categories.filter(
          (category) => category.id !== id
        );
        setCategories(filteredCategories);
      });
  };

  // Supabase entry management
  const handleAddEntry = async (data: {
    categoryId: string;
    amount: number;
    currencyCode: string;
    date: Date;
    notes: string;
  }) => {
    if (!user) return;

    const { data: entryData, error } = await supabase
      .from("entries")
      .insert([
        {
          category_id: data.categoryId,
          amount: data.amount,
          currency: data.currencyCode,
          date: data.date.toISOString(),
          notes: data.notes,
          user_id: user.id,
        },
      ])
      .select();

    if (error) throw error;

    // Check if there's an existing timeline entry for this date
    const existingTimelineIndex = timelineEntries.findIndex(
      (t) => new Date(t.date).toDateString() === data.date.toDateString()
    );

    if (existingTimelineIndex >= 0) {
      // Add to existing timeline entry
      const updatedTimeline = [...timelineEntries];
      const timeline = updatedTimeline[existingTimelineIndex];

      // Add new entry
      timeline.entries = [...timeline.entries, entryData[0]];

      // Recalculate total (assuming same currency for simplicity)
      timeline.total_amount = timeline.entries.reduce(
        (sum, entry) => sum + entry.amount,
        0
      );

      setTimelineEntries(updatedTimeline);
    } else {
      // Create new timeline entry
      const newTimelineEntry: TimelineEntry = {
        id: `timeline-${Date.now()}`,
        date: data.date.toISOString(),
        entries: [entryData[0]],
        total_amount: data.amount,
        currency: data.currencyCode,
        user_id: user.id,
      };

      setTimelineEntries([...timelineEntries, newTimelineEntry]);
    }

    // Update latest entries and total
    updateLatestEntries();
  };

  const handleDeleteTimelineEntry = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("entries")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    const filteredEntries = timelineEntries.filter((entry) => entry.id !== id);
    setTimelineEntries(filteredEntries);

    // Update latest entries and total
    updateLatestEntries();
  };

  // Update latest entries and total based on the most recent timeline entry
  const updateLatestEntries = useCallback(() => {
    if (timelineEntries.length > 0) {
      // Find the most recent timeline entry
      const sortedEntries = [...timelineEntries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const mostRecent = sortedEntries[0];
      setLatestEntries(mostRecent.entries);
      setTotalAmount(mostRecent.total_amount);
    } else {
      setLatestEntries([]);
      setTotalAmount(0);
    }
  }, [timelineEntries]);

  // Fetch categories and timeline entries when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const fetchCategories = async () => {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching categories:", error);
          return;
        }

        setCategories(data || []);
      };

      const fetchTimelineEntries = async () => {
        const { data: entriesData, error } = await supabase
          .from("entries")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false });

        if (error) {
          console.error("Error fetching entries:", error);
          return;
        }

        // Group entries by date
        const groupedEntries = entriesData.reduce((acc, entry) => {
          const dateStr = new Date(entry.date).toDateString();
          if (!acc[dateStr]) {
            acc[dateStr] = {
              id: `timeline-${Date.now()}`,
              date: entry.date,
              entries: [],
              total_amount: 0,
              currency: entry.currency,
              user_id: entry.user_id,
            };
          }
          acc[dateStr].entries.push(entry);
          acc[dateStr].total_amount += entry.amount;
          return acc;
        }, {});

        setTimelineEntries(Object.values(groupedEntries));
      };

      fetchCategories();
      fetchTimelineEntries();
    }
  }, [isAuthenticated, user]);

  // Update latest entries whenever timeline entries change
  useEffect(() => {
    updateLatestEntries();
  }, [timelineEntries, updateLatestEntries]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Layout onLogout={handleLogout}>
                    <Dashboard
                      timelineEntries={timelineEntries}
                      latestEntries={latestEntries}
                      totalAmount={totalAmount}
                      defaultCurrency={defaultCurrency}
                    />
                  </Layout>
                ) : (
                  <Auth onLogin={handleLogin} onSignUp={handleSignUp} />
                )
              }
            />
            <Route
              path="/categories"
              element={
                isAuthenticated ? (
                  <Layout onLogout={handleLogout}>
                    <Categories
                      categories={categories}
                      onAddCategory={handleAddCategory}
                      onUpdateCategory={handleUpdateCategory}
                      onDeleteCategory={handleDeleteCategory}
                    />
                  </Layout>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/new-entry"
              element={
                isAuthenticated ? (
                  <Layout onLogout={handleLogout}>
                    <NewEntry
                      categories={categories}
                      currencies={currencies}
                      onAddEntry={handleAddEntry}
                    />
                  </Layout>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/entries"
              element={
                isAuthenticated ? (
                  <Layout onLogout={handleLogout}>
                    <Entries
                      timelineEntries={timelineEntries}
                      onDeleteEntry={handleDeleteTimelineEntry}
                      defaultCurrency={defaultCurrency}
                    />
                  </Layout>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
