// src/pages/settings/SettingsLayout.tsx
import { NavLink, Outlet, Link } from "react-router-dom";
import { User, Shield, FolderKanban, MessageSquare, Menu } from "lucide-react";
import { cn } from "../../lib/utils";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { useAuthStore } from "../../stores/authStore";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import * as projectApi from "../../services/projectApi";

export function SettingsLayout() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: projectApi.getProjects,
  });

  const firstProjectId = projects?.[0]?.id;
  
  const navItems = [
    { name: t("settings.menu.profile"), href: "/settings/profile", icon: User },
    { name: t("settings.menu.security"), href: "/settings/security", icon: Shield },
  ];

  if (firstProjectId) {
    navItems.push({ 
      name: t("settings.menu.projects"), 
      href: `/settings/projects/${firstProjectId}`, 
      icon: FolderKanban 
    });
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 lg:w-72 bg-card border-r flex-col">
        {/* User Card */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar
              name={user?.fullName || "User"}
              src={user?.avatarUrl}
              size="md"
              className="ring-2 ring-offset-2 ring-border"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate text-foreground">
                {user?.fullName || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
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
          <h1 className="font-semibold text-foreground">{t("settings.title")}</h1>
          <div className="w-10" />
        </div>

        {/* Mobile Drawer */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-card border-b shadow-lg">
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar
                  name={user?.fullName || "User"}
                  src={user?.avatarUrl}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-sm text-foreground">
                    {user?.fullName || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>

            <nav className="p-3 space-y-1">
              <Link
                to="/dashboard"
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent"
                onClick={() => setMobileMenuOpen(false)}
              >
                <MessageSquare className="h-4 w-4" />
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
