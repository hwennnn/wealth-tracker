import { TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Terms = () => {
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
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: March 14, 2026
        </p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">
              1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using WealthTracker ("the Service") at{" "}
              <a
                href="https://wealth.hwendev.com"
                className="text-primary hover:underline"
              >
                wealth.hwendev.com
              </a>
              , you agree to be bound by these Terms of Service. If you do not
              agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              2. Description of Service
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              WealthTracker is a personal finance tool that allows you to track
              your net worth across multiple asset categories and currencies. The
              Service provides data visualization, currency conversion, and data
              import/export capabilities. The Service is provided free of charge
              and is open source.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                You must provide accurate and complete information when creating
                an account.
              </li>
              <li>
                You are responsible for maintaining the security of your account
                credentials.
              </li>
              <li>
                You are responsible for all activities that occur under your
                account.
              </li>
              <li>
                You must notify us immediately of any unauthorized use of your
                account.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. User Data</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                You retain ownership of all financial data you enter into the
                Service.
              </li>
              <li>
                You are solely responsible for the accuracy of the data you
                input.
              </li>
              <li>
                You can export your data at any time using the CSV export
                feature.
              </li>
              <li>
                You can delete your data at any time through the application
                interface.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                Use the Service for any illegal or unauthorized purpose
              </li>
              <li>
                Attempt to gain unauthorized access to other users' data
              </li>
              <li>
                Interfere with or disrupt the Service or its infrastructure
              </li>
              <li>
                Use automated systems or bots to access the Service excessively
              </li>
              <li>
                Reverse engineer or attempt to extract the source code (note:
                the source code is publicly available under the MIT license)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              6. Financial Disclaimer
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              WealthTracker is a personal tracking tool only.{" "}
              <strong className="text-foreground">
                The Service does not provide financial advice, investment
                recommendations, or professional financial services.
              </strong>{" "}
              Currency exchange rates are provided by third-party services and
              may not reflect real-time market rates. You should not make
              financial decisions based solely on data displayed in the Service.
              We are not responsible for any financial losses incurred based on
              information from the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              7. Disclaimer of Warranties
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service is provided "as is" and "as available" without
              warranties of any kind, either express or implied. We do not
              guarantee that the Service will be uninterrupted, secure, or
              error-free. We do not warrant the accuracy or completeness of
              currency exchange rates or any calculated values.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              8. Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, we shall not be liable for
              any indirect, incidental, special, consequential, or punitive
              damages, including but not limited to loss of data, loss of
              profits, or financial losses, arising from your use of the
              Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              9. Service Availability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify, suspend, or discontinue the
              Service at any time without prior notice. We will make reasonable
              efforts to notify users of any planned downtime or significant
              changes. Service status can be monitored at{" "}
              <a
                href="https://status.hwendev.com/status/wealth-tracker"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                status.hwendev.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              10. Open Source License
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The WealthTracker source code is available under the MIT License on{" "}
              <a
                href="https://github.com/hwennnn/wealth-tracker"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub
              </a>
              . These Terms of Service govern your use of the hosted Service at
              wealth.hwendev.com, not the source code itself.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              11. Changes to Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms from time to time. We will notify users
              of material changes by updating the "Last updated" date at the top
              of this page. Continued use of the Service after changes
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms, please contact us at{" "}
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

export default Terms;
