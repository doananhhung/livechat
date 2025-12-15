// src/components/ui/Toaster.tsx
import { useToast } from "./use-toast";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";

export const Toaster = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 left-4 p-4 space-y-2 z-50">
      {toasts.map(({ id, title, description, variant }) => (
        <div
          key={id}
          className={cn(
            "p-4 rounded-lg shadow-lg w-full max-w-sm border",
            "bg-card text-card-foreground",
            "flex items-start gap-4"
          )}
        >
          {variant === "destructive" && (
            <AlertTriangle className="text-destructive" size={20} />
          )}
          {variant !== "destructive" && (
            <CheckCircle2 className="text-primary" size={20} />
          )}
          <div className="flex-1">
            <p className="font-semibold text-foreground">{title}</p>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
