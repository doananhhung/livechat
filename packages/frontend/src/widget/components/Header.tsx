// src/widget/components/Header.tsx
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
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// This function is problematic with HSL values and will be removed.
// We will rely on CSS for gradients if possible, or simplify.

export const Header = ({ 
  onClose, 
  primaryColor,
  companyLogoUrl, 
  agentDisplayName, 
  headerText 
}: HeaderProps) => {

  return (
    <div
      className="glass-effect p-4 text-[var(--widget-text-header)] flex justify-between items-center z-10 sticky top-0"
      role="banner"
    >
      <div className="flex items-center gap-3">
        {companyLogoUrl && (
          <img src={companyLogoUrl} alt="Company Logo" className="h-10 w-10 rounded-full object-cover shadow-sm" />
        )}
        <div>
          <h3 className="font-bold text-lg leading-tight">{headerText || "Chat with us"}</h3>
          {agentDisplayName && (
            <p className="text-xs font-medium opacity-70 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
              {agentDisplayName}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-2 rounded-full transition-all hover:opacity-70 active:scale-95 text-[var(--widget-text-header)]"
        aria-label="Close chat window"
        title="Close chat"
      >
        <CloseIcon />
      </button>
    </div>
  );
};
