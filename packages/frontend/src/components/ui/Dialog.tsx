// src/components/ui/Dialog.tsx
import React from "react";
import { cn } from "../../lib/utils"; // 1. Make sure cn is imported

const DialogContext = React.createContext<{
  onOpenChange: (open: boolean) => void;
}>({ onOpenChange: () => {} });

// 2. Add className to the component's props
export const Dialog = ({
  open,
  onOpenChange,
  children,
  className, // <-- ADD THIS
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string; // <-- ADD THIS
}) => {
  if (!open) return null;

  return (
    <DialogContext.Provider value={{ onOpenChange }}>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
        onClick={() => onOpenChange(false)}
      >
        {/*
          3. Use cn() to merge classes.
          We keep 'max-w-md' as the default, but the 'className' prop
          will now correctly override it.
        */}
        <div
          className={cn(
            "bg-background rounded-lg border shadow-xl w-full m-4 max-w-md",
            className // <-- ADD THIS
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </DialogContext.Provider>
  );
};

// 2. Add className to props
export const DialogContent = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  // 3. Use cn() to merge classes
  return <div className={cn("p-6", className)}>{children}</div>;
};

// 4. (Recommended) Update other sub-components
export const DialogHeader = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={cn("mb-4", className)}>{children}</div>;
};

export const DialogTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h2 className={cn("text-lg font-semibold text-foreground", className)}>
      {children}
    </h2>
  );
};

export const DialogDescription = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <p className={cn("text-sm text-muted-foreground mt-1", className)}>
      {children}
    </p>
  );
};

// This component already accepts className, so it is correct as-is
export const DialogFooter = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`flex justify-end space-x-2 mt-6 ${className || ""}`}>
      {children}
    </div>
  );
};
