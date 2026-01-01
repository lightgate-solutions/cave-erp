/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send, X, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { sendEmail } from "@/actions/mail/email";
import { DocumentSelectionDialog } from "@/components/mail/document-selection-dialog";

const composeEmailSchema = z.object({
  recipientIds: z
    .array(z.string())
    .min(1, "At least one recipient is required"),
  subject: z.string().min(1, "Subject is required").max(500),
  body: z.string().min(1, "Body is required"),
  attachmentIds: z.array(z.number()).optional(),
});

type ComposeEmailFormData = z.infer<typeof composeEmailSchema>;

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
}

interface Document {
  id: number;
  title: string;
  description: string | null;
  originalFileName: string | null;
  department: string;
  public: boolean | null;
  departmental: boolean | null;
  createdAt: Date;
  uploader: string | null;
  uploaderEmail: string | null;
  fileSize: string | null;
  mimeType: string | null;
}

interface ComposeEmailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  onSuccess?: () => void;
}

export function ComposeEmail({
  open,
  onOpenChange,
  users,
  onSuccess,
}: ComposeEmailProps) {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [documentSearchQuery, setDocumentSearchQuery] = useState("");
  const [showUserList, setShowUserList] = useState(false);
  const [_showDocumentList, setShowDocumentList] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [documents, _setDocuments] = useState<any>([]);

  const form = useForm<ComposeEmailFormData>({
    resolver: zodResolver(composeEmailSchema),
    defaultValues: {
      recipientIds: [],
      subject: "",
      body: "",
      attachmentIds: [],
    },
  });

  const onSubmit = async (data: ComposeEmailFormData) => {
    const result = await sendEmail({
      ...data,
      attachmentIds: selectedDocuments.map((doc) => doc.id),
    });

    if (result.success) {
      toast.success("Email sent successfully");
      form.reset();
      setSelectedUsers([]);
      setSelectedDocuments([]);
      setSearchQuery("");
      setDocumentSearchQuery("");
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error(result.error || "Failed to send email");
    }
  };

  const handleDocumentsSelected = (documents: Document[]) => {
    setSelectedDocuments(documents);
    form.setValue(
      "attachmentIds",
      documents.map((d) => d.id),
    );
  };

  const handleUserSelect = (user: User) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      const newSelectedUsers = [...selectedUsers, user];
      setSelectedUsers(newSelectedUsers);
      form.setValue(
        "recipientIds",
        newSelectedUsers.map((u) => u.id),
      );
    }
    setSearchQuery("");
    setShowUserList(false);
  };

  const handleUserRemove = (userId: string) => {
    const newSelectedUsers = selectedUsers.filter((u) => u.id !== userId);
    setSelectedUsers(newSelectedUsers);
    form.setValue(
      "recipientIds",
      newSelectedUsers.map((u) => u.id),
    );
  };

  const _handleDocumentSelect = (document: Document) => {
    if (!selectedDocuments.find((d) => d.id === document.id)) {
      const newSelectedDocuments = [...selectedDocuments, document];
      setSelectedDocuments(newSelectedDocuments);
      form.setValue(
        "attachmentIds",
        newSelectedDocuments.map((d) => d.id),
      );
    }
    setDocumentSearchQuery("");
    setShowDocumentList(false);
  };

  const handleDocumentRemove = (documentId: number) => {
    const newSelectedDocuments = selectedDocuments.filter(
      (d) => d.id !== documentId,
    );
    setSelectedDocuments(newSelectedDocuments);
    form.setValue(
      "attachmentIds",
      newSelectedDocuments.map((d) => d.id),
    );
  };

  const filteredUsers = users.filter(
    (user) =>
      (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
      !selectedUsers.find((u) => u.id === user.id),
  );

  const _filteredDocuments = documents.filter(
    (document: any) =>
      (document.title
        .toLowerCase()
        .includes(documentSearchQuery.toLowerCase()) ||
        document.description
          ?.toLowerCase()
          .includes(documentSearchQuery.toLowerCase()) ||
        document.originalFileName
          ?.toLowerCase()
          .includes(documentSearchQuery.toLowerCase())) &&
      !selectedDocuments.find((d) => d.id === document.id),
  );

  const handleClose = () => {
    form.reset();
    setSelectedUsers([]);
    setSelectedDocuments([]);
    setSearchQuery("");
    setDocumentSearchQuery("");
    setShowUserList(false);
    setShowDocumentList(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
          <DialogDescription>
            Send an email to other users in the system
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="recipientIds"
              render={() => (
                <FormItem>
                  <FormLabel>To *</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px]">
                        {selectedUsers.map((user) => (
                          <Badge
                            key={user.id}
                            variant="secondary"
                            className="gap-1"
                          >
                            {user.name}
                            <button
                              type="button"
                              onClick={() => handleUserRemove(user.id)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                        <div className="relative flex-1 min-w-[200px]">
                          <Input
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setShowUserList(true);
                            }}
                            onFocus={() => setShowUserList(true)}
                            placeholder="Search users..."
                            className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                          {showUserList &&
                            searchQuery &&
                            filteredUsers.length > 0 && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                                {filteredUsers.map((user) => (
                                  <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => handleUserSelect(user)}
                                    className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                                  >
                                    <div className="font-medium">
                                      {user.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {user.email}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter subject" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="attachmentIds"
              render={() => (
                <FormItem>
                  <FormLabel>Attachments</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {selectedDocuments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedDocuments.map((document) => (
                            <Badge
                              key={document.id}
                              variant="secondary"
                              className="gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              {document.title}
                              <button
                                type="button"
                                onClick={() =>
                                  handleDocumentRemove(document.id)
                                }
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDocumentDialogOpen(true)}
                          className="shrink-0"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Browse
                        </Button>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your message..."
                      className="min-h-[300px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="gap-2"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>

        <DocumentSelectionDialog
          open={documentDialogOpen}
          onOpenChange={setDocumentDialogOpen}
          selectedDocuments={selectedDocuments}
          onDocumentsSelected={handleDocumentsSelected}
        />
      </DialogContent>
    </Dialog>
  );
}
