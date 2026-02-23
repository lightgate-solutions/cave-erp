import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Cave ERP",
  description: "Terms of Service for Cave ERP",
};

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">
        Terms of Service
      </h1>
      <p className="mb-10 text-sm text-muted-foreground">
        Last updated: February 23, 2026
      </p>

      <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="mb-3 text-lg font-semibold">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Cave ERP (&quot;the Platform&quot;), you agree
            to be bound by these Terms of Service. If you do not agree to these
            terms, you may not use the Platform. These terms apply to all users,
            including administrators, employees, and any other individuals
            granted access by an organization.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">
            2. Description of Service
          </h2>
          <p>
            Cave ERP is an enterprise resource planning platform that provides
            tools for human resources management, project and task management,
            document management, internal email communications, notifications,
            and organizational administration. The Platform is provided as a
            software service to organizations and their authorized users.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">3. User Accounts</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              You are responsible for maintaining the confidentiality of your
              account credentials.
            </li>
            <li>
              You must provide accurate and complete information when creating
              an account.
            </li>
            <li>
              You are responsible for all activities that occur under your
              account.
            </li>
            <li>
              You must notify your organization administrator immediately of any
              unauthorized use of your account.
            </li>
            <li>
              Organization administrators may create, modify, or deactivate user
              accounts as needed.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">4. Acceptable Use</h2>
          <p className="mb-2">When using the Platform, you agree not to:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              Violate any applicable laws, regulations, or third-party rights.
            </li>
            <li>Upload malicious software, viruses, or any harmful code.</li>
            <li>
              Attempt to gain unauthorized access to other accounts, systems, or
              networks connected to the Platform.
            </li>
            <li>
              Use the Platform to store or transmit content that is illegal,
              defamatory, or infringing on intellectual property rights.
            </li>
            <li>
              Interfere with or disrupt the integrity or performance of the
              Platform.
            </li>
            <li>Share your login credentials with unauthorized individuals.</li>
            <li>
              Use automated tools to scrape, crawl, or extract data from the
              Platform without authorization.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">
            5. Data Ownership &amp; Content
          </h2>
          <p>
            Your organization retains ownership of all data entered into the
            Platform, including employee records, project data, documents, and
            communications. We do not claim ownership of your content. You grant
            us a limited license to host, store, and process your data solely
            for the purpose of providing the Platform services.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">
            6. Intellectual Property
          </h2>
          <p>
            The Platform, including its source code, design, logos, and
            documentation, is the intellectual property of Cave ERP and is
            protected by applicable copyright, trademark, and other intellectual
            property laws. You may not copy, modify, distribute, or reverse
            engineer any part of the Platform without prior written consent.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">7. Privacy</h2>
          <p>
            Your use of the Platform is also governed by our{" "}
            <Link
              href="/privacy"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Privacy Policy
            </Link>
            , which describes how we collect, use, and protect your personal
            information.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">
            8. Service Availability
          </h2>
          <p>
            We strive to maintain high availability of the Platform but do not
            guarantee uninterrupted access. We may perform scheduled
            maintenance, updates, or modifications that temporarily affect
            availability. We will make reasonable efforts to notify users of
            planned downtime in advance.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">
            9. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by law, Cave ERP and its affiliates
            shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages, including but not limited to
            loss of profits, data, or business opportunities, arising from your
            use of or inability to use the Platform. Our total liability for any
            claim arising from these terms shall not exceed the amount you paid
            for the Platform in the twelve months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">
            10. Disclaimer of Warranties
          </h2>
          <p>
            The Platform is provided &quot;as is&quot; and &quot;as
            available&quot; without warranties of any kind, whether express or
            implied, including but not limited to implied warranties of
            merchantability, fitness for a particular purpose, and
            non-infringement.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">11. Termination</h2>
          <p>
            We may suspend or terminate your access to the Platform at any time
            for violation of these terms or for any other reason at our
            discretion. Your organization administrator may also terminate your
            access. Upon termination, your right to use the Platform ceases
            immediately. Provisions that by their nature should survive
            termination (such as limitation of liability and intellectual
            property) will remain in effect.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">
            12. Changes to These Terms
          </h2>
          <p>
            We reserve the right to modify these Terms of Service at any time.
            We will notify users of material changes by updating the &quot;Last
            updated&quot; date at the top of this page. Continued use of the
            Platform after changes constitutes acceptance of the revised terms.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">13. Governing Law</h2>
          <p>
            These Terms of Service shall be governed by and construed in
            accordance with the laws of the jurisdiction in which Cave ERP
            operates, without regard to conflict of law principles.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">14. Contact Us</h2>
          <p>
            If you have questions about these Terms of Service, please contact
            us at{" "}
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
          href="/privacy"
          className="text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}
