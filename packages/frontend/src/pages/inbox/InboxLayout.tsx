// src/pages/inbox/InboxLayout.tsx
import { useEffect } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, AlertTriangle } from "lucide-react";
import * as projectApi from "../../services/projectApi";
import { ProjectSelector } from "../../components/features/inbox/ProjectSelector";
import { ConversationList } from "../../components/features/inbox/ConversationList";
import { Spinner } from "../../components/ui/Spinner";
import { Button } from "../../components/ui/Button";
import { useSocket } from "../../contexts/SocketContext";

const InboxContent = () => {
  const { projectId, conversationId } = useParams<{
    projectId: string;
    conversationId: string;
  }>();

  // Now, useSocket() is called within a child of SocketProvider, so it will get the real socket.
  const { socket } = useSocket();

  useEffect(() => {
    console.log("InboxContent: socket or projectId changed");
    if (!socket) {
      console.log("Socket is not initialized yet.");
      return;
    }
    if (!projectId) {
      console.log("No projectId available in URL params.");
      return;
    }
    const payload = { projectId: Number(projectId) };

    console.log("socket:", socket);

    // Add the callback function as the third argument
    console.log("[Socket.IO] Emitting joinProjectRoom", payload);
    socket.emit(
      "joinProjectRoom",
      payload,
      (response: { status: string; roomName: string }) => {
        if (response.status === "ok") {
          console.log(`✅ Successfully joined room: ${response.roomName}`);
        } else {
          console.error(`❌ Failed to join room.`);
        }
      }
    );

    // Cleanup function to leave room
    return () => {
      // Also add it to the cleanup function
      console.log("[Socket.IO] Emitting leaveProjectRoom", payload);
      socket.emit(
        "leaveProjectRoom",
        payload,
        (response: { status: string; roomName: string }) => {
          if (response.status === "ok") {
            console.log(`✅ Successfully left room: ${response.roomName}`);
          }
        }
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, projectId]);

  // The original JSX for the content goes here.
  return (
    <main
      className={`flex-1 hidden ${
        conversationId ? "md:flex" : "md:grid place-items-center"
      }`}
    >
      {conversationId ? (
        <Outlet />
      ) : (
        <div className="text-center text-muted-foreground">
          <MessageSquare className="mx-auto h-12 w-12" />
          <h2 className="mt-4 text-xl font-semibold text-foreground">
            Chào mừng đến Hộp thư của bạn
          </h2>
          <p className="mt-2 text-sm">
            Chọn một cuộc trò chuyện từ danh sách bên trái để xem tin nhắn.
          </p>
        </div>
      )}
    </main>
  );
};

export const InboxLayout = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{
    projectId: string;
    conversationId: string;
  }>();

  const {
    data: projects,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: projectApi.getProjects,
  });

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
        <h2 className="text-xl font-semibold">Lỗi tải dự án</h2>
        <p className="mt-2 text-muted-foreground">
          Không thể tải danh sách dự án. Vui lòng thử lại sau.
        </p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col h-screen items-center justify-center text-center bg-background text-foreground">
        <h2 className="text-xl font-semibold">Không tìm thấy dự án nào</h2>
        <p className="mt-2 text-muted-foreground">
          Vui lòng tạo một dự án trong phần cài đặt để bắt đầu nhận tin nhắn.
        </p>
        <Button className="mt-4" onClick={() => navigate("/settings/projects")}>
          Đi đến Cài đặt Dự án
        </Button>
      </div>
    );
  }

  // REMOVED nested SocketProvider to prevent duplicate socket connections
  // Socket is already provided at root level in main.tsx
  return (
    <div className="flex h-[calc(100vh-5rem)] bg-muted/40">
      <aside className="flex flex-col w-full md:w-1/3 max-w-sm border-r bg-card">
        <header className="p-4 border-b">
          <ProjectSelector projects={projects} activeProjectId={projectId} />
        </header>
        <main className="flex-1 overflow-y-auto">
          <ConversationList />
        </main>
      </aside>
      <InboxContent />
    </div>
  );
};
