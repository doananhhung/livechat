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

  const headerStyle = {
    background: primaryColor || 'hsl(262 83% 58%)',
  };

  return (
    <div
      style={headerStyle}
      className="p-4 text-[var(--widget-text-header)] flex justify-between items-center rounded-t-xl shadow-sm bg-[var(--widget-header-background)]"
      role="banner"
    >
      <div className="flex items-center gap-3">
        {companyLogoUrl && (
          <img src={companyLogoUrl} alt="Company Logo" className="h-10 w-10 rounded-full object-cover" />
        )}
        <div>
          <h3 className="font-semibold text-lg">{headerText || "Chat with us"}</h3>
          {agentDisplayName && (
            <p className="text-xs opacity-80">{agentDisplayName}</p>
          )}
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-full transition-colors hover:bg-white/20"
        aria-label="Close chat window"
        title="Close chat"
      >
        <CloseIcon />
      </button>
    </div>
  );
};
