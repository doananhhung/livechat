// src/widget/components/Launcher.tsx

interface LauncherProps {
  onClick: () => void;
  unreadCount: number;
  primaryColor: string;
}

const ChatIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

export const Launcher = ({
  onClick,
  unreadCount,
  primaryColor,
}: LauncherProps) => {
  return (
    <button
      onClick={onClick}
      style={{ backgroundColor: primaryColor }}
      className="fixed bottom-5 right-5 w-16 h-16 rounded-full text-white flex items-center justify-center shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110 z-[9999]"
      aria-label={`Open chat${
        unreadCount > 0 ? ` (${unreadCount} unread messages)` : ""
      }`}
      title="Open live chat"
    >
      <ChatIcon />
      {unreadCount > 0 && (
        <span
          className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white"
          aria-label={`${unreadCount} unread messages`}
        >
          {unreadCount}
        </span>
      )}
    </button>
  );
};
