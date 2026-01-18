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
import { VisitorNameEditor } from './VisitorNameEditor'; // Move import to top
import { ActionPanel } from "../actions/ActionPanel"; // ADDED
import { formatDistanceToNow } from 'date-fns'; // ADDED
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../../ui/resizable";

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
  
  // New State for Tabs
  const [activeTab, setActiveTab] = useState<"notes" | "actions">("notes");

  return (
    <div className="flex flex-col h-full bg-card">
      <ResizablePanelGroup direction="vertical" autoSaveId="visitor-panel-v1">
        {/* Top: Visitor Details */}
        <ResizablePanel id="visitor-details" order={1} defaultSize={70} minSize={30}>
          <div className="h-full overflow-y-auto p-4">
            <h3 className="font-semibold mb-4 text-foreground">
              {t("visitor.details")}
            </h3>
            {isLoading && <Spinner />}
            {visitor && (
              <div className="text-sm space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar name={visitor.displayName} />
                  <VisitorNameEditor visitor={visitor} projectId={conversation.projectId} />
                  {/* Online status indicator */}
                  {visitor.isOnline !== null && (
                    <span
                      className={`h-2 w-2 rounded-full ${
                        visitor.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                      title={visitor.isOnline ? t("visitor.status.online") : t("visitor.status.offline")}
                    />
                  )}
                </div>

                {/* Status Text / Last Seen */}
                {!visitor.isOnline && visitor.lastSeenAt && (
                  <div className="text-xs text-muted-foreground">
                    {t("visitor.status.offline")} • {t("visitor.lastSeen", { time: formatDistanceToNow(new Date(visitor.lastSeenAt), { addSuffix: true }) })}
                  </div>
                )}

                {/* Current Page - Only visible if Online */}
                {visitor.isOnline && (
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
                )}

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

                {/* Session History - Only visible if Online */}
                {visitor.isOnline && urlHistory.length > 0 && (
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
                {/* Only show screenshot if visitor is online */}
                {visitor.isOnline && screenshotUrl && (
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
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Bottom: Internal Notes */}
        <ResizablePanel id="internal-notes" order={2} defaultSize={30} minSize={20}>
            <div className="flex flex-col h-full">
                <div className="flex border-b bg-muted/20">
                    <button
                        className={`flex-1 p-2 text-sm font-medium ${activeTab === 'notes' ? 'bg-background border-b-2 border-primary text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
                        onClick={() => setActiveTab('notes')}
                    >
                        {t("visitor.notes")}
                    </button>
                    <button
                        className={`flex-1 p-2 text-sm font-medium ${activeTab === 'actions' ? 'bg-background border-b-2 border-primary text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
                        onClick={() => setActiveTab('actions')}
                    >
                        {t("visitor.actions")}
                    </button>
                </div>
                <div className="flex-1 overflow-hidden">
                    {activeTab === 'notes' ? (
                        <VisitorNoteList projectId={conversation.projectId} visitorId={Number(conversation.visitorId)} />
                    ) : (
                        <ActionPanel conversationId={String(conversation.id)} projectId={Number(conversation.projectId)} />
                    )}
                </div>
            </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

