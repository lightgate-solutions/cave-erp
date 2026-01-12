"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Send, Check, X, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import type { getAllOffers } from "@/actions/recruitment/offers";
import {
  sendOffer,
  acceptOffer,
  rejectOffer,
} from "@/actions/recruitment/offers";
import { toast } from "sonner";

type Offer = Awaited<ReturnType<typeof getAllOffers>>[0];

export function OffersList({ offers: initialOffers }: { offers: Offer[] }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState<number | null>(null);

  // Filter offers
  const filteredOffers = initialOffers.filter((offer) => {
    if (statusFilter !== "all" && offer.status !== statusFilter) {
      return false;
    }
    return true;
  });

  async function handleSendOffer(offerId: number) {
    setLoading(offerId);
    const result = await sendOffer(offerId);
    if (result.error) {
      toast.error(result.error.reason);
    } else {
      toast.success("Offer marked as sent");
      router.refresh();
    }
    setLoading(null);
  }

  async function handleAcceptOffer(offerId: number) {
    setLoading(offerId);
    const result = await acceptOffer(offerId);
    if (result.error) {
      toast.error(result.error.reason);
    } else {
      toast.success("Offer accepted");
      router.refresh();
    }
    setLoading(null);
  }

  async function handleRejectOffer(offerId: number, reason?: string) {
    setLoading(offerId);
    const result = await rejectOffer(offerId, reason);
    if (result.error) {
      toast.error(result.error.reason);
    } else {
      toast.success("Offer rejected");
      router.refresh();
    }
    setLoading(null);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Pending Approval">
                  Pending Approval
                </SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Sent">Sent</SelectItem>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {filteredOffers.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No offers found matching your filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOffers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              loading={loading === offer.id}
              onSend={() => handleSendOffer(offer.id)}
              onAccept={() => handleAcceptOffer(offer.id)}
              onReject={(reason) => handleRejectOffer(offer.id, reason)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OfferCard({
  offer,
  loading,
  onSend,
  onAccept,
  onReject,
}: {
  offer: Offer;
  loading: boolean;
  onSend: () => void;
  onAccept: () => void;
  onReject: (reason?: string) => void;
}) {
  const [rejectReason, setRejectReason] = useState("");

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{offer.position}</h3>
              <Badge variant="outline">{offer.employmentType}</Badge>
            </div>
            <Link
              href={`/recruitment/candidates/${offer.candidateId}`}
              className="text-sm text-primary hover:underline"
            >
              {offer.candidateName}
            </Link>
            <p className="text-sm text-muted-foreground">{offer.department}</p>
          </div>
          <Badge
            variant={
              offer.status === "Accepted"
                ? "default"
                : offer.status === "Rejected" || offer.status === "Expired"
                  ? "destructive"
                  : "secondary"
            }
          >
            {offer.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center text-sm">
            <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground text-xs">Annual Salary</p>
              <p className="font-medium">${offer.salary.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center text-sm">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground text-xs">Start Date</p>
              <p className="font-medium">
                {new Date(offer.startDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {offer.validUntil && (
            <div className="flex items-center text-sm">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Valid Until</p>
                <p className="font-medium">
                  {new Date(offer.validUntil).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          <div className="text-sm">
            <p className="text-muted-foreground text-xs">Created</p>
            <p className="font-medium">
              {new Date(offer.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {(offer.status === "Draft" || offer.status === "Approved") && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              size="sm"
              onClick={onSend}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Offer
            </Button>
          </div>
        )}

        {offer.status === "Sent" && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              size="sm"
              onClick={onAccept}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Mark as Accepted
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loading}
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Mark as Rejected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reject Offer</AlertDialogTitle>
                  <AlertDialogDescription>
                    Provide a reason why the candidate rejected this offer
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                  placeholder="Reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onReject(rejectReason)}>
                    Mark as Rejected
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {offer.sentAt && (
          <div className="text-xs text-muted-foreground pt-4 border-t">
            Sent on {new Date(offer.sentAt).toLocaleString()}
            {offer.acceptedAt && (
              <> · Accepted on {new Date(offer.acceptedAt).toLocaleString()}</>
            )}
            {offer.rejectedAt && (
              <> · Rejected on {new Date(offer.rejectedAt).toLocaleString()}</>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
