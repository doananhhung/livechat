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
}: {
  messages: Message[];
  conversationId: number;
}) => {
  const { typingStatus } = useTypingStore();
  const isTyping = typingStatus[conversationId];

  return (
    <div className="flex-1 p-4 overflow-y-auto flex flex-col-reverse">
      {isTyping && (
        <div className="flex my-2 items-end gap-2 justify-start">
          <div className="bg-muted rounded-lg p-2 px-3">
            <TypingIndicator />
          </div>
        </div>
      )}
      <div>
        {messages?.map((msg) => (
          <div
            key={msg.id}
            className={`flex my-2 items-end gap-2 ${
              !msg.fromCustomer ? "justify-end" : "justify-start"
            }`}
          >
            {!msg.fromCustomer && <div className="flex-grow"></div>}
            <div
              className={`inline-block p-2 px-3 max-w-[80%] break-words ${
                !msg.fromCustomer
                  ? "bg-primary text-primary-foreground rounded-ag" // Agent's message
                  : "bg-muted text-muted-foreground rounded-vs" // Visitor's message
              }`}
            >
              {msg.content}
            </div>
            {msg.fromCustomer && <div className="flex-grow"></div>}
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
          <h2 className="font-semibold text-foreground">
            Trò chuyện với {conversation?.visitor?.displayName || "Visitor"}
          </h2>
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

        <MessageList messages={messages || []} conversationId={convoId} />

        <MessageComposer conversationId={convoId} />
      </div>

      {conversation && (
        <VisitorContextPanel visitorId={conversation.visitor.id} />
      )}
    </div>
  );
};
