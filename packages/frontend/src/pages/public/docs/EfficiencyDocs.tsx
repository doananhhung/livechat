// src/pages/public/docs/EfficiencyDocs.tsx
import { useTranslation } from "react-i18next";

const EfficiencyDocs = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">
          {t("docs.efficiency.title")}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {t("docs.efficiency.description")}
        </p>
      </div>
       <div className="border-t pt-6">
        <p className="leading-7">
            {t("docs.comingSoon")}
        </p>
      </div>
    </div>
  );
};

export default EfficiencyDocs;
