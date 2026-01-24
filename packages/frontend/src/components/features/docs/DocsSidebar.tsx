// src/components/features/docs/DocsSidebar.tsx
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "../../../lib/utils";
import {
  Shield,
  Users,
  MessageSquare,
  Bot,
  BookOpen,
} from "lucide-react";

interface DocsSidebarProps extends React.HTMLAttributes<HTMLElement> {}

export const DocsSidebar = ({ className, ...props }: DocsSidebarProps) => {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const items = [
    {
      href: "/docs",
      title: t("docs.nav.overview"),
      icon: BookOpen,
    },
    {
      href: "/docs/security",
      title: t("docs.nav.security"),
      icon: Shield,
    },
    {
      href: "/docs/management",
      title: t("docs.nav.management"),
      icon: Users,
    },
    {
      href: "/docs/efficiency",
      title: t("docs.nav.efficiency"),
      icon: MessageSquare,
    },
    {
      href: "/docs/automation",
      title: t("docs.nav.automation"),
      icon: Bot,
    },
  ];

  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors",
            pathname === item.href
              ? "bg-muted text-primary"
              : "text-muted-foreground"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.title}
        </Link>
      ))}
    </nav>
  );
};
