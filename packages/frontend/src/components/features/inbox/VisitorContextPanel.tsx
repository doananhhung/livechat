// src/components/features/inbox/VisitorContextPanel.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ZoomIn } from "lucide-react";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../ui/Button";
import { Dialog, DialogContent } from "../../ui/Dialog";
import { Spinner } from "../../../components/ui/Spinner";
import { useGetVisitor } from "../../../services/inboxApi";
import type { Conversation, VisitorSessionMetadata } from "@live-chat/shared-types";
import { VisitorNoteList } from "./VisitorNoteList";

/**
 * Component displaying detailed visitor information.
 */
export const VisitorContextPanel = ({ conversation }: { conversation: Conversation }) => {
  const { t } = useTranslation();
  const { data: visitor, isLoading } = useGetVisitor(conversation.projectId, Number(conversation.visitorId));
  const [isScreenshotModalOpen, setScreenshotModalOpen] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const screenshotUrl =
    visitor?.currentUrl && API_BASE_URL
      ? `${API_BASE_URL}/utils/screenshot?url=${encodeURIComponent(
          visitor.currentUrl
        )}`
      : null;

  const metadata: VisitorSessionMetadata | undefined = conversation.metadata || undefined;
  const urlHistory = metadata?.urlHistory || [];
  // Display history in reverse chronological order (newest first)
  const sortedHistory = [...urlHistory].reverse();
  const displayedHistory = showFullHistory ? sortedHistory : sortedHistory.slice(0, 3);


  return (
    <div className="flex flex-col h-full"> {/* Changed from <aside> to <div> */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="font-semibold mb-4 text-foreground">
          {t("visitor.details")}
        </h3>
        {isLoading && <Spinner />}
        {visitor && (
          <div className="text-sm space-y-4">
            <div className="flex items-center space-x-3">
              <Avatar name={visitor.displayName} />
              <p className="font-semibold text-foreground">
                {visitor.displayName}
              </p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">{t("visitor.currentPage")}:</p>
              <a
                href={visitor.currentUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary break-all hover:underline"
                title={visitor.currentUrl || t("common.unknown")}
              >
                {visitor.currentUrl || t("common.unknown")}
              </a>
            </div>

            {metadata?.referrer && (
              <div>
                <p className="font-medium text-muted-foreground">{t("visitor.referrer")}:</p>
                <a
                  href={metadata.referrer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary break-all hover:underline"
                  title={metadata.referrer}
                >
                  {metadata.referrer}
                </a>
              </div>
            )}

            {urlHistory.length > 0 && (
              <div>
                <h4 className="font-medium text-muted-foreground mb-2">{t("visitor.sessionHistory")}:</h4>
                <ul className="space-y-1 text-xs">
                  {displayedHistory.map((entry, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2 text-muted-foreground">[{new Date(entry.timestamp).toLocaleTimeString()}]</span>
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary break-all hover:underline leading-tight"
                        title={entry.title}
                      >
                        {entry.title}
                      </a>
                    </li>
                  ))}
                </ul>
                {urlHistory.length > 5 && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowFullHistory(!showFullHistory)}
                    className="p-0 h-auto mt-2"
                  >
                    {showFullHistory ? t("visitor.showLess") : t("visitor.viewAllPages", { count: urlHistory.length })}
                  </Button>
                )}
              </div>
            )}

            {/* === SCREENSHOT BLOCK === */}
            {screenshotUrl && (
              <div className="space-y-2">
                <p className="font-medium text-muted-foreground">
                  {t("visitor.pagePreview")}:
                </p>
                <button
                  type="button"
                  onClick={() => setScreenshotModalOpen(true)}
                  className="w-full aspect-[16/10] rounded-md border bg-muted flex items-center justify-center overflow-hidden relative group cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <img
                    src={screenshotUrl}
                    alt={`Screenshot of ${visitor.currentUrl}`}
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                    key={screenshotUrl}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="h-8 w-8 text-white" />
                  </div>
                </button>
              </div>
            )}
            {/* === END SCREENSHOT BLOCK === */}
          </div>
        )}

        {/* === DIALOG COMPONENT === */}
        <Dialog
          open={isScreenshotModalOpen}
          onOpenChange={setScreenshotModalOpen}
          className="max-w-[70vw]"
        >
          <DialogContent className="p-2">
            <img
              src={screenshotUrl || ""}
              alt={`Screenshot of ${visitor?.currentUrl}`}
              className="w-full h-auto object-contain max-h-[80vh]"
            />
          </DialogContent>
        </Dialog>
      </div>
      <VisitorNoteList projectId={conversation.projectId} visitorId={Number(conversation.visitorId)} />
    </div>
  );
};
