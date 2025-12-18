// src/widget/components/Header.tsx
interface HeaderProps {
  onClose: () => void;
  primaryColor: string;
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

// Helper function to calculate a darker shade of a hex color
function shadeColor(color: string, percent: number): string {
  // Ensure color is a valid hex
  if (!color.startsWith("#") || (color.length !== 4 && color.length !== 7)) {
    return color; // Return original color if not a valid hex
  }

  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.round((R * (100 + percent)) / 100);
  G = Math.round((G * (100 + percent)) / 100);
  B = Math.round((B * (100 + percent)) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  const RR = R.toString(16).padStart(2, "0");
  const GG = G.toString(16).padStart(2, "0");
  const BB = B.toString(16).padStart(2, "0");

  return `#${RR}${GG}${BB}`;
}

export const Header = ({ onClose, primaryColor }: HeaderProps) => {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${shadeColor(
          primaryColor,
          -20
        )} 100%)`,
      }}
      className="p-4 text-white flex justify-between items-center rounded-t-xl shadow-sm"
      role="banner"
    >
      <h3 className="font-semibold text-lg">Chat with us</h3>
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
