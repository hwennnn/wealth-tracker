import { SignIn, SignUp } from "@clerk/clerk-react";
import { useState } from "react";
import {
  TrendingUp,
  BarChart3,
  Shield,
  Globe,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: BarChart3,
    title: "Visual Insights",
    desc: "Interactive charts to visualize your net worth journey",
  },
  {
    icon: Globe,
    title: "Multi-Currency",
    desc: "Track assets in SGD, USD, and more with live conversion",
  },
  {
    icon: Shield,
    title: "Private & Secure",
    desc: "Your financial data stays encrypted and only yours",
  },
  {
    icon: Sparkles,
    title: "Bulk Snapshots",
    desc: "Record all your assets at once — no more one-by-one",
  },
];

const Auth = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 sm:px-10">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">WealthTracker</span>
        </div>
        <a
          href="https://github.com/hwennnn/wealth-timeline-tracker"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          Source
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 px-6 py-10 sm:px-10">
        {/* Left - hero */}
        <div className="max-w-lg text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-6">
            <Sparkles className="h-3 w-3" />
            Free & open source
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            Track your wealth,
            <br />
            <span className="text-primary">watch it grow.</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg mb-10 max-w-md mx-auto lg:mx-0">
            Record your assets across categories and currencies. Visualize your
            financial journey over time.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-3 rounded-xl border bg-card p-4"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Clerk auth */}
        <div className="w-full max-w-[400px] flex flex-col items-center">
          {mode === "signin" ? (
            <SignIn routing="hash" />
          ) : (
            <SignUp routing="hash" />
          )}
          <Button
            variant="link"
            size="sm"
            className="text-xs text-muted-foreground mt-2"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </Button>
        </div>
      </div>

      <footer className="px-6 py-4 text-center text-xs text-muted-foreground">
        WealthTracker &copy; {new Date().getFullYear()} &middot;{" "}
        <a
          href="https://status.hwendev.com/status/wealth-tracker"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          Status
        </a>
      </footer>
    </div>
  );
};

export default Auth;
