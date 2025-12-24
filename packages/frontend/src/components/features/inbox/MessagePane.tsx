// src/components/features/inbox/MessagePane.tsx
import { useParams } from "react-router-dom";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import {
  useGetMessages,
  useGetVisitor,
  useUpdateConversationStatus,
} from "../../../services/inboxApi";
import type { Conversation, Message } from "@live-chat/shared-types";
import { ConversationStatus } from "@live-chat/shared-types";
import MessageComposer from "./MessageComposer";
import { Spinner } from "../../../components/ui/Spinner";
import { Avatar } from "../../../components/ui/Avatar";
import { useTypingStore } from "../../../stores/typingStore";
import { TypingIndicator } from "./TypingIndicator";
import { useEffect, useState } from "react"; // 1. Import useState
import { Button } from "../../ui/Button";
import { formatMessageTime } from "../../../lib/dateUtils";
import { cn } from "../../../lib/utils";
import { useToast } from "../../ui/use-toast";
import { Dialog, DialogContent } from "../../ui/Dialog"; // 2. Import Dialog
import { ZoomIn } from "lucide-react"; // 3. Import an icon

/**
 * Component displaying detailed visitor information.
 */
const VisitorContextPanel = ({ projectId, visitorId }: { projectId: number; visitorId: number }) => {
  const { data: visitor, isLoading } = useGetVisitor(projectId, visitorId);
  // 4. Add state for the dialog
  const [isScreenshotModalOpen, setScreenshotModalOpen] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const screenshotUrl =
    visitor?.currentUrl && API_BASE_URL
      ? `${API_BASE_URL}/utils/screenshot?url=${encodeURIComponent(
          visitor.currentUrl
        )}`
      : null;

  return (
    <aside className="w-64 bg-card border-l p-4 hidden lg:block">
      <h3 className="font-semibold mb-4 text-foreground">
        Chi tiết Khách truy cập
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
            <p className="font-medium text-muted-foreground">Đang xem trang:</p>
            <a
              href={visitor.currentUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary break-all hover:underline"
              title={visitor.currentUrl || "Không rõ"}
            >
              {visitor.currentUrl || "Không rõ"}
            </a>
          </div>

          {/* === 5. MODIFIED SCREENSHOT BLOCK === */}
          {screenshotUrl && (
            <div className="space-y-2">
              <p className="font-medium text-muted-foreground">
                Xem trước trang:
              </p>
              {/* Make the preview a clickable button */}
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
                {/* Add a zoom-in icon overlay on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn className="h-8 w-8 text-white" />
                </div>
              </button>
            </div>
          )}
          {/* === END OF MODIFIED BLOCK === */}
        </div>
      )}

      {/* === 6. ADD THE DIALOG COMPONENT === */}
      {/* It will show the same screenshotUrl */}
      <Dialog
        open={isScreenshotModalOpen}
        onOpenChange={setScreenshotModalOpen}
        className="max-w-[70vw]"
      >
        <DialogContent className="p-2">
          {" "}
          {/* Remove size class from here */}
          <img
            src={screenshotUrl || ""}
            alt={`Screenshot of ${visitor?.currentUrl}`}
            className="w-full h-auto object-contain max-h-[80vh]"
          />
        </DialogContent>
      </Dialog>
    </aside>
  );
};
/**
 * Component displaying the message list in a conversation.
 */
const MessageList = ({
  messages,
  conversationId,
  visitorName,
}: {
  messages: Message[];
  conversationId: number;
  visitorName?: string;
}) => {
  const { typingStatus } = useTypingStore();
  const isTyping = typingStatus[conversationId];

  // Group messages by sender to show avatar only for first message in group
  const groupedMessages = messages.reduce((groups: Message[][], msg, index) => {
    if (index === 0 || messages[index - 1].fromCustomer !== msg.fromCustomer) {
      groups.push([msg]);
    } else {
      groups[groups.length - 1].push(msg);
    }
    return groups;
  }, []);

  return (
    <div className="flex-1 p-4 overflow-y-auto flex flex-col-reverse">
      {isTyping && (
        <div className="flex my-2 items-end gap-2 justify-start animate-fade-in">
          <Avatar name={visitorName} size="sm" />
          <div className="bg-muted rounded-lg p-2 px-3">
            <TypingIndicator />
          </div>
        </div>
      )}
      <div className="space-y-4">
        {groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-1">
            {group.map((msg, msgIndex) => {
              const isFirstInGroup = msgIndex === 0;
              const isLastInGroup = msgIndex === group.length - 1;

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2 animate-slide-in",
                    msg.fromCustomer ? "justify-start" : "justify-end"
                  )}
                >
                  {/* Visitor messages - left side with avatar */}
                  {msg.fromCustomer && (
                    <>
                      {isFirstInGroup ? (
                        <Avatar name={visitorName} size="sm" className="mt-1" />
                      ) : (
                        <div className="w-8 flex-shrink-0" /> // Spacer for grouped messages
                      )}
                    </>
                  )}

                  {/* Message bubble and timestamp */}
                  <div
                    className={cn(
                      "flex flex-col max-w-[70%]",
                      msg.fromCustomer ? "items-start" : "items-end"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 px-3 break-words rounded-lg",
                        msg.fromCustomer
                          ? "bg-muted text-muted-foreground rounded-tl-none"
                          : "bg-primary text-primary-foreground rounded-tr-none"
                      )}
                    >
                      {msg.content}
                    </div>
                    {/* Show timestamp only for last message in group */}
                    {isLastInGroup && (
                      <span className="text-xs text-muted-foreground mt-0.5 px-1">
                        {msg.createdAt && formatMessageTime(msg.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Main component for the message display frame.
 */
export const MessagePane = () => {
  const { projectId, conversationId } = useParams<{
    projectId: string;
    conversationId: string;
  }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const numericProjectId = projectId ? parseInt(projectId, 10) : undefined;
  const convoId = conversationId ? parseInt(conversationId, 10) : undefined;

  const { data: messages, isLoading } = useGetMessages(numericProjectId, convoId);
  const { mutate: updateConversation, isPending: isUpdatingStatus } =
    useUpdateConversationStatus();

  // Find the conversation from the infinite query cache
  const conversation = queryClient
    .getQueriesData<InfiniteData<{ data: Conversation[] }>>({
      queryKey: ["conversations"],
    })
    .flatMap(([, cacheData]) => cacheData?.pages.flatMap((page) => page.data))
    .find((c) => {
      // Handle both string and number comparison (TypeORM bigint returns string)
      return c && Number(c.id) === Number(convoId);
    });

  console.log("🔍 Debug MessagePane:");
  console.log("  - conversationId from params:", conversationId);
  console.log("  - convoId (parsed):", convoId, "type:", typeof convoId);
  console.log("  - conversation object:", conversation);
  console.log(
    "  - conversation.id:",
    conversation?.id,
    "type:",
    typeof conversation?.id
  );
  console.log("  - conversation.status:", conversation?.status);
  console.log("  - conversation exists?", !!conversation);
  console.log(
    "  - ID match?",
    conversation && Number(conversation.id) === Number(convoId)
  );

  useEffect(() => {
    if (convoId && numericProjectId && conversation && conversation.unreadCount > 0) {
      updateConversation({
        projectId: numericProjectId,
        conversationId: convoId,
        payload: { read: true },
      });
    }
  }, [convoId, numericProjectId, conversation, updateConversation]);

  const handleStatusUpdate = (status: ConversationStatus) => {
    if (!conversation || !numericProjectId) return;

    updateConversation(
      {
        projectId: numericProjectId,
        conversationId: Number(conversation.id),
        payload: { status },
      },
      {
        onSuccess: () => {
          toast({
            title: "Thành công",
            description:
              status === ConversationStatus.CLOSED
                ? "Đã đóng cuộc trò chuyện"
                : "Đã mở lại cuộc trò chuyện",
          });
        },
        onError: (error: Error) => {
          toast({
            title: "Lỗi",
            description: error.message || "Không thể cập nhật trạng thái",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (!convoId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-1 w-full">
      <div className="flex-1 flex flex-col bg-background">
        <header className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Avatar name={conversation?.visitor?.displayName} size="md" />
            <div>
              <h2 className="font-semibold text-foreground">
                {conversation?.visitor?.displayName || "Visitor"}
              </h2>
              {/* Debug: Show status */}
              {conversation && (
                <p className="text-xs text-muted-foreground">
                  Status: {conversation.status || "unknown"}
                </p>
              )}
            </div>
          </div>

          {/* Debug: Always show this section */}
          <div className="flex items-center gap-2">
            {!conversation && (
              <span className="text-sm text-muted-foreground">
                Loading conversation...
              </span>
            )}

            {conversation && !conversation.status && (
              <span className="text-sm text-yellow-500">⚠️ No status</span>
            )}

            {conversation && conversation.status === "open" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate(ConversationStatus.CLOSED)}
                disabled={isUpdatingStatus}
              >
                Đóng cuộc trò chuyện
              </Button>
            )}

            {conversation && conversation.status === "closed" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate(ConversationStatus.OPEN)}
                disabled={isUpdatingStatus}
              >
                Mở lại cuộc trò chuyện
              </Button>
            )}
          </div>
        </header>

        <MessageList
          messages={messages || []}
          conversationId={convoId}
          visitorName={conversation?.visitor?.displayName || 'Anonymous'}
        />

        {numericProjectId && convoId && (
          <MessageComposer projectId={numericProjectId} conversationId={convoId} />
        )}
      </div>

      {conversation && conversation.visitor?.id && numericProjectId && (
        <VisitorContextPanel projectId={numericProjectId} visitorId={conversation.visitor.id} />
      )}
    </div>
  );
};
