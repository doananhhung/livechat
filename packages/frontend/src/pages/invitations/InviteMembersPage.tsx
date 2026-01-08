import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  Loader2,
} from "lucide-react";
import type {
  CreateInvitationDto,
} from "@live-chat/shared-dtos";
import type {
  Invitation,
  ProjectRole,
} from "@live-chat/shared-types";
import { useIsProjectManager } from "../../hooks/useProjectRole";
import { Spinner } from "../../components/ui/Spinner";
import { useAuthStore } from "../../stores/authStore";

const InviteMembersPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

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

  // Fetch invitations for this project
  const { data: invitations, isLoading } = useQuery({
    queryKey: ["invitations", projectId],
    queryFn: () => getProjectInvitations(Number(projectId)),
    enabled: !!projectId && !!currentProject,
  });

  // Mutation to send invitation
  const { mutate: sendInvitation, isPending: isSending } = useMutation({
    mutationFn: (data: CreateInvitationDto) => inviteUserToProject(data),
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("members.invite.sendSuccess"),
      });
      setEmail("");
      setRole("agent");
      queryClient.invalidateQueries({ queryKey: ["invitations", projectId] });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description:
          error.response?.data?.message || t("members.invite.sendError"),
        variant: "destructive",
      });
    },
  });

  // Mutation to cancel invitation
  const { mutate: cancelInvite } = useMutation({
    mutationFn: (invitationId: number) =>
      cancelInvitation(Number(projectId), invitationId),
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("members.invite.cancelSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["invitations", projectId] });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.response?.data?.message || t("members.invite.cancelError"),
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
        return t("members.invite.status.pending");
      case "accepted":
        return t("members.invite.status.accepted");
      case "expired":
        return t("members.invite.status.expired");
      default:
        return status;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString(i18n.language, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!projectId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {t("settings.projectNotFound")}
      </div>
    );
  }

  if (isLoadingProjects) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">{t("common.loading")}</span>
      </div>
    );
  }

  if (currentProject && currentUser && !isManager && currentUser.id !== (currentProject as any).ownerId) {
    return (
         <div className="p-8 text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2">{t("members.invite.accessDenied")}</h1>
            <p className="text-muted-foreground">{t("members.invite.accessDeniedDesc")}</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate(`/settings/projects/${projectId}`)}>
                {t("members.invite.back")}
            </Button>
         </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("common.back")}
        </Button>
        <h1 className="text-3xl font-bold">{t("members.invite.title")}</h1>
        {currentProject && (
          <p className="text-muted-foreground mt-2">
            {t("common.project")}: <span className="font-medium">{currentProject.name}</span>
          </p>
        )}
      </div>

      {/* Invitation Form */}
      <div className="bg-card border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{t("members.invite.sendInvitation")}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              {t("common.emailAddress")}
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
              {t("common.role")}
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
              disabled={isSending}
            >
              <option value="agent">{t("common.agent")}</option>
              <option value="manager">{t("common.manager")}</option>
            </select>
          </div>

          <Button type="submit" disabled={isSending} className="w-full">
            <Mail className="h-4 w-4 mr-2" />
            {isSending ? t("members.invite.sending") : t("members.invite.sendInvitation")}
          </Button>
        </form>
      </div>

      {/* Invitations List */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">{t("members.invite.invitationsList")}</h2>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">{t("common.loading")}</p>
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
                      {invitation.role === "agent" ? t("common.agent") : t("common.manager")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {getStatusIcon(invitation.status)}
                    <span>{getStatusText(invitation.status)}</span>
                    <span>•</span>
                    <span>{t("members.invite.expires")}: {formatDate(invitation.expiresAt)}</span>
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
            {t("members.invite.noInvitations")}
          </p>
        )}
      </div>
    </div>
  );
};

export default InviteMembersPage;
