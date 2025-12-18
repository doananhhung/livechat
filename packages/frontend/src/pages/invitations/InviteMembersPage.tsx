import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  inviteUserToProject,
  getProjectInvitations,
  cancelInvitation,
  getProjects,
} from "../../services/projectApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/use-toast";
import {
  Mail,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import type {
  CreateInvitationDto,
  Invitation,
  ProjectRole,
} from "@live-chat/shared";
import { useIsProjectManager } from "../../hooks/useProjectRole";
import { Spinner } from "../../components/ui/Spinner";

const InviteMembersPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("agent");

  // Check if user is a manager in this project
  const isManager = useIsProjectManager(Number(projectId));

  // Fetch project details
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const currentProject = projects?.find((p) => p.id === Number(projectId));

  // Redirect if user is not a manager
  useEffect(() => {
    if (!isLoadingProjects && projects && !isManager) {
      toast({
        title: "Không có quyền truy cập",
        description: "Chỉ quản lý viên mới có thể mời thành viên vào dự án.",
        variant: "destructive",
      });
      navigate("/settings");
    }
  }, [isManager, isLoadingProjects, projects, navigate, toast]);

  // Fetch invitations for this project
  const { data: invitations, isLoading } = useQuery({
    queryKey: ["invitations", projectId],
    queryFn: () => getProjectInvitations(Number(projectId)),
    enabled: !!projectId,
  });

  // Mutation to send invitation
  const { mutate: sendInvitation, isPending: isSending } = useMutation({
    mutationFn: (data: CreateInvitationDto) => inviteUserToProject(data),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Lời mời đã được gửi thành công!",
      });
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["invitations", projectId] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description:
          error.response?.data?.message ||
          "Không thể gửi lời mời. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  // Mutation to cancel invitation
  const { mutate: cancelInvite } = useMutation({
    mutationFn: cancelInvitation,
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã hủy lời mời.",
      });
      queryClient.invalidateQueries({ queryKey: ["invitations", projectId] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể hủy lời mời.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !projectId) return;

    sendInvitation({
      email: email.trim(),
      projectId: Number(projectId),
      role: role as ProjectRole,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "expired":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Đang chờ";
      case "accepted":
        return "Đã chấp nhận";
      case "expired":
        return "Đã hết hạn";
      default:
        return status;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Show loading while checking permissions
  if (isLoadingProjects) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/settings/projects")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <h1 className="text-3xl font-bold">Mời thành viên</h1>
        {currentProject && (
          <p className="text-muted-foreground mt-2">
            Dự án: <span className="font-medium">{currentProject.name}</span>
          </p>
        )}
      </div>

      {/* Invitation Form */}
      <div className="bg-card border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Gửi lời mời</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Địa chỉ email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="agent@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSending}
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-2">
              Vai trò
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
              disabled={isSending}
            >
              <option value="agent">Agent (Nhân viên hỗ trợ)</option>
              <option value="manager">Manager (Quản lý)</option>
            </select>
          </div>

          <Button type="submit" disabled={isSending} className="w-full">
            <Mail className="h-4 w-4 mr-2" />
            {isSending ? "Đang gửi..." : "Gửi lời mời"}
          </Button>
        </form>
      </div>

      {/* Invitations List */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Danh sách lời mời</h2>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Đang tải...</p>
        ) : invitations && invitations.length > 0 ? (
          <div className="space-y-3">
            {invitations.map((invitation: Invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{invitation.email}</p>
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      {invitation.role === "agent" ? "Agent" : "Manager"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {getStatusIcon(invitation.status)}
                    <span>{getStatusText(invitation.status)}</span>
                    <span>•</span>
                    <span>Hết hạn: {formatDate(invitation.expiresAt)}</span>
                  </div>
                </div>

                {invitation.status === "pending" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => cancelInvite(invitation.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Chưa có lời mời nào được gửi.
          </p>
        )}
      </div>
    </div>
  );
};

export default InviteMembersPage;
