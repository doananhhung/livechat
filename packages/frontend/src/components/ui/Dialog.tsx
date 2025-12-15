// src/components/ui/Dialog.tsx
import React from "react";

const DialogContext = React.createContext<{
  onOpenChange: (open: boolean) => void;
}>({ onOpenChange: () => {} });

export const Dialog = ({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) => {
  if (!open) return null;

  return (
    <DialogContext.Provider value={{ onOpenChange }}>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
        onClick={() => onOpenChange(false)}
      >
        <div
          className="bg-background rounded-lg border shadow-xl w-full max-w-md m-4"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </DialogContext.Provider>
  );
};

export const DialogContent = ({ children }: { children: React.ReactNode }) => {
  return <div className="p-6">{children}</div>;
};

export const DialogHeader = ({ children }: { children: React.ReactNode }) => {
  return <div className="mb-4">{children}</div>;
};

export const DialogTitle = ({ children }: { children: React.ReactNode }) => {
  return <h2 className="text-lg font-semibold text-foreground">{children}</h2>;
};

export const DialogDescription = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <p className="text-sm text-muted-foreground mt-1">{children}</p>;
};

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
