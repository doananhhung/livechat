import React, { useState } from 'react';
import type { Conversation, User } from '@live-chat/shared-types';
import { useAuthStore } from '../../../stores/authStore';
import { useProjectStore } from '../../../stores/projectStore';
import { useAssignConversation, useUnassignConversation } from '../../../services/inboxApi';
import { UserPlus, UserMinus, UserCheck, ChevronDown } from 'lucide-react';

// Simplified Dropdown for V1 (standard select or custom div)
// In a real app we'd use Radix UI Popover

interface AssignmentControlsProps {
  conversation: Conversation;
}

export const AssignmentControls: React.FC<AssignmentControlsProps> = ({ conversation }) => {
  const { user } = useAuthStore();
  const { currentProject } = useProjectStore();
  const assignMutation = useAssignConversation();
  const unassignMutation = useUnassignConversation();
  const [isOpen, setIsOpen] = useState(false);

  // Fallback if stores not ready
  if (!user || !currentProject) return null;

  const handleAssignToMe = () => {
    assignMutation.mutate({
      projectId: currentProject.id,
      conversationId: conversation.id,
      assigneeId: user.id,
    });
  };

  const handleUnassign = () => {
    unassignMutation.mutate({
      projectId: currentProject.id,
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
        Assign to Me
      </button>
    );
  }

  if (isAssignedToMe) {
    return (
      <button
        onClick={handleUnassign}
        disabled={unassignMutation.isPending}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition-colors border border-green-200"
        title="Click to unassign"
      >
        <UserCheck size={16} />
        Assigned to Me
        <span className="ml-1 text-xs text-green-500 hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleUnassign(); }}>
             (Unassign)
        </span>
      </button>
    );
  }

  // Assigned to someone else
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-md border border-gray-200">
      <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-xs text-white">
        {conversation.assignee?.fullName?.charAt(0) || 'A'}
      </div>
      <span>{conversation.assignee?.fullName || 'Agent'}</span>
       {/* Future: Allow reassigning from peer */}
    </div>
  );
};
