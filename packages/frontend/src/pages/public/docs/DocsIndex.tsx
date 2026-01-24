// src/pages/public/docs/DocsIndex.tsx
import { useTranslation } from "react-i18next";

const DocsIndex = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">
          {t("docs.index.title")}
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">
          {t("docs.index.description")}
        </p>
      </div>
      <div className="border-t pt-6">
        <p className="leading-7 [&:not(:first-child)]:mt-6">
            {t("docs.comingSoon")}
        </p>
      </div>
    </div>
  );
};

export default DocsIndex;
