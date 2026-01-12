"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getCandidatesByStatus,
  updateCandidateStatus,
  type CandidateStatus,
} from "@/actions/recruitment/candidates";
import { getAllJobPostings } from "@/actions/recruitment/job-postings";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Mail, Phone, Briefcase, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InterviewScheduler } from "./interview-scheduler";

type Candidate = Awaited<
  ReturnType<typeof getCandidatesByStatus>
>[keyof Awaited<ReturnType<typeof getCandidatesByStatus>>][0];
type CandidatesByStatus = Awaited<ReturnType<typeof getCandidatesByStatus>>;

const PIPELINE_COLUMNS: {
  id: CandidateStatus;
  label: string;
  color: string;
}[] = [
  { id: "Applied", label: "Applied", color: "bg-blue-500" },
  { id: "Screening", label: "Screening", color: "bg-yellow-500" },
  { id: "Interview", label: "Interview", color: "bg-purple-500" },
  { id: "Offer", label: "Offer", color: "bg-green-500" },
  { id: "Hired", label: "Hired", color: "bg-emerald-500" },
  { id: "Rejected", label: "Rejected", color: "bg-red-500" },
];

export function PipelineBoard() {
  const [candidates, setCandidates] = useState<CandidatesByStatus>({
    Applied: [],
    Screening: [],
    Interview: [],
    Offer: [],
    Hired: [],
    Rejected: [],
  });
  const [jobs, setJobs] = useState<
    Awaited<ReturnType<typeof getAllJobPostings>>
  >([]);
  const [selectedJob, setSelectedJob] = useState<number | "all">("all");
  const [loading, setLoading] = useState(true);
  const [interviewCandidateId, setInterviewCandidateId] = useState<
    number | null
  >(null);
  const [isInterviewDialogOpen, setIsInterviewDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [candidatesData, jobsData] = await Promise.all([
      getCandidatesByStatus(selectedJob === "all" ? undefined : selectedJob),
      getAllJobPostings({ status: "Published" }),
    ]);
    setCandidates(candidatesData);
    setJobs(jobsData);
    setLoading(false);
  }, [selectedJob]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    // No change
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceStatus = source.droppableId as CandidateStatus;
    const destStatus = destination.droppableId as CandidateStatus;
    const candidateId = Number.parseInt(draggableId);

    // Optimistically update UI
    const newCandidates = { ...candidates };
    const sourceCandidates = Array.from(newCandidates[sourceStatus]);
    const [movedCandidate] = sourceCandidates.splice(source.index, 1);

    // Update candidate status
    const updatedCandidate = { ...movedCandidate, status: destStatus };
    const destCandidates = Array.from(newCandidates[destStatus]);
    destCandidates.splice(destination.index, 0, updatedCandidate);

    newCandidates[sourceStatus] = sourceCandidates;
    newCandidates[destStatus] = destCandidates;
    setCandidates(newCandidates);

    // Update in backend
    if (sourceStatus !== destStatus) {
      const result = await updateCandidateStatus(candidateId, destStatus);

      if (result.error) {
        toast.error(result.error.reason);
        // Revert on error
        loadData();
      } else {
        toast.success(`Moved to ${destStatus}`);
        if (destStatus === "Interview") {
          setInterviewCandidateId(candidateId);
          setIsInterviewDialogOpen(true);
        }
      }
    }
  };

  const totalCandidates = Object.values(candidates).reduce(
    (acc, list) => acc + list.length,
    0,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 pb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {totalCandidates} total candidates
        </div>
        <Select
          value={selectedJob.toString()}
          onValueChange={(value) =>
            setSelectedJob(value === "all" ? "all" : Number.parseInt(value))
          }
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filter by job" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jobs</SelectItem>
            {jobs.map((job) => (
              <SelectItem key={job.id} value={job.id.toString()}>
                {job.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-4 px-6 pb-6 overflow-x-auto">
          {PIPELINE_COLUMNS.map((column) => (
            <PipelineColumn
              key={column.id}
              column={column}
              candidates={candidates[column.id]}
            />
          ))}
        </div>
      </DragDropContext>
      {interviewCandidateId && (
        <InterviewScheduler
          candidateId={interviewCandidateId}
          open={isInterviewDialogOpen}
          onOpenChange={setIsInterviewDialogOpen}
          showTrigger={false}
        />
      )}
    </div>
  );
}

function PipelineColumn({
  column,
  candidates,
}: {
  column: { id: CandidateStatus; label: string; color: string };
  candidates: Candidate[];
}) {
  return (
    <div className="flex-shrink-0 w-80 flex flex-col">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${column.color}`} />
          <h3 className="font-semibold">{column.label}</h3>
          <Badge variant="secondary">{candidates.length}</Badge>
        </div>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-2 rounded-lg p-2 transition-colors ${
              snapshot.isDraggingOver ? "bg-accent" : "bg-muted/30"
            }`}
          >
            {candidates.map((candidate, index) => (
              <Draggable
                key={candidate.id}
                draggableId={candidate.id.toString()}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={snapshot.isDragging ? "opacity-50" : ""}
                  >
                    <CandidateCard candidate={candidate} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {candidates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No candidates
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

function CandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <Link href={`/recruitment/candidates/${candidate.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4 space-y-2">
          <div>
            <h4 className="font-medium truncate">{candidate.name}</h4>
            <p className="text-xs text-muted-foreground">
              {candidate.candidateCode}
            </p>
          </div>

          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center">
              <Mail className="mr-1 h-3 w-3 flex-shrink-0" />
              <span className="truncate">{candidate.email}</span>
            </div>
            <div className="flex items-center">
              <Phone className="mr-1 h-3 w-3 flex-shrink-0" />
              <span className="truncate">{candidate.phone}</span>
            </div>
            {candidate.currentCompany && (
              <div className="flex items-center">
                <Briefcase className="mr-1 h-3 w-3 flex-shrink-0" />
                <span className="truncate">{candidate.currentCompany}</span>
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t">
            Applied {new Date(candidate.appliedAt).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
