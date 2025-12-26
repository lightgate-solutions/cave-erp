"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { SupportTicketForm } from "./support-ticket-form";
import { MessageCircle, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function CollapsibleTicketForm() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "group relative w-full justify-between border-2 border-border/50 bg-gradient-to-br from-card via-card to-muted/30 p-8 h-auto text-left shadow-md transition-all duration-500 hover:border-primary hover:shadow-xl hover:scale-[1.01]",
            isOpen &&
              "border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 shadow-lg",
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-1">
            <div
              className={cn(
                "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 text-primary transition-all duration-500 shadow-lg",
                isOpen
                  ? "scale-110 from-primary/30 via-primary/25 to-primary/20 rotate-3"
                  : "group-hover:scale-110 group-hover:rotate-3",
              )}
            >
              <MessageCircle className="h-8 w-8" />
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-2xl font-bold text-foreground">
                  Submit a Support Ticket
                </h3>
                <Sparkles
                  className={cn(
                    "h-5 w-5 text-primary transition-all duration-500",
                    isOpen && "animate-pulse",
                  )}
                />
              </div>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {isOpen
                  ? "Fill out the form below and our support team will get back to you within 24 hours"
                  : "Need personalized help? Open a support ticket and we'll assist you promptly"}
              </p>
            </div>
          </div>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition-all duration-500",
              isOpen && "bg-primary/10",
            )}
          >
            <ChevronDown
              className={cn(
                "h-5 w-5 text-muted-foreground transition-all duration-500",
                isOpen && "rotate-180 text-primary",
              )}
            />
          </div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden">
        <div className="mt-6 animate-in fade-in-0 slide-in-from-top-2 duration-500">
          <SupportTicketForm />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
