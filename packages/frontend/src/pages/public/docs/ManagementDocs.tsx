// src/pages/public/docs/ManagementDocs.tsx
import { useTranslation } from "react-i18next";

const ManagementDocs = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">
          {t("docs.management.title")}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {t("docs.management.description")}
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

export default ManagementDocs;
