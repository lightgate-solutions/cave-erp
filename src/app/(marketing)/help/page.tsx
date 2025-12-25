import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AnchorLink } from "@/components/marketing/anchor-link";
import { HelpSearch } from "@/components/marketing/help-search";
import { Logo } from "@/components/marketing/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  MessageCircle,
  Book,
  Mail,
  Phone,
  Clock,
  HelpCircle,
  CheckCircle,
} from "lucide-react";

export default function HelpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Logo />

          <nav className="hidden items-center space-x-6 md:flex">
            <AnchorLink
              href="/#features"
              className="text-sm font-medium text-foreground transition-all duration-300 px-3 py-1.5 rounded-md relative bg-transparent hover:shadow-md hover:text-primary"
            >
              Features
            </AnchorLink>
            <AnchorLink
              href="/#pricing"
              className="text-sm font-medium text-foreground transition-all duration-300 px-3 py-1.5 rounded-md relative bg-transparent hover:shadow-md hover:text-primary"
            >
              Pricing
            </AnchorLink>
            <Link
              href="/documentation"
              className="text-sm font-medium text-foreground transition-all duration-300 px-3 py-1.5 rounded-md relative bg-transparent hover:shadow-md hover:text-primary"
            >
              Documentation
            </Link>
            <Link
              href="/help"
              className="text-sm font-medium text-primary font-semibold transition-all duration-300 px-3 py-1.5 rounded-md relative bg-transparent hover:shadow-md"
            >
              Help
            </Link>
          </nav>

          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hidden md:flex rounded-full font-medium px-6 h-10 bg-card border-border text-card-foreground hover:bg-accent hover:text-accent-foreground shadow-sm"
            >
              <Link href="/auth/login" prefetch={true}>
                Sign In
              </Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="rounded-full font-semibold px-6 h-10 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
            >
              <Link href="/auth/register" prefetch={true}>
                Try It Free
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-background">
        {/* Hero Section */}
        <section className="border-b border-border bg-background py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
                How can we help you?
              </h1>
              <p className="mb-8 text-lg text-foreground/80 leading-relaxed">
                Search for answers or browse our help categories below
              </p>

              {/* Search Bar */}
              <HelpSearch />
            </div>
          </div>
        </section>

        {/* Help Categories */}
        <section
          id="categories"
          className="container mx-auto px-4 py-12 md:px-6 md:py-16"
        >
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 text-3xl font-bold text-foreground">
              Browse by Category
            </h2>

            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: Book,
                  title: "Getting Started",
                  description: "Learn the basics of CAVE ERP",
                  articles: "24 articles",
                },
                {
                  icon: HelpCircle,
                  title: "Account & Billing",
                  description: "Manage your subscription and payments",
                  articles: "18 articles",
                },
                {
                  icon: CheckCircle,
                  title: "Features & Modules",
                  description: "Explore CAVE ERP capabilities",
                  articles: "42 articles",
                },
                {
                  icon: MessageCircle,
                  title: "Troubleshooting",
                  description: "Common issues and solutions",
                  articles: "31 articles",
                },
                {
                  icon: Phone,
                  title: "Integrations",
                  description: "Connect with other tools",
                  articles: "16 articles",
                },
                {
                  icon: Clock,
                  title: "Best Practices",
                  description: "Tips for optimal usage",
                  articles: "22 articles",
                },
              ].map((category) => (
                <Card
                  key={category.title}
                  className="flex h-full flex-col p-5 transition-colors hover:border-primary"
                >
                  <category.icon className="mb-3 h-10 w-10 text-primary" />
                  <h3 className="mb-3 text-xl font-semibold leading-tight text-foreground">
                    {category.title}
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed text-foreground/70">
                    {category.description}
                  </p>
                  <p className="mt-auto text-xs font-medium text-foreground/60">
                    {category.articles}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section
          id="faqs"
          className="border-t border-border bg-background py-12 md:py-16"
        >
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-8 text-3xl font-bold text-foreground">
                Frequently Asked Questions
              </h2>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left">
                    How do I get started with CAVE ERP?
                  </AccordionTrigger>
                  <AccordionContent className="text-foreground/80">
                    Getting started is easy! Sign up for a free trial, create
                    your organization profile, and follow our quick setup
                    wizard. You'll be up and running in less than 10 minutes.
                    Our onboarding team is also available to help you with the
                    initial setup.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem id="faq-2" value="item-2">
                  <AccordionTrigger className="text-left">
                    What payment methods do you accept?
                  </AccordionTrigger>
                  <AccordionContent className="text-foreground/80">
                    We accept all major credit cards (Visa, Mastercard, American
                    Express), bank transfers, and PayPal. For enterprise
                    customers, we also offer invoice-based billing with NET 30
                    terms.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem id="faq-3" value="item-3">
                  <AccordionTrigger className="text-left">
                    Can I migrate data from my current system?
                  </AccordionTrigger>
                  <AccordionContent className="text-foreground/80">
                    Yes! CAVE ERP supports data migration from most major ERP
                    systems. Our migration specialists will work with you to
                    ensure a smooth transition with zero data loss. We provide
                    dedicated migration tools and support for enterprise
                    customers.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem id="faq-4" value="item-4">
                  <AccordionTrigger className="text-left">
                    Is my data secure?
                  </AccordionTrigger>
                  <AccordionContent className="text-foreground/80">
                    Absolutely. We use bank-grade 256-bit SSL encryption for all
                    data transmission and storage. Our infrastructure is SOC 2
                    Type II certified, GDPR compliant, and ISO 27001 certified.
                    We perform regular security audits and maintain 99.9% uptime
                    SLA.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem id="faq-5" value="item-5">
                  <AccordionTrigger className="text-left">
                    Can I customize CAVE ERP for my organization?
                  </AccordionTrigger>
                  <AccordionContent className="text-foreground/80">
                    Yes! CAVE ERP is highly customizable. You can create custom
                    fields, workflows, reports, and integrations. Enterprise
                    customers can also request custom modules developed
                    specifically for their needs.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem id="faq-6" value="item-6">
                  <AccordionTrigger className="text-left">
                    What kind of support do you offer?
                  </AccordionTrigger>
                  <AccordionContent className="text-foreground/80">
                    We offer email support for all plans, priority support for
                    Professional plans, and 24/7 phone support with dedicated
                    account managers for Enterprise customers. We also provide
                    extensive documentation, video tutorials, and a community
                    forum.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem id="faq-7" value="item-7">
                  <AccordionTrigger className="text-left">
                    Do you offer training for my team?
                  </AccordionTrigger>
                  <AccordionContent className="text-foreground/80">
                    Yes! We offer comprehensive training programs including live
                    webinars, on-site training for enterprise customers, video
                    tutorials, and a self-paced learning platform. Training can
                    be customized to your organization's specific needs.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem id="faq-8" value="item-8">
                  <AccordionTrigger className="text-left">
                    Can I cancel my subscription anytime?
                  </AccordionTrigger>
                  <AccordionContent className="text-foreground/80">
                    Yes, you can cancel your subscription at any time with no
                    cancellation fees. If you cancel, you'll have access to your
                    data for 30 days, and we can provide a full data export upon
                    request.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* Contact Support */}
        <section className="container mx-auto px-4 py-12 md:px-6 md:py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 text-center text-3xl font-bold text-foreground">
              Still need help?
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  Live Chat
                </h3>
                <p className="mb-4 text-sm text-foreground/70">
                  Chat with our support team in real-time
                </p>
                <Button className="w-full">Start Chat</Button>
              </Card>

              <Card className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  Email Support
                </h3>
                <p className="mb-4 text-sm text-foreground/70">
                  Get help via email within 24 hours
                </p>
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  asChild
                >
                  <Link href="mailto:contact@lightgatesolutions.com">
                    Send Email
                  </Link>
                </Button>
              </Card>

              <Card className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  Phone Support
                </h3>
                <p className="mb-4 text-sm text-foreground/70">
                  Call us for immediate assistance
                </p>
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  asChild
                >
                  <Link href="tel:+2347046705211">Call Now</Link>
                </Button>
              </Card>
            </div>

            {/* Support Hours */}
            <Card className="mt-8 p-6">
              <div className="text-center">
                <Clock className="mx-auto mb-4 h-8 w-8 text-primary" />
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  Support Hours
                </h3>
                <div className="space-y-1 text-sm text-foreground/70">
                  <p>Monday - Friday: 8:00 AM - 8:00 PM (EST)</p>
                  <p>Saturday: 10:00 AM - 6:00 PM (EST)</p>
                  <p>Sunday: Closed</p>
                  <p className="mt-4 font-semibold text-foreground">
                    Enterprise customers: 24/7 support available
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Guides Section */}
        <section
          id="guides"
          className="border-t border-border bg-background py-12 md:py-16"
        >
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-8 text-3xl font-bold text-foreground">
                Popular Guides
              </h2>

              <div className="grid gap-5 md:grid-cols-2">
                {[
                  {
                    title: "Setting Up Your First Project",
                    description:
                      "A comprehensive guide to creating and configuring your first project in CAVE ERP",
                    readTime: "5 min read",
                  },
                  {
                    title: "Managing User Permissions",
                    description:
                      "Learn how to set up roles and permissions for your team members",
                    readTime: "8 min read",
                  },
                  {
                    title: "Creating Custom Reports",
                    description:
                      "Step-by-step tutorial for building custom reports and dashboards",
                    readTime: "12 min read",
                  },
                  {
                    title: "API Integration Guide",
                    description:
                      "Connect CAVE ERP with your existing tools and systems",
                    readTime: "15 min read",
                  },
                ].map((guide) => (
                  <Link key={guide.title} href="#">
                    <Card className="flex h-full flex-col p-5 transition-colors hover:border-primary">
                      <h3 className="mb-3 text-lg font-semibold leading-tight text-foreground">
                        {guide.title}
                      </h3>
                      <p className="mb-4 text-sm leading-relaxed text-foreground/70">
                        {guide.description}
                      </p>
                      <p className="mt-auto text-xs font-medium text-foreground/60">
                        {guide.readTime}
                      </p>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50">
        <div className="container mx-auto px-4 py-16 md:px-6">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="mb-6">
                <Logo />
              </div>
              <p className="text-base leading-relaxed text-foreground/80">
                The complete operating system for your organization
              </p>
            </div>

            <div>
              <h3 className="mb-6 text-base font-bold tracking-tight">
                Product
              </h3>
              <ul className="space-y-3 text-base">
                <li>
                  <Link
                    href="/#features"
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#pricing"
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/documentation"
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    API
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-6 text-base font-bold tracking-tight">
                Support
              </h3>
              <ul className="space-y-3 text-base">
                <li>
                  <Link
                    href="/help"
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    Community
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    Status
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-6 text-base font-bold tracking-tight">
                Company
              </h3>
              <ul className="space-y-3 text-base">
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-border pt-8 text-center">
            <p className="text-base font-medium text-muted-foreground">
              &copy; 2025 CAVE ERP. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
