// src/components/features/inbox/ConversationList.tsx
import { useEffect, useState } from "react";
import { NavLink, useParams, useNavigate, useLocation } from "react-router-dom";
import {
  useGetConversations,
  useUpdateConversationStatus,
  useDeleteConversation,
} from "../../../services/inboxApi";
import { Spinner } from "../../ui/Spinner";
import { cn } from "../../../lib/utils";
import { useTypingStore } from "../../../stores/typingStore";
import { useProjectStore } from "../../../stores/projectStore";
import { Button } from "../../ui/Button";
import { Avatar } from "../../ui/Avatar";
import { useTimeAgo } from "../../../hooks/useTimeAgo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/DropdownMenu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "../../ui/AlertDialog";
import { MoreHorizontal, Trash2 } from "lucide-react";
import type { Conversation } from "@live-chat/shared-types";

const ConversationTime = ({ date }: { date: Date | string }) => {
  const timeAgo = useTimeAgo(date);
  return <>{timeAgo}</>;
};

export const ConversationList = () => {
  const { projectId, conversationId: activeConversationId } = useParams<{
    projectId: string;
    conversationId?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const setCurrentProjectId = useProjectStore(
    (state) => state.setCurrentProjectId
  );
  const [status, setStatus] = useState<"open" | "closed" | undefined>("open");

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);

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
  const { mutate: deleteConversation, isPending: isDeleting } = useDeleteConversation();

  const conversations = data?.pages.flatMap((page) => page.data) || [];

  const handleDeleteClick = (e: React.MouseEvent, conversation: Conversation) => {
    e.preventDefault();
    e.stopPropagation();
    setConversationToDelete(conversation);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!conversationToDelete || !numericProjectId) return;

    const deletingId = conversationToDelete.id;

    deleteConversation(
      {
        projectId: numericProjectId,
        conversationId: deletingId,
      },
      {
        onSuccess: () => {
          // If we're viewing the deleted conversation, navigate away
          if (activeConversationId === deletingId) {
            navigate(`/inbox/projects/${projectId}`);
          }
          setDeleteDialogOpen(false);
          setConversationToDelete(null);
        },
        onError: () => {
          setDeleteDialogOpen(false);
          setConversationToDelete(null);
        },
      }
    );
  };

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
            const isTyping = typingStatus[Number(conversation.id)];

            return (
              <NavLink
                key={conversation.id}
                to={`/inbox/projects/${projectId}/conversations/${conversation.id}`}
                className={({ isActive }) =>
                  cn(
                    "block p-4 pr-2 border-b transition-all duration-200 group",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                    isActive
                      ? "bg-accent text-accent-foreground relative z-10"
                      : "bg-card text-card-foreground"
                  )
                }
                onClick={() => {
                  if (conversation.unreadCount > 0 && numericProjectId) {
                    updateConversation({
                      projectId: numericProjectId,
                      conversationId: Number(conversation.id),
                      payload: { read: true },
                    });
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    name={conversation.visitor?.displayName || 'Anonymous'}
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
                        {conversation.visitor?.displayName || 'Anonymous'}
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
                      <div className="flex items-center gap-1">
                        {conversation.assignee && (
                          <div title={`Assigned to ${conversation.assignee.fullName}`}>
                            <Avatar name={conversation.assignee.fullName} size="sm" className="w-5 h-5 text-[10px]" />
                          </div>
                        )}
                        {conversation.unreadCount > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center flex-shrink-0 animate-bounce-subtle">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* More options dropdown - visible on hover */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.preventDefault()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">More options</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive cursor-pointer"
                          onClick={(e) => handleDeleteClick(e, conversation)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa cuộc trò chuyện
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa cuộc trò chuyện?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Cuộc trò chuyện và tất cả tin nhắn sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              variant="destructive"
              disabled={isDeleting}
            >
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
