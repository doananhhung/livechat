// src/components/layout/PublicLayout.tsx
import { Outlet, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../stores/authStore";
import { LanguageSwitcher } from "../features/public/LanguageSwitcher";
import { ThemeToggleButton } from "../ui/ThemeToggleButton";
import { Button } from "../ui/Button";

export const PublicLayout = () => {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight">
                LiveChat
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link
                to="/docs"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                {t("nav.docs")}
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggleButton />
            
            {isAuthenticated ? (
              <Button asChild variant="default" size="sm" className="ml-2">
                <Link to="/inbox">{t("nav.goToInbox")}</Link>
              </Button>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">{t("nav.login")}</Link>
                </Button>
                <Button asChild variant="default" size="sm">
                  <Link to="/register">{t("nav.register")}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-6 md:py-0">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built with ❤️ by{" "}
            <a
              href="#"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              The Executor
            </a>
            .
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
             <Link to="/docs" className="underline underline-offset-4 hover:text-foreground">
              {t("nav.docs")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
