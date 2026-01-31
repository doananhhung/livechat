import { NavLink, Outlet, Link, useParams } from "react-router-dom";
import { 
  Info, 
  Palette, 
  MessageSquarePlus, 
  Workflow, 
  ShieldAlert, 
  Menu, 
  ArrowLeft,
  Bot
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import * as projectApi from "../../services/projectApi";

export function ProjectSettingsLayout() {
  const { t } = useTranslation();
  const { projectId } = useParams<{ projectId: string }>();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: projectApi.getProjects,
  });

  const project = projects?.find((p) => p.id === Number(projectId));

  const navItems = [
    { name: t("settings.basicInfo"), href: `/projects/${projectId}/settings/general`, icon: Info },
    { name: t("settings.widgetSettings"), href: `/projects/${projectId}/settings/widget`, icon: Palette },
    { name: t("settings.aiResponder"), href: `/projects/${projectId}/settings/ai`, icon: Bot },
    { name: t("settings.cannedResponses"), href: `/projects/${projectId}/settings/canned-responses`, icon: MessageSquarePlus },
    { name: t("settings.actionTemplates"), href: `/projects/${projectId}/settings/action-templates`, icon: Workflow },
    { name: t("settings.auditLogs"), href: `/projects/${projectId}/settings/audit-logs`, icon: ShieldAlert },
  ];

  const backHref = `/inbox/projects/${projectId}`;

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 lg:w-72 bg-card border-r flex-col">
        {/* Project Card */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar
              name={project?.name || "Project"}
              size="md"
              className="ring-2 ring-offset-2 ring-border"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate text-foreground">
                {project?.name || t("common.loading")}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {t("settings.projectSettings")}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          <Link
            to={backHref}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t("settings.backToInbox")}</span>
          </Link>

          <div className="pt-4 pb-2">
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("settings.title")}
            </h3>
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-foreground truncate max-w-[200px]">
            {project?.name || t("settings.title")}
          </h1>
          <div className="w-10" />
        </div>

        {/* Mobile Drawer */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-card border-b shadow-lg">
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar
                  name={project?.name || "Project"}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-sm text-foreground">
                    {project?.name || t("common.loading")}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {t("settings.projectSettings")}
                  </p>
                </div>
              </div>
            </div>

            <nav className="p-3 space-y-1">
              <Link
                to={backHref}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{t("settings.backToInbox")}</span>
              </Link>

              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent"
                    )
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background overflow-auto mt-16 md:mt-0">
        <div className="max-w-6xl mx-auto pb-20">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
