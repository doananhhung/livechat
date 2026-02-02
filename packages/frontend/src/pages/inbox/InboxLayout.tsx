// src/pages/inbox/InboxLayout.tsx
import { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import {
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { MessageSquare, AlertTriangle } from "lucide-react";
import * as projectApi from "../../services/projectApi";
import { ProjectSelector } from "../../components/features/inbox/ProjectSelector";
import { ConversationList } from "../../components/features/inbox/ConversationList";
import { Spinner } from "../../components/ui/Spinner";
import { Button } from "../../components/ui/Button";
import { useSocket } from "../../contexts/SocketContext";
import { useMediaQuery } from "../../hooks/use-media-query";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../../components/ui/resizable";
import { VisitorContextPanel } from "../../components/features/inbox/VisitorContextPanel";
import { WebSocketEvent, type Conversation } from "@live-chat/shared-types";
import { JoinRoomDto, LeaveRoomDto } from "@live-chat/shared-dtos";

const InboxContent = () => {
  const { t } = useTranslation();
  const { projectId, conversationId } = useParams<{
    projectId: string;
    conversationId: string;
  }>();

  // Now, useSocket() is called within a child of SocketProvider, so it will get the real socket.
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) {
      return;
    }
    if (!projectId) {
      return;
    }
    const payload: JoinRoomDto = { projectId: Number(projectId) };

    socket.emit(
      WebSocketEvent.JOIN_PROJECT_ROOM,
      payload,
      (response: { status: string; roomName: string }) => {
        if (response.status === "ok") {
          console.log(`✅ Successfully joined room: ${response.roomName}`);
        } else {
          console.error(`❌ Failed to join room.`);
        }
      },
    );

    // Cleanup function to leave room
    return () => {
      const leavePayload: LeaveRoomDto = { projectId: Number(projectId) };
      socket.emit(
        WebSocketEvent.LEAVE_PROJECT_ROOM,
        leavePayload,
        (response: { status: string; roomName: string }) => {
          if (response.status === "ok") {
            console.log(`✅ Successfully left room: ${response.roomName}`);
          }
        },
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, projectId]);

  // The original JSX for the content goes here.
  // Note: We removed the responsive utility classes here because the parent layout handles visibility
  return (
    <main className="flex-1 h-full flex flex-col bg-background">
      {conversationId ? (
        <Outlet />
      ) : (
        <div className="flex-1 grid place-items-center h-full">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="mx-auto h-12 w-12" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              {t("inbox.welcome")}
            </h2>
            <p className="mt-2 text-sm">{t("inbox.selectConversation")}</p>
          </div>
        </div>
      )}
    </main>
  );
};

export const InboxLayout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projectId, conversationId } = useParams<{
    projectId: string;
    conversationId: string;
  }>();

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const queryClient = useQueryClient();

  // Force re-render when conversations cache updates to 'success'
  // Only trigger on 'updated' type with 'success' action to avoid infinite loops
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === "updated" &&
        event.query.queryKey[0] === "conversations" &&
        event.action?.type === "success"
      ) {
        setTick((t) => t + 1);
      }
    });
    return unsubscribe;
  }, [queryClient]);

  // DEBUG: Log localStorage for resizable panels
  useEffect(() => {
    const logStorage = () => {
      const saved = localStorage.getItem(
        "react-resizable-panels:inbox-layout-v1",
      );
      console.log("[InboxLayout] localStorage 'inbox-layout-v1':", saved);
    };
    logStorage();
    // Also log on storage events (from other tabs)
    window.addEventListener("storage", logStorage);
    return () => window.removeEventListener("storage", logStorage);
  }, []);

  // Find the conversation from the infinite query cache to pass to VisitorContextPanel
  const conversation = queryClient
    .getQueriesData<InfiniteData<{ data: Conversation[] }>>({
      queryKey: ["conversations"],
    })
    .flatMap(([, cacheData]) => cacheData?.pages.flatMap((page) => page.data))
    .find((c) => c && Number(c.id) === Number(conversationId));

  const {
    data: projects,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: projectApi.getProjects,
  });

  // Compute effective project ID early (before early returns)
  const effectiveProjectId =
    projectId ||
    (projects && projects.length > 0 ? projects[0].id.toString() : undefined);
  const numericProjectId = effectiveProjectId
    ? parseInt(effectiveProjectId, 10)
    : undefined;

  useEffect(() => {
    if (projects && projects.length > 0 && !projectId) {
      navigate(`/inbox/projects/${projects[0].id}`, { replace: true });
    }
  }, [projects, projectId, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  if (isError || !projects) {
    return (
      <div className="flex flex-col h-screen items-center justify-center text-center bg-background text-foreground">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold">{t("inbox.loadError")}</h2>
        <p className="mt-2 text-muted-foreground">
          {t("inbox.loadErrorDescription")}
        </p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col h-screen items-center justify-center text-center bg-background text-foreground">
        <h2 className="text-xl font-semibold">{t("inbox.noProjects")}</h2>
        <p className="mt-2 text-muted-foreground">
          {t("inbox.noProjectsDescription")}
        </p>
        <Button className="mt-4" onClick={() => navigate("/settings/projects")}>
          {t("settings.menu.projects")}
        </Button>
      </div>
    );
  }

  // effectiveProjectId and numericProjectId are computed above before early returns

  // === Desktop Layout (Resizable Panels) ===
  // IMPORTANT: Always render all 3 panels to maintain consistent layout for react-resizable-panels.
  // The library uses panel IDs to match saved layouts. If panel count changes, layouts cannot be restored.
  if (isDesktop) {
    return (
      <div className="h-full bg-muted/40 overflow-hidden">
        <ResizablePanelGroup
          direction="horizontal"
          autoSaveId="inbox-layout-v1"
        >
          {/* Left: Conversation List */}
          <ResizablePanel
            id="left"
            order={1}
            defaultSize={20}
            minSize={15}
            maxSize={30}
            collapsible={true}
          >
            <aside className="flex flex-col h-full border-r bg-card">
              <header className="p-4 border-b">
                <ProjectSelector
                  projects={projects}
                  activeProjectId={effectiveProjectId}
                />
              </header>
              <main className="flex-1 overflow-y-auto">
                <ConversationList overrideProjectId={effectiveProjectId} />
              </main>
            </aside>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Center: Message Area */}
          <ResizablePanel id="center" order={2} defaultSize={55} minSize={30}>
            <InboxContent />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right: Visitor Details - Always rendered, content conditional */}
          <ResizablePanel
            id="right"
            order={3}
            defaultSize={25}
            minSize={20}
            maxSize={40}
            collapsible={true}
          >
            {conversation ? (
              <VisitorContextPanel conversation={conversation} />
            ) : (
              <div className="h-full flex items-center justify-center bg-card text-muted-foreground text-sm">
                {conversationId ? (
                  <Spinner />
                ) : (
                  <p>{t("inbox.selectConversationForDetails")}</p>
                )}
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  }

  // === Mobile Layout (Stacked/Swapped) ===
  // If conversation selected, show Chat. Else show List.
  return (
    <div className="flex h-full bg-muted/40">
      <aside
        className={`flex flex-col w-full border-r bg-card h-full ${conversationId ? "hidden" : "flex"}`}
      >
        <header className="p-4 border-b">
          <ProjectSelector
            projects={projects}
            activeProjectId={effectiveProjectId}
          />
        </header>
        <main className="flex-1 overflow-y-auto">
          <ConversationList overrideProjectId={effectiveProjectId} />
        </main>
      </aside>
      <div
        className={`flex-1 flex flex-col h-full ${conversationId ? "flex" : "hidden"}`}
      >
        <InboxContent />
      </div>
    </div>
  );
};
