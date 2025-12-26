"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Upload,
  X,
  HelpCircle,
  Mail,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const supportTicketSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  organizationCode: z.string().optional(),
  ticketType: z.string().min(1, "Please select a ticket type"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
});

type SupportTicketFormValues = z.infer<typeof supportTicketSchema>;

export function SupportTicketForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SupportTicketFormValues>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      organizationCode: "",
      ticketType: "",
      subject: "",
      description: "",
    },
  });

  const onSubmit = async (_data: SupportTicketFormValues) => {
    setIsSubmitting(true);
    try {
      // TODO: Implement API call to submit support ticket
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call

      toast.success("Support ticket submitted successfully!", {
        description: "We'll get back to you within 24 hours.",
        icon: <CheckCircle2 className="h-4 w-4" />,
      });

      form.reset();
      setFiles([]);
    } catch (_error) {
      toast.error("Failed to submit ticket", {
        description: "Please try again or contact us directly.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length + files.length > 5) {
      toast.error("Maximum 5 files allowed");
      return;
    }
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="p-8 md:p-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Need <span className="text-primary">help?</span>
          </h2>
          <p className="text-muted-foreground">
            Fill out the form below and our support team will get back to you
            within 24 hours.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name and Email Row */}
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        {...field}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Phone and Organization Code Row */}
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Your Phone
                      <span className="text-xs font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        {...field}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizationCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Organization Code
                      <span className="text-xs font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="ORG-123456"
                          {...field}
                          className="h-11 pr-10"
                        />
                        <Link
                          href="/auth/login"
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                        </Link>
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Sign in to auto-fill your organization code
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Ticket Type */}
            <FormField
              control={form.control}
              name="ticketType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select a ticket type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="billing">
                        Question about subscription or billing
                      </SelectItem>
                      <SelectItem value="usage">
                        Question about usage or configuration
                      </SelectItem>
                      <SelectItem value="bug">
                        Unexpected behavior or bug
                      </SelectItem>
                      <SelectItem value="access">
                        Cannot access my database
                      </SelectItem>
                      <SelectItem value="integration">
                        Integration or API question
                      </SelectItem>
                      <SelectItem value="feature">Feature request</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subject */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief description of your issue"
                      {...field}
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide as much detail as possible about your issue or question..."
                      className="min-h-[140px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Include steps to reproduce, error messages, or any relevant
                    information
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Attachments */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Attachments</Label>
              <div className="space-y-3">
                <label className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 transition-colors hover:border-primary hover:bg-muted/50">
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Choose files or drag and drop
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    Images, PDFs, documents (max 5 files, 10MB each)
                  </span>
                </label>

                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md border border-border bg-card p-3"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-8 w-8 p-0 shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <FormDescription className="flex items-start gap-2 text-xs">
                  <HelpCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                  <span>
                    Please do not include sensitive data. We process your data
                    as described in our{" "}
                    <Link
                      href="#"
                      className="text-primary hover:underline font-medium"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </FormDescription>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                size="lg"
                className="w-full h-12 text-base font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Ticket"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Card>
  );
}
