"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import Link from "next/link";

interface SearchableItem {
  id: string;
  title: string;
  description: string;
  type: "faq" | "category" | "guide";
  content?: string;
  href?: string;
}

const searchableContent: SearchableItem[] = [
  // FAQs
  {
    id: "faq-1",
    title: "How do I get started with CAVE ERP?",
    description:
      "Getting started is easy! Sign up for a free trial, create your organization profile, and follow our quick setup wizard.",
    type: "faq",
    content:
      "Getting started is easy! Sign up for a free trial, create your organization profile, and follow our quick setup wizard. You'll be up and running in less than 10 minutes. Our onboarding team is also available to help you with the initial setup.",
    href: "#faqs",
  },
  {
    id: "faq-2",
    title: "What payment methods do you accept?",
    description:
      "We accept all major credit cards (Visa, Mastercard, American Express), bank transfers, and PayPal.",
    type: "faq",
    content:
      "We accept all major credit cards (Visa, Mastercard, American Express), bank transfers, and PayPal. For enterprise customers, we also offer invoice-based billing with NET 30 terms.",
    href: "#faqs",
  },
  {
    id: "faq-3",
    title: "Can I migrate data from my current system?",
    description:
      "Yes! CAVE ERP supports data migration from most major ERP systems.",
    type: "faq",
    content:
      "Yes! CAVE ERP supports data migration from most major ERP systems. Our migration specialists will work with you to ensure a smooth transition with zero data loss. We provide dedicated migration tools and support for enterprise customers.",
    href: "#faq-3",
  },
  {
    id: "faq-4",
    title: "Is my data secure?",
    description:
      "Absolutely. We use bank-grade 256-bit SSL encryption for all data transmission and storage.",
    type: "faq",
    content:
      "Absolutely. We use bank-grade 256-bit SSL encryption for all data transmission and storage. Our infrastructure is SOC 2 Type II certified, GDPR compliant, and ISO 27001 certified. We perform regular security audits and maintain 99.9% uptime SLA.",
    href: "#faq-4",
  },
  {
    id: "faq-5",
    title: "Can I customize CAVE ERP for my organization?",
    description:
      "Yes! CAVE ERP is highly customizable. You can create custom fields, workflows, reports, and integrations.",
    type: "faq",
    content:
      "Yes! CAVE ERP is highly customizable. You can create custom fields, workflows, reports, and integrations. Enterprise customers can also request custom modules developed specifically for their needs.",
    href: "#faq-5",
  },
  {
    id: "faq-6",
    title: "What kind of support do you offer?",
    description:
      "We offer email support for all plans, priority support for Professional plans, and 24/7 phone support for Enterprise customers.",
    type: "faq",
    content:
      "We offer email support for all plans, priority support for Professional plans, and 24/7 phone support with dedicated account managers for Enterprise customers. We also provide extensive documentation, video tutorials, and a community forum.",
    href: "#faq-6",
  },
  {
    id: "faq-7",
    title: "Do you offer training for my team?",
    description:
      "Yes! We offer comprehensive training programs including live webinars, on-site training, and video tutorials.",
    type: "faq",
    content:
      "Yes! We offer comprehensive training programs including live webinars, on-site training for enterprise customers, video tutorials, and a self-paced learning platform. Training can be customized to your organization's specific needs.",
    href: "#faq-7",
  },
  {
    id: "faq-8",
    title: "Can I cancel my subscription anytime?",
    description:
      "Yes, you can cancel your subscription at any time with no cancellation fees.",
    type: "faq",
    content:
      "Yes, you can cancel your subscription at any time with no cancellation fees. If you cancel, you'll have access to your data for 30 days, and we can provide a full data export upon request.",
    href: "#faq-8",
  },
  // Categories
  {
    id: "cat-1",
    title: "Getting Started",
    description: "Learn the basics of CAVE ERP",
    type: "category",
    href: "#categories",
  },
  {
    id: "cat-2",
    title: "Account & Billing",
    description: "Manage your subscription and payments",
    type: "category",
    href: "#categories",
  },
  {
    id: "cat-3",
    title: "Features & Modules",
    description: "Explore CAVE ERP capabilities",
    type: "category",
    href: "#categories",
  },
  {
    id: "cat-4",
    title: "Troubleshooting",
    description: "Common issues and solutions",
    type: "category",
    href: "#categories",
  },
  {
    id: "cat-5",
    title: "Integrations",
    description: "Connect with other tools",
    type: "category",
    href: "#categories",
  },
  {
    id: "cat-6",
    title: "Best Practices",
    description: "Tips for optimal usage",
    type: "category",
    href: "#categories",
  },
  // Guides
  {
    id: "guide-1",
    title: "Setting Up Your First Project",
    description:
      "A comprehensive guide to creating and configuring your first project in CAVE ERP",
    type: "guide",
    href: "#guides",
  },
  {
    id: "guide-2",
    title: "Managing User Permissions",
    description:
      "Learn how to set up roles and permissions for your team members",
    type: "guide",
    href: "#guides",
  },
  {
    id: "guide-3",
    title: "Creating Custom Reports",
    description:
      "Step-by-step tutorial for building custom reports and dashboards",
    type: "guide",
    href: "#guides",
  },
  {
    id: "guide-4",
    title: "API Integration Guide",
    description: "Connect CAVE ERP with your existing tools and systems",
    type: "guide",
    href: "#guides",
  },
];

export function HelpSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase().trim();
    return searchableContent
      .filter((item) => {
        const titleMatch = item.title.toLowerCase().includes(query);
        const descMatch = item.description.toLowerCase().includes(query);
        const contentMatch = item.content?.toLowerCase().includes(query);
        return titleMatch || descMatch || contentMatch;
      })
      .slice(0, 8); // Limit to 8 results
  }, [searchQuery]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "faq":
        return "FAQ";
      case "category":
        return "Category";
      case "guide":
        return "Guide";
      default:
        return "";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "faq":
        return "bg-blue-100 text-blue-700";
      case "category":
        return "bg-green-100 text-green-700";
      case "guide":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <span>
        {parts.map((part, i) => {
          const isMatch = part.toLowerCase() === query.toLowerCase();
          // Use combination of index and part content for unique keys
          const key = `${i}-${part.substring(0, 20)}`;
          return isMatch ? (
            <mark key={key} className="bg-yellow-200 px-0.5 rounded">
              {part}
            </mark>
          ) : (
            <span key={key}>{part}</span>
          );
        })}
      </span>
    );
  };

  return (
    <div className="relative mx-auto max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search for help..."
          className="h-12 pl-10 pr-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isFocused && filteredResults.length > 0 && (
        <Card className="absolute left-0 right-0 z-50 mt-2 max-h-[500px] overflow-y-auto border shadow-lg">
          <div className="p-2">
            {filteredResults.map((item) => (
              <Link
                key={item.id}
                href={item.href || "#"}
                className="block rounded-lg p-3 transition-colors hover:bg-muted/50"
                onClick={() => {
                  setSearchQuery("");
                  setIsFocused(false);
                }}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${getTypeColor(item.type)}`}
                  >
                    {getTypeLabel(item.type)}
                  </span>
                </div>
                <h4 className="mb-1 font-semibold text-sm">
                  {highlightText(item.title, searchQuery)}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {highlightText(item.description, searchQuery)}
                </p>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* No Results Message */}
      {isFocused && searchQuery.trim() && filteredResults.length === 0 && (
        <Card className="absolute left-0 right-0 z-50 mt-2 border shadow-lg">
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              No results found for "{searchQuery}"
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Try different keywords or browse our categories below
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
