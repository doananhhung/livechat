// src/pages/public/docs/ManagementDocs.tsx
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { FolderGit2, Users, FileText, ArrowRight } from "lucide-react";

const ManagementDocs = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-12 pb-10">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">
          {t("docs.management.title")}
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
          {t("docs.management.description")}
        </p>
      </div>

      {/* Projects */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b pb-2">
            <FolderGit2 className="h-8 w-8 text-primary" />
            <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">
            {t("docs.management.projects.title")}
            </h2>
        </div>
        
        <p className="leading-7">
          {t("docs.management.projects.desc")}
        </p>

        <ul className="list-disc list-inside space-y-2 ml-4 bg-muted/30 p-4 rounded-md">
            <li>{t("docs.management.projects.create")}</li>
            <li>{t("docs.management.projects.switch")}</li>
        </ul>

         <Link 
            to="/settings/projects" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
            {t("docs.management.links.manageProjects")} <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>

      {/* Members */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b pb-2">
            <Users className="h-8 w-8 text-primary" />
            <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            {t("docs.management.members.title")}
            </h2>
        </div>
        
        <p className="leading-7">
          {t("docs.management.members.desc")}
        </p>

        <div className="bg-muted/50 p-6 rounded-lg border">
            <h4 className="font-semibold mb-3">{t("docs.management.members.roles.title")}</h4>
            <ul className="space-y-2">
                <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">•</span>
                    <span>{t("docs.management.members.roles.owner")}</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">•</span>
                    <span>{t("docs.management.members.roles.manager")}</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">•</span>
                    <span>{t("docs.management.members.roles.agent")}</span>
                </li>
            </ul>
        </div>
         <p className="text-sm text-muted-foreground italic">
          {t("docs.management.members.invite")}
        </p>
      </div>

      {/* Audit Logs */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b pb-2">
            <FileText className="h-8 w-8 text-primary" />
            <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            {t("docs.management.audit.title")}
            </h2>
        </div>
        
        <p className="leading-7">
          {t("docs.management.audit.desc")}
        </p>
        <p className="leading-7">
            {t("docs.management.audit.view")}
        </p>
      </div>
    </div>
  );
};

export default ManagementDocs;