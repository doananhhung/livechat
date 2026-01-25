import { useChatStore } from "../store/useChatStore";

interface HeaderProps {
  onClose: () => void;
  primaryColor?: string;
  companyLogoUrl?: string;
  agentDisplayName?: string;
  headerText?: string;
}

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const BotIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"></path>
    <path d="M19 11v2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-2"></path>
    <rect x="2" y="8" width="20" height="8" rx="2"></rect>
    <path d="M12 16v3"></path>
    <path d="M8 22h8"></path>
  </svg>
);

export const Header = ({
  onClose,
  primaryColor: _primaryColor,
  companyLogoUrl,
  agentDisplayName,
  headerText,
}: HeaderProps) => {
  const { isAiEnabled, toggleAiEnabled } = useChatStore();

  return (
    <div
      className="glass-effect p-4 text-[var(--widget-foreground)] flex justify-between items-center z-10 sticky top-0"
      role="banner"
    >
      <div className="flex items-center gap-3">
        {companyLogoUrl && (
          <img
            src={companyLogoUrl}
            alt="Company Logo"
            className="h-10 w-10 rounded-full object-cover shadow-sm"
          />
        )}
        <div>
          <h3 className="font-bold text-lg leading-tight">
            {headerText || "Chat with us"}
          </h3>
          {agentDisplayName && (
            <p className="text-xs font-medium opacity-70 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
              {agentDisplayName}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleAiEnabled}
          className={`p-1.5 rounded-full transition-all border border-transparent hover:opacity-80 ${isAiEnabled ? "bg-[var(--widget-foreground)]/20" : "opacity-50"}`}
          title={isAiEnabled ? "Turn off AI Assistant" : "Turn on AI Assistant"}
          aria-label={isAiEnabled ? "Disable AI" : "Enable AI"}
          aria-pressed={isAiEnabled}
        >
          <BotIcon />
        </button>

        <button
          onClick={onClose}
          className="p-2 rounded-full transition-all hover:opacity-70 active:scale-95 text-[var(--widget-foreground)]"
          aria-label="Close chat window"
          title="Close chat"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
};
