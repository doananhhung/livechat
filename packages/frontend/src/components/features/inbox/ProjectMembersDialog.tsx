import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserMinus,
  Shield,
  User as UserIcon,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/Dialog";
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
import { Button } from "../../ui/Button";
import { Badge } from "../../ui/Badge";
import { useToast } from "../../ui/use-toast";
import {
  getProjectMembers,
  updateMemberRole,
  removeMember,
} from "../../../services/projectApi";
import type { ProjectMemberDto, ProjectRole } from "@live-chat/shared-types";
import { Spinner } from "../../ui/Spinner";
import { ProjectRole as ProjectRoleEnum } from "@live-chat/shared-types";

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
  const [memberToRemove, setMemberToRemove] = useState<{
    userId: string;
    userName: string;
  } | null>(null);

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
    setMemberToRemove({ userId, userName });
  };

  const confirmRemoveMember = () => {
    if (memberToRemove) {
      removeMemberMutation.mutate(memberToRemove.userId);
      setMemberToRemove(null);
    }
  };

  return (
    <>
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
                            {new Date(member.createdAt).toLocaleDateString(
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

      {/* Confirmation Alert Dialog */}
      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>Xác nhận xóa thành viên</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa{" "}
              <span className="font-semibold text-foreground">
                {memberToRemove?.userName}
              </span>{" "}
              khỏi dự án này không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMemberMutation.isPending}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMember}
              variant="destructive"
              disabled={removeMemberMutation.isPending}
            >
              {removeMemberMutation.isPending
                ? "Đang xóa..."
                : "Xóa thành viên"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
