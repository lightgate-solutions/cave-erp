"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateCandidateStatus,
  addCandidateNote,
  type CandidateStatus,
} from "@/actions/recruitment/candidates";
import type { getCandidateActivityLog } from "@/actions/recruitment/activity-log";
import type { getCandidateInterviews } from "@/actions/recruitment/interviews";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  DollarSign,
  Globe,
  User,
  Clock,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InterviewScheduler } from "./interview-scheduler";
import { OfferCreator } from "./offer-creator";
import type { getCandidateOffers } from "@/actions/recruitment/offers";
import CandidateDocumentUpload from "./candidate-document-upload";
import CandidateDocumentsList from "./candidate-documents-list";
import { Label } from "../ui/label";
import { ActivityTimeline } from "./activity-timeline";

type Candidate = NonNullable<
  Awaited<
    ReturnType<typeof import("@/actions/recruitment/candidates").getCandidate>
  >
>;
type ActivityLog = Awaited<ReturnType<typeof getCandidateActivityLog>>;
type Interview = Awaited<ReturnType<typeof getCandidateInterviews>>[0];
type Offer = Awaited<ReturnType<typeof getCandidateOffers>>[0];

export function CandidateDetails({
  candidate,
  activityLog,
  interviews,
  offers,
}: {
  candidate: Candidate;
  activityLog: ActivityLog;
  interviews: Interview[];
  offers: Offer[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<CandidateStatus>(candidate.status);
  const [rejectionReason, setRejectionReason] = useState("");
  const [note, setNote] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [documentRefresh, setDocumentRefresh] = useState(0);

  const statusColors: Record<CandidateStatus, string> = {
    Applied: "bg-blue-100 text-blue-800",
    Screening: "bg-yellow-100 text-yellow-800",
    Interview: "bg-purple-100 text-purple-800",
    Offer: "bg-green-100 text-green-800",
    Hired: "bg-emerald-100 text-emerald-800",
    Rejected: "bg-red-100 text-red-800",
  };

  async function handleStatusChange() {
    if (newStatus === candidate.status) {
      toast.error("Please select a different status");
      return;
    }

    if (newStatus === "Rejected" && !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setLoading(true);
    const result = await updateCandidateStatus(
      candidate.id,
      newStatus,
      newStatus === "Rejected" ? rejectionReason : undefined,
    );

    if (result.error) {
      toast.error(result.error.reason);
    } else {
      toast.success("Status updated successfully");
      setDialogOpen(false);
      setRejectionReason("");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleAddNote() {
    if (!note.trim()) {
      toast.error("Please enter a note");
      return;
    }

    setLoading(true);
    const result = await addCandidateNote(candidate.id, note);

    if (result.error) {
      toast.error(result.error.reason);
    } else {
      toast.success("Note added successfully");
      setNote("");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/recruitment/candidates">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Candidates
          </Button>
        </Link>

        <div className="flex gap-2">
          <InterviewScheduler candidateId={candidate.id} />
          <OfferCreator
            candidateId={candidate.id}
            jobPostingId={candidate.jobPostingId}
          />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Update Status</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Candidate Status</DialogTitle>
                <DialogDescription>
                  Change the status of this candidate's application
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    New Status
                  </Label>
                  <Select
                    value={newStatus}
                    onValueChange={(v) => setNewStatus(v as CandidateStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Applied">Applied</SelectItem>
                      <SelectItem value="Screening">Screening</SelectItem>
                      <SelectItem value="Interview">Interview</SelectItem>
                      <SelectItem value="Offer">Offer</SelectItem>
                      <SelectItem value="Hired">Hired</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newStatus === "Rejected" && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Rejection Reason
                    </Label>
                    <Textarea
                      placeholder="Please provide a reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleStatusChange} disabled={loading}>
                  Update Status
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">
                    {candidate.name}
                  </CardTitle>
                  <p className="text-muted-foreground">
                    {candidate.candidateCode}
                  </p>
                </div>
                <Badge className={statusColors[candidate.status]}>
                  {candidate.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-sm">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{candidate.email}</p>
                  </div>
                </div>

                <div className="flex items-center text-sm">
                  <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{candidate.phone}</p>
                  </div>
                </div>

                {candidate.currentCompany && (
                  <div className="flex items-center text-sm">
                    <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Current Company</p>
                      <p className="font-medium">{candidate.currentCompany}</p>
                    </div>
                  </div>
                )}

                {candidate.currentPosition && (
                  <div className="flex items-center text-sm">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Current Position</p>
                      <p className="font-medium">{candidate.currentPosition}</p>
                    </div>
                  </div>
                )}

                {candidate.yearsExperience && (
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Experience</p>
                      <p className="font-medium">
                        {candidate.yearsExperience} years
                      </p>
                    </div>
                  </div>
                )}

                {candidate.expectedSalary && (
                  <div className="flex items-center text-sm">
                    <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Expected Salary</p>
                      <p className="font-medium">
                        ${candidate.expectedSalary.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {candidate.linkedinUrl && (
                  <div className="flex items-center text-sm">
                    <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">LinkedIn</p>
                      <a
                        href={candidate.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        View Profile
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {candidate.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {candidate.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Note</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Add a note about this candidate..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddNote} disabled={loading}>
                Add Note
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Documents</CardTitle>
                <Dialog>
                  <CandidateDocumentUpload
                    candidateId={candidate.id}
                    onSuccess={() => {
                      setDocumentRefresh((prev) => prev + 1);
                      router.refresh();
                    }}
                  />
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <CandidateDocumentsList
                candidateId={candidate.id}
                onRefresh={documentRefresh}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interviews</CardTitle>
            </CardHeader>
            <CardContent>
              {interviews.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No interviews scheduled yet
                </p>
              ) : (
                <div className="space-y-4">
                  {interviews.map((interview) => (
                    <div
                      key={interview.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">
                            {interview.interviewType}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Round {interview.round}
                          </p>
                        </div>
                        <Badge
                          variant={
                            interview.status === "Completed"
                              ? "default"
                              : interview.status === "Cancelled"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {interview.status}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="mr-2 h-4 w-4" />
                          {new Date(interview.scheduledDate).toLocaleString()}
                        </div>
                        {interview.scheduledEndDate && (
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="mr-2 h-4 w-4" />
                            {Math.round(
                              (new Date(interview.scheduledEndDate).getTime() -
                                new Date(interview.scheduledDate).getTime()) /
                                60000,
                            )}{" "}
                            minutes
                          </div>
                        )}
                        {interview.location && (
                          <div className="flex items-center text-muted-foreground">
                            <MapPin className="mr-2 h-4 w-4" />
                            {interview.location}
                          </div>
                        )}
                      </div>

                      {interview.feedback && (
                        <div className="pt-2 border-t">
                          <p className="text-sm font-medium mb-1">Feedback</p>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {interview.feedback}
                          </p>
                        </div>
                      )}

                      {interview.rating && (
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <p className="text-sm font-medium">Rating:</p>
                          <p className="text-sm text-muted-foreground">
                            {interview.rating}/10
                          </p>
                        </div>
                      )}

                      {interview.recommendation && (
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <p className="text-sm font-medium">Recommendation:</p>
                          <Badge
                            variant={
                              interview.recommendation === "Strong Hire" ||
                              interview.recommendation === "Hire"
                                ? "default"
                                : interview.recommendation === "Maybe"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {interview.recommendation}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Offers</CardTitle>
            </CardHeader>
            <CardContent>
              {offers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No offers created yet
                </p>
              ) : (
                <div className="space-y-4">
                  {offers.map((offer) => (
                    <div
                      key={offer.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{offer.position}</p>
                          <p className="text-sm text-muted-foreground">
                            {offer.department} · {offer.employmentType}
                          </p>
                        </div>
                        <Badge
                          variant={
                            offer.status === "Accepted"
                              ? "default"
                              : offer.status === "Rejected" ||
                                  offer.status === "Expired"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {offer.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Annual Salary</p>
                          <p className="font-medium">
                            ${offer.salary.toLocaleString()}
                          </p>
                        </div>
                        {offer.joiningBonus && (
                          <div>
                            <p className="text-muted-foreground">
                              Joining Bonus
                            </p>
                            <p className="font-medium">
                              ${offer.joiningBonus.toLocaleString()}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-muted-foreground">Start Date</p>
                          <p className="font-medium">
                            {new Date(offer.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        {offer.validUntil && (
                          <div>
                            <p className="text-muted-foreground">Valid Until</p>
                            <p className="font-medium">
                              {new Date(offer.validUntil).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {offer.benefits && (
                        <div className="pt-3 border-t">
                          <p className="text-sm font-medium mb-1">Benefits</p>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {offer.benefits}
                          </p>
                        </div>
                      )}

                      {offer.candidateResponse && (
                        <div className="pt-3 border-t">
                          <p className="text-sm font-medium mb-1">
                            Candidate Response
                          </p>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {offer.candidateResponse}
                          </p>
                        </div>
                      )}

                      <div className="pt-3 border-t text-xs text-muted-foreground">
                        Created {new Date(offer.createdAt).toLocaleString()}
                        {offer.sentAt && (
                          <> · Sent {new Date(offer.sentAt).toLocaleString()}</>
                        )}
                        {offer.acceptedAt && (
                          <>
                            {" "}
                            · Accepted{" "}
                            {new Date(offer.acceptedAt).toLocaleString()}
                          </>
                        )}
                        {offer.rejectedAt && (
                          <>
                            {" "}
                            · Rejected{" "}
                            {new Date(offer.rejectedAt).toLocaleString()}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline
                candidateId={candidate.id}
                initialActivities={activityLog}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
