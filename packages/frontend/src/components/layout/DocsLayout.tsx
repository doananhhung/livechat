// src/components/layout/DocsLayout.tsx
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu } from "lucide-react";
import { DocsSidebar } from "../features/docs/DocsSidebar";
import { Button } from "../ui/Button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";

export const DocsLayout = () => {
  const { t } = useTranslation();

  return (
    <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
      <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
        <div className="py-6 pr-6 lg:py-8">
          <DocsSidebar className="w-full" />
        </div>
      </aside>
      <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_300px]">
        <div className="mx-auto w-full min-w-0">
          <div className="mb-4 md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="mr-2">
                  <Menu className="h-4 w-4 mr-2" />
                  {t("docs.nav.menu")}
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                   <SheetTitle className="text-left px-2">{t("docs.nav.title")}</SheetTitle>
                </SheetHeader>
                <div className="mt-4 px-2">
                  <DocsSidebar />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
