// src/components/features/inbox/MessageComposer.tsx

import React, { useState, useEffect, useRef } from "react";
import {
  useSendAgentReply,
  useNotifyAgentTyping,
} from "../../../services/inboxApi";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { Send } from "lucide-react";

interface MessageComposerProps {
  conversationId: number;
}

const MessageComposer = ({ conversationId }: MessageComposerProps) => {
  const [content, setContent] = useState("");
  const { mutate: sendMessage, isPending } = useSendAgentReply();
  const { mutate: notifyTyping } = useNotifyAgentTyping();
  const typingTimeoutRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Function to emit typing status
  const handleTyping = (isTyping: boolean) => {
    notifyTyping({ conversationId, isTyping });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);

    // If a timeout is already set, clear it
    if (typingTimeoutRef.current) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      const messageToSend = content.trim();
      sendMessage({ conversationId, text: messageToSend });
      setContent("");
      inputRef.current?.focus();
      // Stop typing immediately on send
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      handleTyping(false);
    }
  };

  // Cleanup effect for when the component unmounts or conversation changes
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        // Optionally emit false if component unmounts while typing
        handleTyping(false);
      }
    };
  }, [conversationId]);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 p-4 border-t bg-card"
    >
      <Input
        ref={inputRef}
        type="text"
        placeholder="Nhập tin nhắn..."
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
