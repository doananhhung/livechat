import { useTranslation } from "react-i18next";
import { Button } from "../../ui/Button";
import { Play, Zap, Brain, GitFork } from "lucide-react";

type NodeType = "start" | "action" | "llm" | "condition";

interface NodeToolbarProps {
  onAddNode: (type: NodeType) => void;
}

interface NodeButtonConfig {
  type: NodeType;
  icon: React.ReactNode;
  labelKey: string;
  colorClass: string;
}

const NODE_BUTTONS: NodeButtonConfig[] = [
  {
    type: "start",
    icon: <Play size={16} />,
    labelKey: "workflow.toolbar.addStart",
    colorClass: "text-green-500 hover:bg-green-500/10",
  },
  {
    type: "action",
    icon: <Zap size={16} />,
    labelKey: "workflow.toolbar.addAction",
    colorClass: "text-blue-500 hover:bg-blue-500/10",
  },
  {
    type: "llm",
    icon: <Brain size={16} />,
    labelKey: "workflow.toolbar.addLlm",
    colorClass: "text-purple-500 hover:bg-purple-500/10",
  },
  {
    type: "condition",
    icon: <GitFork size={16} />,
    labelKey: "workflow.toolbar.addCondition",
    colorClass: "text-orange-500 hover:bg-orange-500/10",
  },
];

export const NodeToolbar = ({ onAddNode }: NodeToolbarProps) => {
  const { t } = useTranslation();

  return (
    <div className="absolute top-4 right-4 z-10 bg-card text-card-foreground p-3 rounded-lg shadow-md border border-border">
      <h3 className="font-bold text-xs mb-2 uppercase tracking-wider text-muted-foreground">
        {t("workflow.toolbar.title")}
      </h3>
      <div className="flex flex-col gap-1">
        {NODE_BUTTONS.map((config) => (
          <Button
            key={config.type}
            variant="ghost"
            size="sm"
            className={`justify-start gap-2 ${config.colorClass}`}
            onClick={() => onAddNode(config.type)}
          >
            {config.icon}
            <span className="text-xs">{t(config.labelKey)}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
