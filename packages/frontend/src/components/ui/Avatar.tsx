import React from "react";
import { cn } from "../../lib/utils";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
type StatusType = "online" | "away" | "offline" | null;

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  size?: AvatarSize;
  status?: StatusType;
  showRing?: boolean;
}

const getInitials = (name: string): string => {
  if (!name) return "?";
  const nameParts = name.trim().split(" ");
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }
  const firstInitial = nameParts[0].charAt(0);
  const lastInitial = nameParts[nameParts.length - 1].charAt(0);
  return `${firstInitial}${lastInitial}`.toUpperCase();
};

const getColorFromName = (name: string): string => {
  if (!name) return "bg-muted";

  // Simple hash function to get consistent color
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
  ];

  return colors[Math.abs(hash) % colors.length];
};

const sizeClasses: Record<AvatarSize, string> = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-12 h-12 text-lg",
  xl: "w-16 h-16 text-xl",
};

const statusSizeClasses: Record<AvatarSize, string> = {
  xs: "w-1.5 h-1.5",
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
  xl: "w-4 h-4",
};

const statusColorClasses: Record<Exclude<StatusType, null>, string> = {
  online: "bg-online",
  away: "bg-away",
  offline: "bg-offline",
};

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    { src, name, className = "", size = "md", status = null, showRing = false },
    ref
  ) => {
    const sizeClass = sizeClasses[size];
    const baseClasses =
      "rounded-full object-cover flex items-center justify-center relative";
    const ringClasses = showRing ? "ring-2 ring-primary ring-offset-2" : "";
    const combinedClasses = cn(baseClasses, sizeClass, ringClasses, className);

    if (src) {
      return (
        <div ref={ref} className={cn("relative inline-block", sizeClass)}>
          <img
            src={src}
            alt={name || "User Avatar"}
            className={combinedClasses}
          />
          {status && (
            <span
              className={cn(
                "absolute bottom-0 right-0 block rounded-full border-2 border-background",
                statusSizeClasses[size],
                statusColorClasses[status]
              )}
            />
          )}
        </div>
      );
    }

    const initials = name ? getInitials(name) : "?";
    const colorClass = name ? getColorFromName(name) : "bg-muted";

    return (
      <div ref={ref} className={cn("relative inline-block", sizeClass)}>
        <div className={cn(combinedClasses, colorClass)}>
          <span className="font-semibold text-white">{initials}</span>
        </div>
        {status && (
          <span
            className={cn(
              "absolute bottom-0 right-0 block rounded-full border-2 border-background",
              statusSizeClasses[size],
              statusColorClasses[status]
            )}
          />
        )}
      </div>
    );
  }
);
