/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  createCandidate,
  type CreateCandidateInput,
} from "@/actions/recruitment/candidates";
import { getAllJobPostings } from "@/actions/recruitment/job-postings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

const candidateSchema = z.object({
  jobPostingId: z.number().min(1, "Job posting is required"),
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  currentCompany: z.string().optional(),
  currentPosition: z.string().optional(),
  yearsExperience: z.number().optional(),
  expectedSalary: z.number().optional(),
  noticePeriod: z.string().optional(),
  linkedinUrl: z.url("Invalid URL").optional().or(z.literal("")),
  portfolioUrl: z.url("Invalid URL").optional().or(z.literal("")),
  referredBy: z.string().optional(),
  notes: z.string().optional(),
});

type CandidateFormValues = z.infer<typeof candidateSchema>;

interface AddCandidateDialogProps {
  preSelectedJobId?: number;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function AddCandidateDialog({
  preSelectedJobId,
  onSuccess,
  trigger,
}: AddCandidateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [jobPostings, setJobPostings] = useState<
    Awaited<ReturnType<typeof getAllJobPostings>>
  >([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      jobPostingId: preSelectedJobId || 0,
      name: "",
      email: "",
      phone: "",
      currentCompany: "",
      currentPosition: "",
      yearsExperience: undefined,
      expectedSalary: undefined,
      noticePeriod: "",
      linkedinUrl: "",
      portfolioUrl: "",
      referredBy: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      loadJobPostings();
      if (preSelectedJobId) {
        form.setValue("jobPostingId", preSelectedJobId);
      }
    }
  }, [open, preSelectedJobId, form]);

  async function loadJobPostings() {
    setLoadingJobs(true);
    const jobs = await getAllJobPostings({ status: "Published" });
    setJobPostings(jobs);
    setLoadingJobs(false);
  }

  async function onSubmit(data: CandidateFormValues) {
    setLoading(true);

    try {
      const input: CreateCandidateInput = {
        jobPostingId: data.jobPostingId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        currentCompany: data.currentCompany || undefined,
        currentPosition: data.currentPosition || undefined,
        yearsExperience: data.yearsExperience || undefined,
        expectedSalary: data.expectedSalary || undefined,
        noticePeriod: data.noticePeriod || undefined,
        linkedinUrl: data.linkedinUrl || undefined,
        portfolioUrl: data.portfolioUrl || undefined,
        referredBy: data.referredBy || undefined,
        notes: data.notes || undefined,
      };

      const result = await createCandidate(input);

      if (result.error) {
        toast.error(result.error.reason);
      } else {
        toast.success("Candidate added successfully");
        setOpen(false);
        form.reset();
        if (onSuccess) {
          onSuccess();
        }
        router.refresh();
      }
    } catch (_error) {
      toast.error("An error occurred while adding the candidate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Candidate
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Candidate</DialogTitle>
          <DialogDescription>
            Manually add a candidate to a job posting. Fill in the candidate's
            details below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="jobPostingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Posting</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value ? String(field.value) : ""}
                    disabled={!!preSelectedJobId || loadingJobs}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a job posting" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {jobPostings.map((job) => (
                        <SelectItem key={job.id} value={String(job.id)}>
                          {job.title} - {job.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {preSelectedJobId
                      ? "Job posting is pre-selected"
                      : "Select the job posting this candidate is applying for"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentCompany"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Company (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentPosition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Position (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="yearsExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of Experience (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="5"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expectedSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Salary (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="75000"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="noticePeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notice Period (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="30 days" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://linkedin.com/in/johndoe"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="portfolioUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portfolio URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://johndoe.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referredBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referred By (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes about this candidate..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Candidate
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
