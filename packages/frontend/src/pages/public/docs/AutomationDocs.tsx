// src/pages/public/docs/AutomationDocs.tsx
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Bot, Palette, ArrowRight } from "lucide-react";

const AutomationDocs = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-12 pb-10">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">
          {t("docs.automation.title")}
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
          {t("docs.automation.description")}
        </p>
      </div>

      {/* AI Responder */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b pb-2">
            <Bot className="h-8 w-8 text-primary" />
            <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">
            {t("docs.automation.ai.title")}
            </h2>
        </div>
        
        <p className="leading-7">
          {t("docs.automation.ai.desc")}
        </p>

        <div className="bg-muted/50 p-6 rounded-lg border">
            <ul className="list-disc list-inside space-y-2">
                <li>{t("docs.automation.ai.setup")}</li>
                <li>{t("docs.automation.ai.persona")}</li>
                <li>{t("docs.automation.ai.enable")}</li>
            </ul>
        </div>

        <Link 
            to="/settings/projects" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
            {t("docs.automation.links.configureAI")} <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>

      {/* Widget Customization */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b pb-2">
            <Palette className="h-8 w-8 text-primary" />
            <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            {t("docs.automation.widget.title")}
            </h2>
        </div>
        
        <p className="leading-7">
          {t("docs.automation.widget.desc")}
        </p>
        
        <ul className="list-disc list-inside space-y-2 ml-4 bg-muted/30 p-4 rounded-md">
            <li>{t("docs.automation.widget.customize")}</li>
            <li>{t("docs.automation.widget.embed")}</li>
        </ul>

         <Link 
            to="/settings/projects" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
        >
            {t("docs.automation.links.customizeWidget")} <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default AutomationDocs;