import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type AuthFormProps = {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
};

const AuthForm = ({ onLogin, onSignUp }: AuthFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (type: "login" | "signup") => {
    try {
      setIsLoading(true);
      if (!email || !password) {
        throw new Error("Please enter both email and password");
      }
      if (type === "login") {
        await onLogin(email, password);
      } else {
        await onSignUp(email, password);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Authentication failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Tabs defaultValue="login">
        <TabsList className="grid grid-cols-2 w-full mb-6">
          <TabsTrigger value="login">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Sign in to continue tracking your wealth
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAuth("login");
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10"
                autoComplete="current-password"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full h-10 gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">Create account</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Start tracking your financial journey
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAuth("signup");
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="email-signup" className="text-xs font-medium">
                Email
              </Label>
              <Input
                id="email-signup"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password-signup" className="text-xs font-medium">
                Password
              </Label>
              <Input
                id="password-signup"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10"
                autoComplete="new-password"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full h-10 gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthForm;
