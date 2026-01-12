"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  createJobPosting,
  generateJobCode,
  type CreateJobPostingInput,
} from "@/actions/recruitment/job-postings";
import { Button } from "@/components/ui/button";
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
import { Loader2 } from "lucide-react";

const jobPostingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  code: z.string().min(1, "Code is required"),
  department: z.enum(["admin", "hr", "finance", "operations"]),
  position: z.string().min(1, "Position is required"),
  description: z.string().min(1, "Description is required"),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  employmentType: z.enum(["Full-time", "Part-time", "Contract", "Intern"]),
  salaryRangeMin: z.number().optional(),
  salaryRangeMax: z.number().optional(),
  location: z.string().optional(),
  openings: z.number().min(1),
});

type JobPostingFormValues = z.infer<typeof jobPostingSchema>;

export function JobPostingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<JobPostingFormValues>({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: {
      title: "",
      code: "",
      department: "operations",
      position: "",
      description: "",
      requirements: "",
      responsibilities: "",
      employmentType: "Full-time",
      location: "",
      openings: 1,
    },
  });

  // Generate job code on mount
  useEffect(() => {
    async function loadCode() {
      const code = await generateJobCode();
      if (code) {
        form.setValue("code", code);
      }
    }
    loadCode();
  }, [form]);

  async function onSubmit(data: JobPostingFormValues) {
    setLoading(true);

    try {
      const input: CreateJobPostingInput = {
        ...data,
        salaryRangeMin: data.salaryRangeMin || undefined,
        salaryRangeMax: data.salaryRangeMax || undefined,
        location: data.location || undefined,
        requirements: data.requirements || undefined,
        responsibilities: data.responsibilities || undefined,
      };

      const result = await createJobPosting(input);

      if (result.error) {
        toast.error(result.error.reason);
      } else {
        toast.success("Job posting created successfully");
        router.push("/recruitment/jobs");
      }
    } catch (_error) {
      toast.error("An error occurred while creating the job posting");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input placeholder="Senior Software Engineer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Code</FormLabel>
                <FormControl>
                  <Input placeholder="JOB-2026-0001" {...field} disabled />
                </FormControl>
                <FormDescription>Auto-generated unique code</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position</FormLabel>
                <FormControl>
                  <Input placeholder="Software Engineer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="employmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employment Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Intern">Intern</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="New York, NY" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="openings"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Openings</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="salaryRangeMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Salary (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="50000"
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
            name="salaryRangeMax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Salary (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="80000"
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
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the role and what you're looking for..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requirements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Requirements (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="List the required qualifications and skills..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="responsibilities"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsibilities (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="List the key responsibilities for this role..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Job Posting
          </Button>
        </div>
      </form>
    </Form>
  );
}
