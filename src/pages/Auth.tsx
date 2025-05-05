import AuthForm from "@/components/AuthForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartBar } from "lucide-react";

type AuthProps = {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
};

const Auth = ({ onLogin, onSignUp }: AuthProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <ChartBar className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Wealth Timeline Tracker</h1>
          <p className="text-muted-foreground mt-2">
            Track your financial growth over time
          </p>
        </div>

        <AuthForm onLogin={onLogin} onSignUp={onSignUp} />

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Track Your Financial Growth
              </CardTitle>
              <CardDescription>
                Key features of Wealth Timeline Tracker
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>
                    Track wealth across multiple categories and accounts
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>
                    View your financial progress over time with charts and
                    visualizations
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>
                    Create customized categories for better organization
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>
                    Keep your data secure with user-based authentication
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
