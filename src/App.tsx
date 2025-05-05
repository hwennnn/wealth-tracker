
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import NewEntry from "./pages/NewEntry";
import Entries from "./pages/Entries";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import { Category, Entry, TimelineEntry } from "./lib/types";
import { currencies, getDefaultCurrency } from "./lib/currencyData";
import { toast } from "sonner";
import { supabase } from "./integrations/supabase/client";
import { signInWithEmail, signUpWithEmail, signInWithSocial, signOut } from "./lib/auth";
import { Session, User } from "@supabase/supabase-js";

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event);
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session);
        
        if (event === 'SIGNED_IN') {
          toast.success("Successfully logged in!");
        } else if (event === 'SIGNED_OUT') {
          toast.success("Successfully logged out!");
        }
      }
    );

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
      toast.success("Account created successfully! Please check your email for verification.");
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  // Handle social authentication
  const handleSocialAuth = async (provider: 'google' | 'github') => {
    try {
      await signInWithSocial(provider);
      // The redirect will happen automatically, and auth state will be updated when user returns
    } catch (error) {
      console.error(`${provider} auth error:`, error);
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

  // Mock category management - will be replaced with Supabase
  const handleAddCategory = async (name: string, description: string) => {
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name,
      description,
      created_at: new Date().toISOString(),
      user_id: 'current-user',
    };
    setCategories([...categories, newCategory]);
  };

  const handleUpdateCategory = async (id: string, name: string, description: string) => {
    const updatedCategories = categories.map(category => 
      category.id === id ? { ...category, name, description } : category
    );
    setCategories(updatedCategories);
  };

  const handleDeleteCategory = async (id: string) => {
    const filteredCategories = categories.filter(category => category.id !== id);
    setCategories(filteredCategories);
  };

  // Mock entry management - will be replaced with Supabase
  const handleAddEntry = async (data: {
    categoryId: string;
    amount: number;
    currencyCode: string;
    date: Date;
    notes: string;
  }) => {
    const categoryName = categories.find(c => c.id === data.categoryId)?.name || 'Unknown';
    
    const newEntry: Entry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      category_id: data.categoryId,
      amount: data.amount,
      currency: data.currencyCode,
      date: data.date.toISOString(),
      notes: data.notes || categoryName,
      user_id: 'current-user',
    };

    // Check if there's an existing timeline entry for this date
    const existingTimelineIndex = timelineEntries.findIndex(
      t => new Date(t.date).toDateString() === data.date.toDateString()
    );

    if (existingTimelineIndex >= 0) {
      // Add to existing timeline entry
      const updatedTimeline = [...timelineEntries];
      const timeline = updatedTimeline[existingTimelineIndex];
      
      // Add new entry
      timeline.entries = [...timeline.entries, newEntry];
      
      // Recalculate total (assuming same currency for simplicity)
      timeline.total_amount = timeline.entries.reduce((sum, entry) => sum + entry.amount, 0);
      
      setTimelineEntries(updatedTimeline);
    } else {
      // Create new timeline entry
      const newTimelineEntry: TimelineEntry = {
        id: `timeline-${Date.now()}`,
        date: data.date.toISOString(),
        entries: [newEntry],
        total_amount: data.amount,
        currency: data.currencyCode,
        user_id: 'current-user',
      };
      
      setTimelineEntries([...timelineEntries, newTimelineEntry]);
    }

    // Update latest entries and total
    updateLatestEntries();
  };

  const handleDeleteTimelineEntry = async (id: string) => {
    const filteredEntries = timelineEntries.filter(entry => entry.id !== id);
    setTimelineEntries(filteredEntries);
    
    // Update latest entries and total
    updateLatestEntries();
  };

  // Update latest entries and total based on the most recent timeline entry
  const updateLatestEntries = () => {
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
  };

  // Initialize with some sample data for demo purposes
  useEffect(() => {
    if (isAuthenticated && categories.length === 0) {
      const sampleCategories: Category[] = [
        {
          id: 'cat-savings',
          name: 'Savings',
          description: 'Bank savings accounts',
          created_at: new Date().toISOString(),
          user_id: 'current-user',
        },
        {
          id: 'cat-investments',
          name: 'Investments',
          description: 'Stocks, ETFs, and other investments',
          created_at: new Date().toISOString(),
          user_id: 'current-user',
        },
      ];
      setCategories(sampleCategories);
    }
  }, [isAuthenticated, categories.length]);

  // Syncing with local storage - temporary solution before Supabase integration
  useEffect(() => {
    // Simulate loading data from local storage
    const storedAuth = localStorage.getItem('wealthTrackerAuth');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }

    // Load sample data if authenticated
    if (isAuthenticated) {
      // Here we would normally fetch from Supabase
      const storedCategories = localStorage.getItem('wealthTrackerCategories');
      const storedTimelineEntries = localStorage.getItem('wealthTrackerTimeline');

      if (storedCategories) {
        setCategories(JSON.parse(storedCategories));
      }

      if (storedTimelineEntries) {
        const parsedTimeline = JSON.parse(storedTimelineEntries);
        setTimelineEntries(parsedTimeline);
        updateLatestEntries();
      }
    }
  }, [isAuthenticated]);

  // Save to local storage when data changes - temporary before Supabase
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('wealthTrackerAuth', 'true');
      localStorage.setItem('wealthTrackerCategories', JSON.stringify(categories));
      localStorage.setItem('wealthTrackerTimeline', JSON.stringify(timelineEntries));
    } else {
      localStorage.removeItem('wealthTrackerAuth');
    }
  }, [isAuthenticated, categories, timelineEntries]);

  // Update latest entries whenever timeline entries change
  useEffect(() => {
    updateLatestEntries();
  }, [timelineEntries]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
                  <Auth 
                    onLogin={handleLogin} 
                    onSignUp={handleSignUp} 
                    onSocialAuth={handleSocialAuth}
                  />
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
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
