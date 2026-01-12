/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
"use client";

import { useState, useEffect } from "react";
import {
  getAllCandidates,
  type CandidateStatus,
} from "@/actions/recruitment/candidates";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Mail, Phone, Briefcase } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddCandidateDialog } from "./add-candidate-dialog";

type Candidate = Awaited<ReturnType<typeof getAllCandidates>>[0];

export function CandidatesList() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | "All">(
    "All",
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCandidates();
  }, [statusFilter]);

  async function loadCandidates() {
    setLoading(true);
    const filters: any = {};
    if (statusFilter !== "All") {
      filters.status = statusFilter;
    }
    const data = await getAllCandidates(filters);
    setCandidates(data);
    setLoading(false);
  }

  const filteredCandidates = candidates.filter((candidate) =>
    search
      ? candidate.name.toLowerCase().includes(search.toLowerCase()) ||
        candidate.email.toLowerCase().includes(search.toLowerCase()) ||
        candidate.candidateCode.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  const statusColors: Record<CandidateStatus, string> = {
    Applied: "bg-blue-100 text-blue-800",
    Screening: "bg-yellow-100 text-yellow-800",
    Interview: "bg-purple-100 text-purple-800",
    Offer: "bg-green-100 text-green-800",
    Hired: "bg-emerald-100 text-emerald-800",
    Rejected: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as CandidateStatus | "All")
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Applied">Applied</SelectItem>
            <SelectItem value="Screening">Screening</SelectItem>
            <SelectItem value="Interview">Interview</SelectItem>
            <SelectItem value="Offer">Offer</SelectItem>
            <SelectItem value="Hired">Hired</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <AddCandidateDialog onSuccess={loadCandidates} />
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading candidates...
        </div>
      ) : filteredCandidates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {search ? "No candidates match your search" : "No candidates yet"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredCandidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              statusColors={statusColors}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CandidateCard({
  candidate,
  statusColors,
}: {
  candidate: Candidate;
  statusColors: Record<CandidateStatus, string>;
}) {
  return (
    <Link href={`/recruitment/candidates/${candidate.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{candidate.name}</h3>
                <Badge className={statusColors[candidate.status]}>
                  {candidate.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {candidate.candidateCode}
                </span>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Mail className="mr-1 h-3 w-3" />
                  {candidate.email}
                </div>
                <div className="flex items-center">
                  <Phone className="mr-1 h-3 w-3" />
                  {candidate.phone}
                </div>
                {candidate.currentCompany && (
                  <div className="flex items-center">
                    <Briefcase className="mr-1 h-3 w-3" />
                    {candidate.currentCompany}
                    {candidate.currentPosition &&
                      ` - ${candidate.currentPosition}`}
                  </div>
                )}
              </div>

              {candidate.yearsExperience && (
                <div className="text-sm text-muted-foreground">
                  {candidate.yearsExperience} years of experience
                </div>
              )}
            </div>

            <div className="text-right text-sm text-muted-foreground">
              <p>Applied</p>
              <p>{new Date(candidate.appliedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
