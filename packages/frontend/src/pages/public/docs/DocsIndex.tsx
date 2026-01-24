// src/pages/public/docs/DocsIndex.tsx
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const DocsIndex = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-12 pb-10">
      {/* Hero Section */}
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">
          {t("docs.index.title")}
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
          {t("docs.index.description")}
        </p>
      </div>

      {/* Intro Section */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          {t("docs.index.intro.title")}
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          {t("docs.index.intro.desc")}
        </p>
      </div>

      {/* Quick Start Guide */}
      <div className="space-y-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
          {t("docs.index.quickStart.title")}
        </h2>
        
        <div className="grid gap-6 md:grid-cols-3">
            {/* Step 1 */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">1</div>
                    <h3 className="font-semibold text-lg">{t("docs.index.quickStart.step1.title")}</h3>
                </div>
                <p className="text-sm text-muted-foreground flex-grow">{t("docs.index.quickStart.step1.desc")}</p>
                <Link to="/register" className="inline-flex items-center text-sm font-medium text-primary hover:underline mt-4">
                    {t("auth.register")} <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
            </div>

            {/* Step 2 */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">2</div>
                    <h3 className="font-semibold text-lg">{t("docs.index.quickStart.step2.title")}</h3>
                </div>
                <p className="text-sm text-muted-foreground flex-grow">{t("docs.index.quickStart.step2.desc")}</p>
            </div>

            {/* Step 3 */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col">
                 <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">3</div>
                    <h3 className="font-semibold text-lg">{t("docs.index.quickStart.step3.title")}</h3>
                </div>
                <p className="text-sm text-muted-foreground flex-grow">{t("docs.index.quickStart.step3.desc")}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DocsIndex;