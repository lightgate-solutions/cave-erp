"use client";

import { Dialog } from "../ui/dialog";
import CreateFolderButton from "./folders/create-folder-button";
import FoldersViewWrapper from "./folders/folders-view-wrapper";
import UploadDocumentButton from "./upload-document-button";
import { ViewToggle } from "./view-toggle/view-toggle";
import Link from "next/link";
import { ArrowLeft, FolderOpen } from "lucide-react";

export function DocumentsOverview({
  usersFolders,
  department,
}: {
  usersFolders: { id: number; name: string; path?: string; updatedAt: Date }[];
  department: string;
}) {
  return (
    <div className="flex w-full flex-col gap-8">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-100">
              <Link
                href="/"
                className="flex items-center gap-1 text-sm hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Documents
            </h1>
            <p className="max-w-2xl text-blue-100">
              Manage your organization's files, folders, and assets in one
              secure location.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/20">
            <div className="p-2 bg-white/20 rounded-md">
              <FolderOpen className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-blue-200 uppercase tracking-wider">
                Total Folders
              </span>
              <span className="text-xl font-bold text-white">
                {usersFolders.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-2">
          <ViewToggle />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Dialog>
            <CreateFolderButton
              usersFolders={usersFolders}
              department={department}
            />
          </Dialog>
          <Dialog>
            <UploadDocumentButton
              usersFolders={usersFolders}
              department={department}
            />
          </Dialog>
        </div>
      </div>

      {/* Content Section */}
      <div className="min-h-[400px]">
        <FoldersViewWrapper folders={usersFolders} department={department} />
      </div>
    </div>
  );
}
