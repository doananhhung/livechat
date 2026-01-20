// src/components/features/inbox/MessageComposer.tsx

import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  useSendAgentReply,
  useNotifyAgentTyping,
} from "../../../services/inboxApi";
import { Button } from "../../ui/Button";
import { Send } from "lucide-react";
import { SlashCommandPopover } from "../canned-responses/SlashCommandPopover";

interface MessageComposerProps {
  projectId: number;
  conversationId: number;
}

const MessageComposer = ({
  projectId,
  conversationId,
}: MessageComposerProps) => {
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const { mutate: sendMessage, isPending } = useSendAgentReply();
  const { mutate: notifyTyping } = useNotifyAgentTyping();
  const typingTimeoutRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isMountedRef = useRef(true);

  // Slash Command State
  const [slashState, setSlashState] = useState<{
    isOpen: boolean;
    filter: string;
    triggerIndex: number;
  }>({ isOpen: false, filter: "", triggerIndex: -1 });

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height =
        Math.min(inputRef.current.scrollHeight, 200) + "px"; // Cap at 200px
    }
  }, [content]);

  // Function to emit typing status - use useRef to avoid stale closures
  const handleTyping = (isTyping: boolean) => {
    if (isMountedRef.current) {
      notifyTyping({ projectId, conversationId, payload: { isTyping } });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    // Detect Slash Command
    const cursor = e.target.selectionStart || val.length;
    // Find last / before cursor
    const lastSlash = val.lastIndexOf("/", cursor - 1);

    if (lastSlash !== -1) {
      // Check if start of line or preceded by space
      const isStart = lastSlash === 0;
      const isPrecededBySpace =
        val[lastSlash - 1] === " " || val[lastSlash - 1] === "\n";

      // Check if text between slash and cursor contains space (end of command)
      const textAfterSlash = val.substring(lastSlash + 1, cursor);
      const hasSpace =
        textAfterSlash.includes(" ") || textAfterSlash.includes("\n");

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

    const prefix = content.substring(0, slashState.triggerIndex);
    const suffix = content.substring(
      slashState.triggerIndex + 1 + slashState.filter.length,
    );

    const newContent = prefix + responseContent + suffix;
    setContent(newContent);
    setSlashState({ isOpen: false, filter: "", triggerIndex: -1 });
    inputRef.current?.focus();
  };

  const submitMessage = () => {
    if (content.trim()) {
      const messageToSend = content.trim();
      sendMessage({
        projectId,
        conversationId,
        payload: { text: messageToSend },
      });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // Prevent default to avoid new line
      e.preventDefault();
      // Don't submit if slash command menu is open (let the menu handle enter? No, menu handles keydown via window listener in Popover component?
      // SlashCommandPopover uses window listener.
      // But if we preventDefault here, window listener might not see it or it bubbles up?
      // Actually SlashCommandPopover uses window listener, so it captures it.
      // But we should check if slashState.isOpen to avoid submitting while selecting.
      if (!slashState.isOpen) {
        submitMessage();
      }
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
      notifyTyping({ projectId, conversationId, payload: { isTyping: false } });
    };
  }, [projectId, conversationId, notifyTyping]);

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-end gap-2 p-4 border-t bg-card"
    >
      {slashState.isOpen && (
        <SlashCommandPopover
          projectId={projectId}
          filter={slashState.filter}
          onSelect={handleSelectResponse}
          onClose={() =>
            setSlashState({ isOpen: false, filter: "", triggerIndex: -1 })
          }
        />
      )}
      <textarea
        ref={inputRef}
        placeholder={t("inbox.typeMessage")}
        className="flex-1 text-sm border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none overflow-hidden min-h-[40px] max-h-[200px]"
        value={content}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        rows={1}
      />
      <Button
        type="submit"
        disabled={isPending || !content.trim()}
        size="icon"
        className="mb-0.5"
      >
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
};

export default MessageComposer;
