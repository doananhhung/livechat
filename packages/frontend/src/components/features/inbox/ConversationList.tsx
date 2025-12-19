// src/components/features/inbox/ConversationList.tsx
import { useEffect, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import {
  useGetConversations,
  useUpdateConversationStatus,
} from "../../../services/inboxApi";
import { Spinner } from "../../ui/Spinner";
import { cn } from "../../../lib/utils";
import { useTypingStore } from "../../../stores/typingStore";
import { useProjectStore } from "../../../stores/projectStore";
import { Button } from "../../ui/Button";
import { Avatar } from "../../ui/Avatar";
import { useTimeAgo } from "../../../hooks/useTimeAgo";

const ConversationTime = ({ date }: { date: Date | string }) => {
  const timeAgo = useTimeAgo(date);
  return <>{timeAgo}</>;
};

export const ConversationList = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const setCurrentProjectId = useProjectStore(
    (state) => state.setCurrentProjectId
  );
  const [status, setStatus] = useState<"open" | "closed" | undefined>("open");

  // Set the current project ID in the global store
  useEffect(() => {
    const numericProjectId = projectId ? parseInt(projectId, 10) : null;
    setCurrentProjectId(numericProjectId);

    // On cleanup, reset the project ID
    return () => {
      setCurrentProjectId(null);
    };
  }, [projectId, setCurrentProjectId]);

  const numericProjectId = projectId ? parseInt(projectId, 10) : undefined;
  const { typingStatus } = useTypingStore();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetConversations({
      projectId: numericProjectId,
      status,
    });
  const { mutate: updateConversation } = useUpdateConversationStatus();

  const conversations = data?.pages.flatMap((page) => page.data) || [];

  const FilterButton = ({
    value,
    label,
  }: {
    value: typeof status;
    label: string;
  }) => (
    <Button
      variant={status === value ? "outline" : "ghost"}
      size="sm"
      onClick={() => setStatus(value)}
      className="flex-1"
    >
      {label}
    </Button>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 border-b">
        <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
          <FilterButton value="open" label="Mở" />
          <FilterButton value="closed" label="Đóng" />
          <FilterButton value={undefined} label="Tất cả" />
        </div>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center p-8 h-full">
          <Spinner />
        </div>
      ) : conversations.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground h-full flex flex-col justify-center">
          <h3 className="font-semibold text-foreground">
            Chưa có cuộc trò chuyện nào
          </h3>
          <p className="text-sm mt-1">
            Khi khách truy cập trang web của bạn gửi tin nhắn, nó sẽ xuất hiện ở
            đây.
          </p>
        </div>
      ) : (
        <nav className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => {
            const isTyping = typingStatus[conversation.id];

            return (
              <NavLink
                key={conversation.id}
                to={`/inbox/projects/${projectId}/conversations/${conversation.id}`}
                className={({ isActive }) =>
                  cn(
                    "block p-4 border-b transition-all duration-200",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                    isActive
                      ? "bg-accent text-accent-foreground relative z-10"
                      : "bg-card text-card-foreground"
                  )
                }
                onClick={() => {
                  if (conversation.unreadCount > 0) {
                    updateConversation({
                      conversationId: conversation.id,
                      payload: { read: true },
                    });
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    name={conversation.visitor.displayName}
                    size="md"
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <p
                        className={cn(
                          "font-semibold truncate",
                          conversation.unreadCount > 0 && "text-foreground"
                        )}
                      >
                        {conversation.visitor.displayName}
                      </p>
                      <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                        {conversation.updatedAt && (
                          <ConversationTime date={conversation.updatedAt} />
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm truncate",
                          conversation.unreadCount > 0
                            ? "text-foreground font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        {isTyping ? (
                          <i className="text-primary">Đang nhập...</i>
                        ) : (
                          conversation.lastMessageSnippet || "Chưa có tin nhắn."
                        )}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center flex-shrink-0 animate-bounce-subtle">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </NavLink>
            );
          })}
          {hasNextPage && (
            <div className="p-4 flex justify-center">
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                variant="outline"
              >
                {isFetchingNextPage ? "Đang tải..." : "Tải thêm"}
              </Button>
            </div>
          )}
        </nav>
      )}
    </div>
  );
};
