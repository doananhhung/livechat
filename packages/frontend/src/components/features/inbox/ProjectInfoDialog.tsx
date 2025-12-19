import { useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/Dialog";
import { Button } from "../../ui/Button";
import { useToast } from "../../ui/use-toast";
import type { ProjectWithRole } from "@live-chat/shared";
import { getWidgetSnippet } from "../../../lib/widget";

interface ProjectInfoDialogProps {
  project: ProjectWithRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProjectInfoDialog = ({
  project,
  open,
  onOpenChange,
}: ProjectInfoDialogProps) => {
  const { toast } = useToast();
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedProjectId, setCopiedProjectId] = useState(false);

  const copyToClipboard = async (text: string, type: "snippet" | "id") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "snippet") {
        setCopiedSnippet(true);
        setTimeout(() => setCopiedSnippet(false), 2000);
      } else {
        setCopiedProjectId(true);
        setTimeout(() => setCopiedProjectId(false), 2000);
      }
      toast({
        title: "Đã sao chép",
        description:
          type === "snippet" ? "Đã sao chép mã nhúng" : "Đã sao chép ID dự án",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể sao chép vào clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thông tin dự án</DialogTitle>
          <DialogDescription>
            Chi tiết về dự án {project.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project ID */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              ID Dự án
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-3 py-2 rounded-md text-sm">
                {project.id}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(project.id.toString(), "id")}
              >
                {copiedProjectId ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Tên dự án
            </label>
            <p className="bg-muted px-3 py-2 rounded-md">{project.name}</p>
          </div>

          {/* Whitelisted Domains */}
          {project.whitelistedDomains &&
            project.whitelistedDomains.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Tên miền được phép ({project.whitelistedDomains.length})
                </label>
                <div className="bg-muted px-3 py-2 rounded-md space-y-1">
                  {project.whitelistedDomains.map(
                    (domain: string, index: number) => (
                      <div key={index} className="text-sm">
                        • {domain}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Widget Snippet */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Mã nhúng Widget
            </label>
            <div className="relative">
              <pre className="bg-muted text-sm p-4 rounded-md overflow-x-auto">
                <code>{getWidgetSnippet(project.id)}</code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() =>
                  copyToClipboard(getWidgetSnippet(project.id), "snippet")
                }
              >
                {copiedSnippet ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Đã sao chép
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Sao chép
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Created Date */}
          {project.createdAt && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Ngày tạo
              </label>
              <p className="bg-muted px-3 py-2 rounded-md">
                {new Date(project.createdAt).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
