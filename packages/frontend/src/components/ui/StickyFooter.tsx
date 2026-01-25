import { cn } from "../../lib/utils";
import React from "react";
import { useInView } from "react-intersection-observer";

interface StickyFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const StickyFooter = React.forwardRef<HTMLDivElement, StickyFooterProps>(
  ({ className, children, ...props }, ref) => {
    const { ref: sentinelRef, inView } = useInView({
      threshold: 0,
    });

    const isStuck = !inView;

    return (
      <>
        <div
          ref={ref}
          className={cn(
            "sticky bottom-0 z-10 bg-card border-t p-4 mt-auto transition-all duration-200",
            isStuck &&
              "shadow-[0_-5px_10px_-2px_rgba(0,0,0,0.1)] border-t-transparent",
            !isStuck && "shadow-none",
            className,
          )}
          {...props}
        >
          {children}
        </div>
        <div
          ref={sentinelRef}
          className="h-px w-full pointer-events-none opacity-0 !mt-0"
          aria-hidden="true"
        />
      </>
    );
  },
);

StickyFooter.displayName = "StickyFooter";
