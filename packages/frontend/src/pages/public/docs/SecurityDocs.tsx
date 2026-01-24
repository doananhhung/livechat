// src/pages/public/docs/SecurityDocs.tsx
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ShieldCheck, KeyRound, ExternalLink, ArrowRight } from "lucide-react";

const SecurityDocs = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-12 pb-10">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">
          {t("docs.security.title")}
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
          {t("docs.security.description")}
        </p>
      </div>

      {/* Two-Factor Authentication */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b pb-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">
            {t("docs.security.twoFactor.title")}
            </h2>
        </div>
        
        <p className="leading-7">
          {t("docs.security.twoFactor.desc")}
        </p>

        <div className="bg-muted/50 p-6 rounded-lg border">
            <ol className="list-decimal list-inside space-y-3 ml-4">
                <li>{t("docs.security.twoFactor.step1")}</li>
                <li>{t("docs.security.twoFactor.step2")}</li>
                <li>{t("docs.security.twoFactor.step3")}</li>
            </ol>
            <div className="mt-4 flex items-center p-4 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-md border border-yellow-500/20">
                <span className="text-sm font-medium">⚠️ {t("docs.security.twoFactor.note")}</span>
            </div>
        </div>

        <Link 
            to="/settings/security" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
            {t("docs.security.links.configure2FA")} <ExternalLink className="ml-2 h-4 w-4" />
        </Link>
      </div>

      {/* Password Management */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b pb-2">
            <KeyRound className="h-8 w-8 text-primary" />
            <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            {t("docs.security.password.title")}
            </h2>
        </div>
        
        <p className="leading-7">
          {t("docs.security.password.desc")}
        </p>

        <ul className="list-disc list-inside space-y-2 ml-4">
            <li>{t("docs.security.password.reset")}</li>
            <li>{t("docs.security.password.change")}</li>
        </ul>

         <Link 
            to="/settings/profile" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
        >
            {t("docs.security.links.manageProfile")} <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default SecurityDocs;