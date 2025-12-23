import Link from "next/link";

import { Button } from "@/components/ui/button";

import { Card } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { NavLinks } from "@/components/marketing/nav-links";

import { PricingSection } from "@/components/marketing/pricing-section";

import { AuthButton } from "@/components/marketing/auth-button";

import {
  ArrowRight,
  CheckCircle,
  Zap,
  Shield,
  BarChart3,
  Globe,
  TrendingUp,
  DollarSign,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f7]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#e8e8e8] bg-white/98 backdrop-blur supports-[backdrop-filter]:bg-white/95 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-md">
              <span className="text-xl font-extrabold text-primary-foreground">
                C
              </span>
            </div>
            <span className="text-2xl font-extrabold tracking-tight">
              CAVE ERP
            </span>
          </Link>
          <NavLinks />
          <div className="flex items-center space-x-3">
            <AuthButton
              variant="outline"
              size="sm"
              className="hidden md:flex rounded-full font-medium px-6 h-10 bg-white border-[#e0e0e0] text-foreground hover:bg-[#faf9f7] hover:border-[#d0d0d0] shadow-sm"
              href="/auth/login"
            >
              Sign In
            </AuthButton>
            <Button
              size="sm"
              asChild
              className="rounded-full font-semibold px-6 h-10 bg-foreground text-background hover:bg-foreground/90 shadow-md hover:shadow-lg transition-all"
            >
              <Link href="/auth/register" prefetch={true}>
                Try It Free
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 bg-white">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:px-6 md:py-32 bg-white">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 font-bold">
              Enterprise Resource Planning Platform
            </Badge>
            <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              The Complete Operating System for Your Organization
            </h1>
            <p className="mb-8 text-pretty text-lg text-muted-foreground md:text-xl">
              Transform your entire organization with AI-powered automation,
              seamless integration, and enterprise-grade security. From startups
              to global conglomerates.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/auth/register" prefetch={true}>
                  Try It Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#demo">View Demo</Link>
              </Button>
            </div>
          </div>
          {/* Video Section */}
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="aspect-video overflow-hidden rounded-lg border border-[#e8e8e8] bg-[#f8f8f8]">
              {/* biome-ignore lint/a11y/useMediaCaption: Video captions would be added when available */}
              <video
                className="h-full w-full object-cover"
                controls
                poster="/landing/videos/modern-enterprise-dashboard.png"
                aria-label="CAVE ERP product demonstration video"
              >
                <source
                  src="/landing/videos/commercial-video.mp4"
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </section>
        {/* Trust Section */}
        <section className="border-y border-[#e8e8e8] bg-[#faf9f7] py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-5xl text-center">
              <h2 className="mb-4 text-3xl font-bold">
                Trusted by Organisations worldwide
              </h2>
              <p className="mb-12 text-lg text-muted-foreground">
                Used by organisations across 20+ countries — from small
                Organisation to big enterprise organisation
              </p>
              {/* Logo Grid */}
              <div className="mb-16 grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <div
                    key={`company-${num}`}
                    className="flex items-center justify-center"
                  >
                    <div className="flex h-16 w-32 items-center justify-center rounded bg-white border border-[#e8e8e8] text-sm font-semibold text-muted-foreground">
                      Company {num}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mb-8">
                <h3 className="mb-6 text-2xl font-bold">
                  Loved by Organisations worldwide
                </h3>
                <p className="text-muted-foreground">
                  See what our customers are saying about CAVE and how it's
                  transforming their organisations
                </p>
              </div>
              {/* Testimonials */}
              <div className="grid gap-6 md:grid-cols-3">
                {[
                  {
                    quote:
                      "CAVE ERP transformed our operations completely. We've seen a 40% increase in efficiency.",
                    author: "Sarah Johnson",
                    role: "COO, Global Tech Solutions",
                  },
                  {
                    quote:
                      "The AI-powered automation has saved our team over 45 hours weekly. Absolutely game-changing.",
                    author: "Michael Chen",
                    role: "Director of Operations, BUA Group",
                  },
                  {
                    quote:
                      "Scalable, secure, and incredibly intuitive. Perfect for our enterprise needs.",
                    author: "Amara Okafor",
                    role: "CTO, Federal Ministry Services",
                  },
                ].map((testimonial) => (
                  <Card
                    key={testimonial.author}
                    className="p-6 text-left bg-white border-[#e8e8e8]"
                  >
                    <p className="mb-4 text-sm leading-relaxed">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>
                    <div>
                      <p className="font-semibold">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
              {/* Results Stats */}
              <div className="mt-12 rounded-lg border border-[#e8e8e8] bg-white p-8">
                <h3 className="mb-6 text-xl font-bold">
                  Real results from real Organisations
                </h3>
                <p className="mb-8 text-muted-foreground">
                  Organisation using CAVE save an average of 40+ hours weekly
                  and increase efficiency by 30–40% through AI-powered decisions
                </p>
                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <div className="mb-2 text-4xl font-bold text-primary">
                      40+
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Hours saved weekly
                    </p>
                  </div>
                  <div>
                    <div className="mb-2 text-4xl font-bold text-primary">
                      30-40%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Efficiency increase
                    </p>
                  </div>
                  <div>
                    <div className="mb-2 text-4xl font-bold text-primary">
                      20+
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Countries worldwide
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Features Section */}
        <section
          id="features"
          className="container mx-auto px-4 py-20 md:px-6 md:py-32 bg-white"
        >
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Enterprise-Grade Capabilities
              </h2>
              <p className="text-lg text-muted-foreground">
                Everything you need to transform your organization's operations
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Zap,
                  title: "AI-Powered Automation",
                  description:
                    "Automate repetitive tasks and workflows with intelligent AI that learns from your operations.",
                },
                {
                  icon: TrendingUp,
                  title: "Operational Efficiency",
                  description:
                    "Streamline processes across departments with real-time data synchronization and collaboration.",
                },
                {
                  icon: Shield,
                  title: "Enterprise Security",
                  description:
                    "Bank-grade encryption, role-based access control, and compliance with global standards.",
                },
                {
                  icon: BarChart3,
                  title: "Smart Decision Making",
                  description:
                    "Data-driven insights and predictive analytics to guide strategic business decisions.",
                },
                {
                  icon: Globe,
                  title: "Unlimited Scalability",
                  description:
                    "Grow from 10 to 10,000 users seamlessly. Built for organizations of every size.",
                },
                {
                  icon: DollarSign,
                  title: "Cost Optimization",
                  description:
                    "Reduce operational costs by up to 40% through intelligent resource allocation and automation.",
                },
              ].map((feature) => (
                <Card
                  key={feature.title}
                  className="p-6 bg-white border-[#e8e8e8]"
                >
                  <feature.icon className="mb-4 h-10 w-10 text-primary" />
                  <h3 className="mb-2 text-xl font-semibold">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
            {/* Additional Features List */}
            <div className="mt-16 rounded-lg border border-[#e8e8e8] bg-[#faf9f7] p-8 md:p-12">
              <h3 className="mb-8 text-2xl font-bold">
                Complete Organizational Control
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                {[
                  "Financial Management",
                  "Human Resources & Payroll",
                  "Project Management & Tracking",
                  "Task & Performance Management",
                  "Document Management System",
                  "Email System",
                  "Procurement & Vendor Management",
                  "Asset & Maintenance Management",
                  "Business Intelligence & Reporting",
                  "Manufacturing & Production Planning",
                  "Compliance & Audit Management",
                  "News Management",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        {/* Pricing Section */}
        <PricingSection
          plans={[
            {
              name: "Free",
              price: "₦0",
              buttonText: "Get Started",
              features: [
                "1 Organization",
                "3 Members",
                "Basic Finance Module",
                "Basic HR Management",
                "Task/Performance Management",
                "Projects Management",
                "Up to 3 Projects",
                "Documents Management (500MB Included)",
                "Email Support",
              ],
              recommended: false,
            },
            {
              name: "Pro",
              price: "₦9,000",
              buttonText: "Get Pro",
              features: [
                "Up to 3 Organizations",
                "Unlimited Members",
                "Complete Finance Module",
                "Advanced HR Management",
                "Task/Performance Management",
                "Projects Management",
                "Up to 10 Projects",
                "Documents Management (10GB Included)",
                "Notifications Enabled (Mail Only)",
                "Email Support",
              ],
              recommended: false,
            },
            {
              name: "ProAI",
              price: "₦18,000",
              buttonText: "Get ProAI",
              features: [
                "Up to 3 Organizations",
                "Unlimited Members",
                "Complete Finance Module",
                "Advanced HR Management",
                "Task/Performance Management",
                "Projects Management",
                "Up to 10 Projects",
                "Documents Management (10GB Included)",
                "Notifications Enabled (Mail Only)",
                "Email Support",
                "AI Integration",
              ],
              recommended: true,
            },
            {
              name: "Premium",
              price: "₦45,000",
              buttonText: "Get Premium",
              features: [
                "Unlimited Organizations",
                "Unlimited Members",
                "Complete Finance Module",
                "Advanced HR Management",
                "Task/Performance Management",
                "Projects Management",
                "Unlimited Projects",
                "Documents Management (200GB Included)",
                "Full Notifications Enabled",
                "Priority Email Support",
                "Custom Integrations",
                "SMS Notification",
                "Internal Mailing System",
                "Assets Management",
                "Procurement Module",
                "Digital E-Signature & Document Authentication",
                "Paystack Integration",
                "Dedicated Support",
              ],
              recommended: false,
            },
            {
              name: "PremiumAI",
              price: "₦60,000",
              buttonText: "Get PremiumAI",
              features: [
                "Unlimited Organizations",
                "Unlimited Members",
                "Complete Finance Module",
                "Advanced HR Management",
                "Task/Performance Management",
                "Projects Management",
                "Unlimited Projects",
                "Documents Management (200GB Included)",
                "Full Notifications Enabled",
                "Priority Email Support",
                "Custom Integrations",
                "SMS Notification",
                "Internal Mailing System",
                "Assets Management",
                "Procurement Module",
                "Digital E-Signature & Document Authentication",
                "Paystack Integration",
                "Dedicated Support",
                "AI Integration",
              ],
              recommended: false,
            },
            {
              name: "Enterprise",
              nameSubtext: "Custom",
              description: "Everything in PremiumAI, plus:",
              price: null,
              buttonText: "Contact Sales",
              buttonHref: "/help",
              features: [
                "Invoice/PO Billing",
                "Advanced Security & Compliance",
                "Custom Development & Integrations",
                "Priority Support with Account Manager",
                "SLA Guarantees",
                "On-Premise Deployment Option",
                "Custom Training & Onboarding",
                "Advanced Audit Logs & Tracking",
                "White-Labeling Options",
                "Unlimited Storage",
              ],
              recommended: false,
              isEnterprise: true,
            },
          ]}
        />
        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20 md:px-6 md:py-32 bg-[#faf9f7]">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Ready to Transform Your Organization?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Start your journey to operational excellence today. Experience the
              power of AI-driven ERP that scales with your vision
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/auth/register">
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/help">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      {/* Footer */}
      <footer className="border-t border-[#e8e8e8] bg-[#faf9f7]">
        <div className="container mx-auto px-4 py-16 md:px-6">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="mb-6 flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-md">
                  <span className="text-xl font-extrabold text-primary-foreground">
                    C
                  </span>
                </div>
                <span className="text-2xl font-extrabold tracking-tight">
                  CAVE ERP
                </span>
              </div>
              <p className="text-base leading-relaxed text-muted-foreground">
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
                    href="#features"
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#pricing"
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
          <div className="mt-12 border-t border-[#e8e8e8] pt-8 text-center">
            <p className="text-base font-medium text-muted-foreground">
              &copy; 2025 CAVE ERP. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
