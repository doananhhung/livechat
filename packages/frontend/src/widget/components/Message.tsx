// src/widget/components/Message.tsx
import { type Message as MessageType } from "../types";

interface MessageProps {
  message: MessageType;
}

const SpinnerIcon = () => (
  <svg
    className="animate-spin h-4 w-4 text-gray-400"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const ErrorIcon = () => (
  <svg
    className="h-4 w-4 text-red-500"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fill-rule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 13a1 1 0 112 0v-5a1 1 0 11-2 0v5zm2-8a1 1 0 10-2 0 1 1 0 002 0z"
      clip-rule="evenodd"
    />
  </svg>
);

export const Message = ({ message }: MessageProps) => {
  const isVisitor = message.sender.type === "visitor";

  return (
    <div
      className={`flex items-end my-1 gap-2 ${
        isVisitor ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`py-2 px-3 max-w-xs shadow-sm ${
          isVisitor
            ? "bg-blue-600 text-white rounded-l-xl rounded-t-xl"
            : "bg-gray-200 text-gray-800 rounded-r-xl rounded-t-xl"
        }`}
      >
        <p className="break-words">{message.content}</p>
      </div>
      <div className="flex-shrink-0">
        {message.status === "sending" && <SpinnerIcon />}
        {message.status === "failed" && <ErrorIcon />}
      </div>
    </div>
  );
};
