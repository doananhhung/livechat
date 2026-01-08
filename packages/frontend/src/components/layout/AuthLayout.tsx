import React from "react";
import { useTranslation } from "react-i18next";

const AuthLayout = ({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-muted via-background to-muted flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Logo/Brand section (optional) */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Live Chat
          </h2>
        </div>

        <div className="bg-card text-card-foreground shadow-xl rounded-xl border border-border/50 p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground text-center">
                {subtitle}
              </p>
            )}
          </div>
          {children}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t("common.copyright", { year: 2025 })}
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;

