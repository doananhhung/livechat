import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Send } from "lucide-react";
import { Button } from "../../ui/Button";
import { type ActionTemplate } from "@live-chat/shared-types";
import { actionsApi } from "../../../services/actionApi";
import { ActionForm } from "./ActionForm";
import { ActionHistory } from "./ActionHistory";
import { SendFormModal } from "./SendFormModal";
import { Spinner } from "../../ui/Spinner";

interface ActionPanelProps {
  conversationId: string;
  projectId: number;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({ conversationId, projectId }) => {
  const { t } = useTranslation();
  const [view, setView] = useState<"list" | "form" | "history">("list");
  const [templates, setTemplates] = useState<ActionTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ActionTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendFormModalOpen, setIsSendFormModalOpen] = useState(false);

  useEffect(() => {
    if (view === "list") {
      loadTemplates();
    }
  }, [projectId, view]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await actionsApi.getTemplates(projectId);
      setTemplates(data);
    } catch (error) {
      console.error("Failed to load templates", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = (template: ActionTemplate) => {
    setSelectedTemplate(template);
    setView("form");
  };

  const handleSuccess = () => {
    setView("history");
    setSelectedTemplate(null);
  };

  const handleFormSent = () => {
    // Optionally refresh or navigate after form sent
    setIsSendFormModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header / Tabs */}
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex gap-2">
            <Button 
                variant={view === "list" || view === "form" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setView("list")}
            >
                {t("actions.newAction")}
            </Button>
            <Button 
                variant={view === "history" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setView("history")}
            >
                {t("actions.history")}
            </Button>
        </div>
        {/* Send Form to Visitor Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSendFormModalOpen(true)}
          className="flex items-center gap-1"
        >
          <Send className="h-4 w-4" />
          {t("actions.sendFormToVisitor", "Send Form")}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {view === "list" && (
            <>
                {isLoading ? (
                    <Spinner />
                ) : (
                    <div className="space-y-2">
                        {templates.length === 0 ? (
                            <div className="text-center text-muted-foreground text-sm">{t("actions.noTemplates")}</div>
                        ) : (
                            templates.map((tmpl) => (
                                <button
                                    key={tmpl.id}
                                    onClick={() => handleSelectTemplate(tmpl)}
                                    className="w-full text-left p-3 border rounded-md hover:bg-muted transition-colors flex items-center justify-between group"
                                >
                                    <div>
                                        <div className="font-medium text-sm">{tmpl.name}</div>
                                        {tmpl.description && (
                                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">{tmpl.description}</div>
                                        )}
                                    </div>
                                    <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                </button>
                            ))
                        )}
                    </div>
                )}
            </>
        )}

        {view === "form" && selectedTemplate && (
            <ActionForm 
                template={selectedTemplate} 
                conversationId={conversationId} 
                onSuccess={handleSuccess} 
                onCancel={() => setView("list")} 
            />
        )}

        {view === "history" && (
            <ActionHistory conversationId={conversationId} />
        )}
      </div>

      {/* Send Form Modal */}
      <SendFormModal
        isOpen={isSendFormModalOpen}
        onClose={() => setIsSendFormModalOpen(false)}
        projectId={projectId}
        conversationId={conversationId}
        onFormSent={handleFormSent}
      />
    </div>
  );
};

