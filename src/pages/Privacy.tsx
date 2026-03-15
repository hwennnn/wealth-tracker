import { TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-14 items-center px-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 font-bold text-base"
          >
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            WealthTracker
          </button>
        </div>
      </header>

      <main className="container max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: March 14, 2026
        </p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              WealthTracker ("we", "our", "us") is a personal net worth tracking
              application available at{" "}
              <a
                href="https://wealth.hwendev.com"
                className="text-primary hover:underline"
              >
                wealth.hwendev.com
              </a>
              . This Privacy Policy explains how we collect, use, and protect
              your information when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              2. Information We Collect
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We collect the following types of information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Account information:</strong>{" "}
                When you sign up, we collect your email address and name through
                our authentication provider (Clerk). If you sign in with Google
                or GitHub, we receive your basic profile information (name,
                email, profile picture) from those services.
              </li>
              <li>
                <strong className="text-foreground">Financial data:</strong> The
                asset categories, amounts, currencies, dates, and notes you
                enter into the application. This data is stored in our database
                and associated with your account.
              </li>
              <li>
                <strong className="text-foreground">Usage data:</strong> We may
                collect basic analytics such as page views and feature usage to
                improve the service.
              </li>
              <li>
                <strong className="text-foreground">Local storage:</strong>{" "}
                Theme preferences, display currency selection, goals, and
                milestone tracking are stored locally in your browser and are
                never transmitted to our servers.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              3. How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>To provide and maintain the WealthTracker service</li>
              <li>To authenticate your identity and secure your account</li>
              <li>To display your financial data and generate charts and insights</li>
              <li>To convert currencies using third-party exchange rate data</li>
              <li>To improve and optimize the application</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              4. Third-Party Services
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We use the following third-party services:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Clerk</strong> — Authentication
                and user management.{" "}
                <a
                  href="https://clerk.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Clerk Privacy Policy
                </a>
              </li>
              <li>
                <strong className="text-foreground">Supabase</strong> — Database
                hosting (PostgreSQL).{" "}
                <a
                  href="https://supabase.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Supabase Privacy Policy
                </a>
              </li>
              <li>
                <strong className="text-foreground">ExchangeRate-API</strong> —
                Currency exchange rates. No personal data is sent to this
                service.
              </li>
              <li>
                <strong className="text-foreground">Google OAuth</strong> — If
                you choose to sign in with Google, Google's privacy policy
                applies to the authentication process.{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google Privacy Policy
                </a>
              </li>
              <li>
                <strong className="text-foreground">GitHub OAuth</strong> — If
                you choose to sign in with GitHub, GitHub's privacy policy
                applies.{" "}
                <a
                  href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  GitHub Privacy Statement
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Storage & Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your financial data is stored in a Supabase-hosted PostgreSQL
              database. Data is transmitted over HTTPS and encrypted in transit.
              We implement application-level access controls to ensure you can
              only access your own data. We do not sell, trade, or share your
              financial data with any third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is retained for as long as your account is active. You
              can delete individual entries or categories at any time through the
              application. You can export all your data via CSV at any time. To
              request complete account deletion, contact us at the email below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Access your personal data through the application</li>
              <li>Export your data at any time (CSV export)</li>
              <li>Delete your entries and categories</li>
              <li>Request complete account and data deletion</li>
              <li>Withdraw consent for data processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              8. Children's Privacy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              WealthTracker is not intended for use by children under the age of
              13. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              9. Changes to This Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will
              notify users of any material changes by updating the "Last
              updated" date at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, please
              contact us at{" "}
              <a
                href="mailto:hwendev@gmail.com"
                className="text-primary hover:underline"
              >
                hwendev@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
