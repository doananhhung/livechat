// src/components/features/inbox/MessagePane.tsx
import { useParams } from "react-router-dom";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import {
  useGetMessages,
  useGetVisitor,
  useUpdateConversationStatus,
} from "../../../services/inboxApi";
import type { Conversation, Message } from "@social-commerce/shared";
import { ConversationStatus } from "@social-commerce/shared";
import MessageComposer from "./MessageComposer";
import { Spinner } from "../../../components/ui/Spinner";
import { Avatar } from "../../../components/ui/Avatar";
import { useTypingStore } from "../../../stores/typingStore";
import { TypingIndicator } from "./TypingIndicator";
import { useEffect } from "react";
import { Button } from "../../ui/Button";
import { formatMessageTime } from "../../../lib/dateUtils";
import { cn } from "../../../lib/utils";

/**
 * Component displaying detailed visitor information.
 */
const VisitorContextPanel = ({ visitorId }: { visitorId: number }) => {
  const { data: visitor, isLoading } = useGetVisitor(visitorId);

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
            >
              {visitor.currentUrl || "Không rõ"}
            </a>
          </div>
        </div>
      )}
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
  const { conversationId } = useParams<{
    projectId: string;
    conversationId: string;
  }>();
  const queryClient = useQueryClient();

  const convoId = conversationId ? parseInt(conversationId, 10) : undefined;

  const { data: messages, isLoading } = useGetMessages(convoId);
  const { mutate: updateConversation, isPending: isUpdatingStatus } =
    useUpdateConversationStatus();

  // Find the conversation from the infinite query cache
  const conversation = queryClient
    .getQueriesData<InfiniteData<{ data: Conversation[] }>>({
      queryKey: ["conversations"],
    })
    .flatMap(([, cacheData]) => cacheData?.pages.flatMap((page) => page.data))
    .find((c) => c?.id === convoId);

  console.log("Retrieved conversation object:", conversation);

  useEffect(() => {
    if (convoId && conversation && conversation.unreadCount > 0) {
      updateConversation({
        conversationId: convoId,
        payload: { read: true },
      });
    }
  }, [convoId, conversation, updateConversation]);

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
            <h2 className="font-semibold text-foreground">
              {conversation?.visitor?.displayName || "Visitor"}
            </h2>
          </div>
          {conversation && (
            <div className="flex items-center gap-2">
              {conversation.status === "open" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateConversation({
                      conversationId: conversation.id,
                      payload: { status: ConversationStatus.CLOSED },
                    })
                  }
                  disabled={isUpdatingStatus}
                >
                  Đóng cuộc trò chuyện
                </Button>
              )}
              {conversation.status === "closed" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateConversation({
                      conversationId: conversation.id,
                      payload: { status: ConversationStatus.OPEN },
                    })
                  }
                  disabled={isUpdatingStatus}
                >
                  Mở lại cuộc trò chuyện
                </Button>
              )}
            </div>
          )}
        </header>

        <MessageList
          messages={messages || []}
          conversationId={convoId}
          visitorName={conversation?.visitor?.displayName}
        />

        <MessageComposer conversationId={convoId} />
      </div>

      {conversation && (
        <VisitorContextPanel visitorId={conversation.visitor.id} />
      )}
    </div>
  );
};
