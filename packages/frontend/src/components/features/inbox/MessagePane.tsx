// src/components/features/inbox/MessagePane.tsx
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  useGetMessages,
  useUpdateConversationStatus,
} from "../../../services/inboxApi";
import type { Conversation, Message } from "@live-chat/shared-types";
import { ConversationStatus } from "@live-chat/shared-types";
import MessageComposer from "./MessageComposer";
import { Spinner } from "../../../components/ui/Spinner";
import { Avatar } from "../../../components/ui/Avatar";
import { useTypingStore } from "../../../stores/typingStore";
import { TypingIndicator } from "./TypingIndicator";
import { useEffect, useState } from "react";
import { Button } from "../../ui/Button";
import { formatMessageTime } from "../../../lib/dateUtils";
import { cn } from "../../../lib/utils";
import { useToast } from "../../ui/use-toast";
import {
  ChevronDown,
  CheckCircle,
  Clock,
  AlertOctagon,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../../ui/DropdownMenu";
import {
  getStatusLabel,
  getAvailableTransitions,
} from "../../../lib/conversationUtils";

import { AssignmentControls } from "./AssignmentControls";
import { FormRequestBubble } from "./FormRequestBubble";
import { FormSubmissionBubble } from "./FormSubmissionBubble";

/**
 * Renders message content based on contentType.
 * Switches between plain text, form request, and form submission.
 */
const renderMessageContent = (
  msg: Message,
  conversationId: number,
  submissionMessage?: Message,
) => {
  switch (msg.contentType) {
    case "form_request":
      return (
        <FormRequestBubble
          message={msg}
          conversationId={conversationId}
          submissionMessage={submissionMessage}
        />
      );
    case "form_submission":
      return <FormSubmissionBubble message={msg} />;
    default:
      return msg.content;
  }
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

  // Map request IDs to their submission messages
  const submissionMap = new Map<string, Message>();
  messages.forEach((msg) => {
    if (
      msg.contentType === "form_submission" &&
      msg.metadata?.formRequestMessageId
    ) {
      submissionMap.set(String(msg.metadata.formRequestMessageId), msg);
    }
  });

  // Filter out submissions that have a corresponding request in the list
  // If the request is missing, we still show the submission (fallback)
  const visibleMessages = messages.filter((msg) => {
    if (
      msg.contentType === "form_submission" &&
      msg.metadata?.formRequestMessageId
    ) {
      const requestId = String(msg.metadata.formRequestMessageId);
      const requestExists = messages.some((m) => String(m.id) === requestId);
      return !requestExists;
    }
    return true;
  });

  // Group messages by sender to show avatar only for first message in group
  const groupedMessages = visibleMessages.reduce(
    (groups: Message[][], msg, index) => {
      if (
        index === 0 ||
        visibleMessages[index - 1].fromCustomer !== msg.fromCustomer
      ) {
        groups.push([msg]);
      } else {
        groups[groups.length - 1].push(msg);
      }
      return groups;
    },
    [],
  );

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

              // Check if this is a form message that should be centered
              const isFormMessage =
                msg.contentType === "form_request" ||
                msg.contentType === "form_submission";

              const submissionMsg =
                msg.contentType === "form_request"
                  ? submissionMap.get(String(msg.id))
                  : undefined;

              // Centered form message layout
              if (isFormMessage) {
                return (
                  <div
                    key={msg.id}
                    className="flex justify-center my-4 animate-slide-in"
                  >
                    {renderMessageContent(msg, conversationId, submissionMsg)}
                  </div>
                );
              }

              // Regular message layout (left/right aligned)
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2 animate-slide-in",
                    msg.fromCustomer ? "justify-start" : "justify-end",
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

                  {/* Agent Status Indicator (Left of bubble) */}
                  {!msg.fromCustomer && (
                    <div className="flex flex-col justify-end pb-2">
                      {msg.status === "sending" && (
                        <Spinner className="h-3 w-3 text-muted-foreground" />
                      )}
                      {msg.status === "failed" && (
                        <AlertCircle className="h-3 w-3 text-destructive" />
                      )}
                    </div>
                  )}

                  {/* Message bubble and timestamp */}
                  <div
                    className={cn(
                      "flex flex-col max-w-[70%]",
                      msg.fromCustomer ? "items-start" : "items-end",
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 px-3 break-words rounded-xl",
                        msg.fromCustomer
                          ? "bg-muted text-muted-foreground rounded-tl-none"
                          : "bg-primary text-primary-foreground rounded-tr-none",
                        msg.status === "sending" && "opacity-70",
                      )}
                    >
                      {renderMessageContent(msg, conversationId, submissionMsg)}
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
  const { t } = useTranslation();
  const { projectId, conversationId } = useParams<{
    projectId: string;
    conversationId: string;
  }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const numericProjectId = projectId ? parseInt(projectId, 10) : undefined;
  const convoId = conversationId ? parseInt(conversationId, 10) : undefined;

  const { data: messages, isLoading } = useGetMessages(
    numericProjectId,
    convoId,
  );
  const { mutate: updateConversation, isPending: isUpdatingStatus } =
    useUpdateConversationStatus();

  // Force re-render when conversations cache updates
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.query.queryKey[0] === "conversations") {
        setTick((t) => t + 1);
      }
    });
    return unsubscribe;
  }, [queryClient]);

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

  useEffect(() => {
    if (
      convoId &&
      numericProjectId &&
      conversation &&
      conversation.unreadCount > 0
    ) {
      updateConversation({
        projectId: numericProjectId,
        conversationId: convoId,
        payload: { read: true },
      });
    }
  }, [convoId, numericProjectId, conversation, updateConversation]);

  const handleStatusUpdate = (newStatus: ConversationStatus) => {
    if (!conversation || !numericProjectId) return;

    // Capture current status before update for comparison
    const currentStatus = conversation.status;

    updateConversation(
      {
        projectId: numericProjectId,
        conversationId: Number(conversation.id),
        payload: { status: newStatus },
      },
      {
        onSuccess: () => {
          const visitorName =
            conversation.visitor?.displayName || t("visitor.guest");
          toast({
            title: t("common.success"),
            description: t("toast.statusUpdated", {
              visitorName,
              status: getStatusLabel(newStatus),
            }),
          });

          // Navigate to the new status filter so user can continue viewing the conversation
          // This prevents the "Loading conversation..." state when conversation moves to different filter
          if (currentStatus !== newStatus) {
            navigate(
              `/inbox/projects/${projectId}/conversations/${conversationId}?status=${newStatus}`,
            );
          }
        },
        onError: (error: Error) => {
          toast({
            title: t("common.error"),
            description: error.message || t("inbox.statusUpdateError"),
            variant: "destructive",
          });
        },
      },
    );
  };

  const getStatusIcon = (s: ConversationStatus) => {
    switch (s) {
      case ConversationStatus.OPEN:
        return <RotateCcw className="h-4 w-4" />;
      case ConversationStatus.PENDING:
        return <Clock className="h-4 w-4" />;
      case ConversationStatus.SOLVED:
        return <CheckCircle className="h-4 w-4" />;
      case ConversationStatus.SPAM:
        return <AlertOctagon className="h-4 w-4" />;
      default:
        return null;
    }
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
    <div className="flex flex-col bg-background h-full">
      <header className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Avatar name={conversation?.visitor?.displayName} size="md" />
          <div>
            <h2 className="font-semibold text-foreground">
              {conversation?.visitor?.displayName || t("visitor.guest")}
            </h2>
            {conversation && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {t("inbox.statusLabel")}:{" "}
                <span className="font-medium">
                  {getStatusLabel(conversation.status)}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {conversation && <AssignmentControls conversation={conversation} />}

          {!conversation && (
            <span className="text-sm text-muted-foreground">
              {t("inbox.loadingConversation")}
            </span>
          )}

          {conversation && !conversation.status && (
            <span className="text-sm text-yellow-500">
              ⚠️ {t("inbox.noStatus")}
            </span>
          )}

          {conversation && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUpdatingStatus}
                  className="gap-2"
                >
                  {isUpdatingStatus ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <>
                      {getStatusIcon(conversation.status)}
                      {getStatusLabel(conversation.status)}
                    </>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t("inbox.changeStatus")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {getAvailableTransitions(conversation.status).map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => handleStatusUpdate(s)}
                  >
                    {getStatusIcon(s)}
                    <span className="ml-2">{getStatusLabel(s)}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <MessageList
        messages={messages || []}
        conversationId={convoId}
        visitorName={conversation?.visitor?.displayName || "Anonymous"}
      />

      {numericProjectId && convoId && (
        <MessageComposer
          projectId={numericProjectId}
          conversationId={convoId}
        />
      )}
    </div>
  );
};
