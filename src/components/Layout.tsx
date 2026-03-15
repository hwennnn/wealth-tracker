import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Plus,
  LogOut,
  Tag,
  List,
  TrendingUp,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  Activity,
  Github,
  Menu,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { currencies } from "@/lib/currencyData";
import { getDisplayCurrency, setDisplayCurrency } from "@/lib/currency";
import { useTheme } from "@/hooks/use-theme";

type LayoutProps = {
  children: ReactNode;
  onLogout: () => void;
  onCurrencyChange?: (code: string) => void;
};

const Layout = ({ children, onLogout, onCurrencyChange }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [displayCurrency, setLocalCurrency] = useState(getDisplayCurrency());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/categories", label: "Categories", icon: Tag },
    { path: "/entries", label: "Entries", icon: List },
  ];

  const handleCurrencyChange = (code: string) => {
    setDisplayCurrency(code);
    setLocalCurrency(code);
    onCurrencyChange?.(code);
  };

  const handleNav = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Mobile menu button */}
            <button
              className="md:hidden p-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={() => handleNav("/")}
              className="flex items-center gap-2 font-bold text-base tracking-tight hover:opacity-80 transition-opacity"
            >
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="hidden sm:inline">WealthTracker</span>
            </button>

            <nav className="hidden md:flex items-center gap-0.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ThemeIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="h-4 w-4 mr-2" /> Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="h-4 w-4 mr-2" /> Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Monitor className="h-4 w-4 mr-2" /> System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs font-medium h-8"
                >
                  {displayCurrency}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {currencies.map((c) => (
                  <DropdownMenuItem
                    key={c.code}
                    onClick={() => handleCurrencyChange(c.code)}
                    className={cn(
                      displayCurrency === c.code && "bg-primary/10 text-primary"
                    )}
                  >
                    <span className="font-medium mr-2">{c.symbol}</span>
                    {c.code} - {c.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              onClick={() => handleNav("/new-entry")}
              className="gap-1.5 h-8 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Entry</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <nav className="container py-2 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 container py-6 sm:py-8 px-4 sm:px-6">
        {children}
      </main>

      <footer className="border-t bg-muted/30">
        <div className="container py-5 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-3 w-3 text-primary" />
              </div>
              <span className="text-xs">
                WealthTracker &copy; {new Date().getFullYear()}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <a
                href="/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy
              </a>
              <a
                href="/terms"
                className="hover:text-foreground transition-colors"
              >
                Terms
              </a>
              <a
                href="https://status.hwendev.com/status/wealth-tracker"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Activity className="h-3.5 w-3.5" />
                Status
              </a>
              <a
                href="https://github.com/hwennnn/wealth-tracker"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Github className="h-3.5 w-3.5" />
                Source
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
