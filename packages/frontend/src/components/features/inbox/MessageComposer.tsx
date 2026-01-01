// src/components/features/inbox/MessageComposer.tsx

import React, { useState, useEffect, useRef } from "react";
import {
  useSendAgentReply,
  useNotifyAgentTyping,
} from "../../../services/inboxApi";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { Send } from "lucide-react";
import { SlashCommandPopover } from "../canned-responses/SlashCommandPopover";

interface MessageComposerProps {
  projectId: number;
  conversationId: number;
}

const MessageComposer = ({ projectId, conversationId }: MessageComposerProps) => {
  const [content, setContent] = useState("");
  const { mutate: sendMessage, isPending } = useSendAgentReply();
  const { mutate: notifyTyping } = useNotifyAgentTyping();
  const typingTimeoutRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);

  // Slash Command State
  const [slashState, setSlashState] = useState<{
    isOpen: boolean;
    filter: string;
    triggerIndex: number;
  }>({ isOpen: false, filter: "", triggerIndex: -1 });

  // Function to emit typing status - use useRef to avoid stale closures
  const handleTyping = (isTyping: boolean) => {
    if (isMountedRef.current) {
      notifyTyping({ projectId, conversationId, isTyping });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setContent(val);

    // Detect Slash Command
    const cursor = e.target.selectionStart || val.length;
    // Find last / before cursor
    const lastSlash = val.lastIndexOf("/", cursor - 1);
    
    if (lastSlash !== -1) {
      // Check if start of line or preceded by space
      const isStart = lastSlash === 0;
      const isPrecededBySpace = val[lastSlash - 1] === " ";
      
      // Check if text between slash and cursor contains space (end of command)
      const textAfterSlash = val.substring(lastSlash + 1, cursor);
      const hasSpace = textAfterSlash.includes(" ");

      if ((isStart || isPrecededBySpace) && !hasSpace) {
        setSlashState({
          isOpen: true,
          filter: textAfterSlash,
          triggerIndex: lastSlash,
        });
      } else {
        setSlashState({ isOpen: false, filter: "", triggerIndex: -1 });
      }
    } else {
      setSlashState({ isOpen: false, filter: "", triggerIndex: -1 });
    }

    // If a timeout is already set, clear it
    if (typingTimeoutRef.current !== null) {
      clearTimeout(typingTimeoutRef.current);
    } else {
      // If no timeout, it means typing just started
      handleTyping(true);
    }

    // Set a new timeout to mark typing as stopped
    typingTimeoutRef.current = window.setTimeout(() => {
      handleTyping(false);
      typingTimeoutRef.current = null; // Reset the ref
    }, 2000); // 2-second threshold
  };

  const handleSelectResponse = (responseContent: string) => {
    if (slashState.triggerIndex === -1) return;
    
    // Replace the shortcut with content
    const prefix = content.substring(0, slashState.triggerIndex);
    // Determine suffix (if any, though usually cursor is at end of filter)
    // We replace from triggerIndex to current cursor? Or just triggerIndex + filter.length?
    // Let's assume we replace the filter text we detected.
    const suffix = content.substring(slashState.triggerIndex + 1 + slashState.filter.length);
    
    const newContent = prefix + responseContent + suffix;
    setContent(newContent);
    setSlashState({ isOpen: false, filter: "", triggerIndex: -1 });
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      const messageToSend = content.trim();
      sendMessage({ projectId, conversationId, text: messageToSend });
      setContent("");
      setSlashState({ isOpen: false, filter: "", triggerIndex: -1 });
      inputRef.current?.focus();
      // Stop typing immediately on send
      if (typingTimeoutRef.current !== null) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      handleTyping(false);
    }
  };

  // Cleanup effect for when the component unmounts or conversation changes
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (typingTimeoutRef.current !== null) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      // Send typing=false on unmount if needed
      notifyTyping({ projectId, conversationId, isTyping: false });
    };
  }, [projectId, conversationId, notifyTyping]);

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-center gap-2 p-4 border-t bg-card"
    >
      {slashState.isOpen && (
        <SlashCommandPopover 
          projectId={projectId} 
          filter={slashState.filter} 
          onSelect={handleSelectResponse}
          onClose={() => setSlashState({ isOpen: false, filter: "", triggerIndex: -1 })}
        />
      )}
      <Input
        ref={inputRef}
        type="text"
        placeholder="Nhập tin nhắn... (Gõ / để dùng mẫu câu)"
        className="flex-1"
        value={content}
        onChange={handleInputChange}
        autoComplete="off"
      />
      <Button type="submit" disabled={isPending || !content.trim()} size="icon">
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
};

export default MessageComposer;
