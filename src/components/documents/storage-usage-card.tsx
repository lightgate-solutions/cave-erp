"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { HardDrive, TrendingUp, AlertCircle } from "lucide-react";
import { formatStorageSize } from "@/lib/storage-utils";
import Link from "next/link";

interface StorageUsageCardProps {
    storageUsedMb: number;
    storageQuotaMb: number;
    className?: string;
}

export function StorageUsageCard({
    storageUsedMb,
    storageQuotaMb,
    className,
}: StorageUsageCardProps) {
    const usagePercentage =
        storageQuotaMb > 0 ? (storageUsedMb / storageQuotaMb) * 100 : 0;
    const isApproachingLimit = usagePercentage >= 80;
    const isAtLimit = storageUsedMb >= storageQuotaMb;

    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div>
                        <div className="text-2xl font-bold">
                            {formatStorageSize(storageUsedMb)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            of {formatStorageSize(storageQuotaMb)} used
                        </p>
                    </div>

                    <Progress value={Math.min(usagePercentage, 100)} className="h-2" />

                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                            {usagePercentage.toFixed(1)}% used
                        </span>
                        <span className="text-muted-foreground">
                            {formatStorageSize(storageQuotaMb - storageUsedMb)} available
                        </span>
                    </div>

                    {isAtLimit && (
                        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3">
                            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                            <div className="space-y-1 flex-1">
                                <p className="text-sm font-medium text-destructive">
                                    Storage limit reached
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Upgrade your plan to upload more files
                                </p>
                                <Link href="/settings/billing">
                                    <Button size="sm" variant="destructive" className="mt-2">
                                        <TrendingUp className="mr-2 h-3 w-3" />
                                        Upgrade Plan
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}

                    {!isAtLimit && isApproachingLimit && (
                        <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-3">
                            <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                            <div className="space-y-1 flex-1">
                                <p className="text-sm font-medium">
                                    Approaching storage limit
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Consider upgrading to avoid interruptions
                                </p>
                                <Link href="/settings/billing">
                                    <Button size="sm" variant="outline" className="mt-2">
                                        View Plans
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
