import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Conversation, User } from "@live-chat/shared-types";
import { useAuthStore } from "../../../stores/authStore";
import { useProjectStore } from "../../../stores/projectStore";
import {
  useAssignConversation,
  useUnassignConversation,
} from "../../../services/inboxApi";
import { UserPlus, UserCheck } from "lucide-react";

// Simplified Dropdown for V1 (standard select or custom div)
// In a real app we'd use Radix UI Popover

interface AssignmentControlsProps {
  conversation: Conversation;
}

export const AssignmentControls: React.FC<AssignmentControlsProps> = ({
  conversation,
}) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { currentProjectId } = useProjectStore();
  const assignMutation = useAssignConversation();
  const unassignMutation = useUnassignConversation();

  // Fallback if stores not ready
  if (!user || !currentProjectId) return null;

  const handleAssignToMe = () => {
    assignMutation.mutate({
      projectId: currentProjectId,
      conversationId: conversation.id,
      assigneeId: user.id,
    });
  };

  const handleUnassign = () => {
    unassignMutation.mutate({
      projectId: currentProjectId,
      conversationId: conversation.id,
    });
  };

  const isAssignedToMe = conversation.assigneeId === user.id;
  const isUnassigned = !conversation.assigneeId;

  if (isUnassigned) {
    return (
      <button
        onClick={handleAssignToMe}
        disabled={assignMutation.isPending}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
      >
        <UserPlus size={16} />
        {t("inbox.assignToMe")}
      </button>
    );
  }

  if (isAssignedToMe) {
    return (
      <button
        onClick={handleUnassign}
        disabled={unassignMutation.isPending}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition-colors border border-green-200"
        title={t("inbox.clickToUnassign")}
      >
        <UserCheck size={16} />
        {t("inbox.assignedToMe")}
        <span
          className="ml-1 text-xs text-green-500 hover:text-red-500"
          onClick={(e) => {
            e.stopPropagation();
            handleUnassign();
          }}
        >
          ({t("inbox.unassign")})
        </span>
      </button>
    );
  }

  // Assigned to someone else
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-md border border-gray-200">
      <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-xs text-white">
        {conversation.assignee?.fullName?.charAt(0) || "A"}
      </div>
      <span>{conversation.assignee?.fullName || t("inbox.agent")}</span>
      {/* Future: Allow reassigning from peer */}
    </div>
  );
};
