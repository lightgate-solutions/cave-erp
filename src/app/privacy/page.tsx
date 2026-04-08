import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Cave ERP",
  description: "Privacy Policy for Cave ERP",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mb-10 text-sm text-muted-foreground">
        Last updated: February 23, 2026
      </p>

      <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="mb-3 text-lg font-semibold">1. Introduction</h2>
          <p>
            Cave ERP (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;)
            operates the Cave ERP platform. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use
            our enterprise resource planning application.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">
            2. Information We Collect
          </h2>
          <p className="mb-2">
            We collect information that you provide directly to us, including:
          </p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Account Information:</strong> Name, email address,
              password, role, and profile details when you create an account.
            </li>
            <li>
              <strong>Employee Data:</strong> Job title, department, manager
              hierarchy, employment dates, and other HR-related information
              entered into the system.
            </li>
            <li>
              <strong>Project &amp; Task Data:</strong> Project details, task
              assignments, milestones, budgets, and submissions you create or
              contribute to.
            </li>
            <li>
              <strong>Documents:</strong> Files you upload, including documents,
              images, and other attachments stored within the platform.
            </li>
            <li>
              <strong>Communications:</strong> Emails composed and sent through
              the platform, including message content and recipients.
            </li>
            <li>
              <strong>Usage Data:</strong> Log data, device information, browser
              type, IP address, and pages visited within the application.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">
            3. How We Use Your Information
          </h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>Provide, maintain, and improve the Cave ERP platform.</li>
            <li>
              Authenticate your identity and manage your account and
              permissions.
            </li>
            <li>
              Process and manage HR records, projects, tasks, and documents.
            </li>
            <li>Send notifications, alerts, and administrative messages.</li>
            <li>
              Monitor usage patterns to improve performance and user experience.
            </li>
            <li>
              Comply with legal obligations and enforce our terms of service.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">4. Data Storage</h2>
          <p>
            Your data is stored on secure servers using PostgreSQL databases.
            Documents and files are stored using S3-compatible cloud storage
            (Cloudflare R2). We implement appropriate technical and
            organizational measures to protect your personal data against
            unauthorized access, alteration, disclosure, or destruction.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">5. Data Sharing</h2>
          <p className="mb-2">
            We do not sell your personal information. We may share your data
            with:
          </p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Your Organization:</strong> Administrators and managers
              within your organization can access relevant employee, project,
              and task data as part of normal platform operations.
            </li>
            <li>
              <strong>Service Providers:</strong> Third-party services that
              assist us in operating the platform (hosting, analytics, email
              delivery), bound by confidentiality agreements.
            </li>
            <li>
              <strong>Legal Requirements:</strong> When required by law, court
              order, or governmental regulation.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">6. Data Retention</h2>
          <p>
            We retain your personal data for as long as your account is active
            or as needed to provide services. When data is no longer required,
            we will delete or anonymize it in accordance with applicable laws.
            Organization administrators may request data export or deletion by
            contacting us.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">7. Your Rights</h2>
          <p className="mb-2">
            Depending on your jurisdiction, you may have the right to:
          </p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your data.</li>
            <li>Object to or restrict processing of your data.</li>
            <li>Request data portability.</li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, please contact your organization
            administrator or reach out to us directly.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">8. Cookies</h2>
          <p>
            We use essential cookies and local storage to maintain your session,
            remember your preferences (such as theme settings), and ensure the
            application functions correctly. We do not use third-party tracking
            cookies for advertising purposes.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">9. Security</h2>
          <p>
            We use industry-standard security measures including encrypted
            connections (HTTPS/TLS), hashed passwords, role-based access
            controls, and secure session management to protect your data.
            However, no method of electronic transmission or storage is 100%
            secure.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">
            10. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of any material changes by posting the updated policy on this
            page with a revised &quot;Last updated&quot; date.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">11. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us
            at{" "}
            <a
              href="mailto:support@cave-erp.com"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              support@cave-erp.com
            </a>
            .
          </p>
        </section>
      </div>

      <div className="mt-12 border-t pt-6 text-sm text-muted-foreground">
        <Link
          href="/terms"
          className="text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Terms of Service
        </Link>
      </div>
    </div>
  );
}
