// src/components/ui/AlertDialog.tsx
import React from "react";
import { Button } from "./Button";

const AlertDialogContext = React.createContext<{
  onOpenChange: (open: boolean) => void;
}>({ onOpenChange: () => {} });

export const AlertDialog = ({
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
    <AlertDialogContext.Provider value={{ onOpenChange }}>
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
    </AlertDialogContext.Provider>
  );
};

export const AlertDialogContent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <div className="p-6">{children}</div>;
};

export const AlertDialogHeader = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <div className="mb-4">{children}</div>;
};

export const AlertDialogTitle = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <h2 className="text-lg font-semibold text-foreground">{children}</h2>;
};

export const AlertDialogDescription = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <p className="text-sm text-muted-foreground mt-2">{children}</p>;
};

export const AlertDialogFooter = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <div className="flex justify-end gap-2 mt-6">{children}</div>;
};

export const AlertDialogAction = ({
  onClick,
  children,
  variant = "default",
  disabled,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "ghost"
    | "success"
    | "warning"
    | "info";
  disabled?: boolean;
}) => {
  const context = React.useContext(AlertDialogContext);

  const handleClick = () => {
    onClick?.();
    context.onOpenChange(false);
  };

  return (
    <Button onClick={handleClick} variant={variant} disabled={disabled}>
      {children}
    </Button>
  );
};

export const AlertDialogCancel = ({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) => {
  const context = React.useContext(AlertDialogContext);

  return (
    <Button
      onClick={() => context.onOpenChange(false)}
      variant="outline"
      disabled={disabled}
    >
      {children}
    </Button>
  );
};
