import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { useTranslation } from "react-i18next";

export const StartNode = memo(() => {
  const { t } = useTranslation();

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-card border-2 border-green-500 text-card-foreground">
      <div className="flex flex-col">
        <div className="font-bold text-sm">{t("workflow.nodes.start")}</div>
        <div className="text-xs text-muted-foreground">
          {t("workflow.nodes.startDescription")}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-green-500 border-none"
      />
    </div>
  );
});
