import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserMinus, Shield, User as UserIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/Dialog";
import { Button } from "../../ui/Button";
import { Badge } from "../../ui/Badge";
import { useToast } from "../../ui/use-toast";
import {
  getProjectMembers,
  updateMemberRole,
  removeMember,
} from "../../../services/projectApi";
import type { ProjectMemberDto, ProjectRole } from "@social-commerce/shared";
import { Spinner } from "../../ui/Spinner";
import { ProjectRole as ProjectRoleEnum } from "@social-commerce/shared";

interface ProjectMembersDialogProps {
  projectId: number;
  projectName: string;
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProjectMembersDialog = ({
  projectId,
  projectName,
  currentUserId,
  open,
  onOpenChange,
}: ProjectMembersDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: () => getProjectMembers(projectId),
    enabled: open,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: ProjectRole }) =>
      updateMemberRole(projectId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project-members", projectId],
      });
      toast({
        title: "Thành công",
        description: "Đã cập nhật vai trò thành viên",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật vai trò",
        variant: "destructive",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeMember(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project-members", projectId],
      });
      toast({
        title: "Thành công",
        description: "Đã xóa thành viên khỏi dự án",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa thành viên",
        variant: "destructive",
      });
    },
  });

  const getRoleBadge = (role: ProjectRole) => {
    if (role === ProjectRoleEnum.MANAGER) {
      return (
        <Badge variant="default">
          <Shield className="h-3 w-3 mr-1" />
          Quản lý viên
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <UserIcon className="h-3 w-3 mr-1" />
        Nhân viên
      </Badge>
    );
  };

  const toggleRole = (member: ProjectMemberDto) => {
    const newRole =
      member.role === ProjectRoleEnum.MANAGER
        ? ProjectRoleEnum.AGENT
        : ProjectRoleEnum.MANAGER;
    updateRoleMutation.mutate({ userId: member.userId, role: newRole });
  };

  const handleRemoveMember = (userId: string, userName: string) => {
    if (
      confirm(`Bạn có chắc chắn muốn xóa ${userName} khỏi dự án này không?`)
    ) {
      removeMemberMutation.mutate(userId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quản lý thành viên</DialogTitle>
          <DialogDescription>
            Danh sách thành viên của dự án {projectName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {members && members.length > 0 ? (
              members.map((member) => {
                const isCurrentUser = member.userId === currentUserId;
                return (
                  <div
                    key={member.userId}
                    className="flex flex-col gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    {/* Member Info Section */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-medium truncate">
                            {member.user.fullName}
                          </p>
                          {isCurrentUser && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              (Bạn)
                            </span>
                          )}
                          <div className="flex-shrink-0">
                            {getRoleBadge(member.role)}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {member.user.email}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Tham gia:{" "}
                          {new Date(member.joinedAt).toLocaleDateString(
                            "vi-VN"
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons Section */}
                    {!isCurrentUser && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => toggleRole(member)}
                          disabled={
                            updateRoleMutation.isPending ||
                            removeMemberMutation.isPending
                          }
                        >
                          {member.role === ProjectRoleEnum.MANAGER
                            ? "Hạ vai trò"
                            : "Thăng vai trò"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleRemoveMember(
                              member.userId,
                              member.user.fullName
                            )
                          }
                          disabled={
                            updateRoleMutation.isPending ||
                            removeMemberMutation.isPending
                          }
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Không có thành viên nào
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
