import { Link } from 'react-router-dom';
import { MessageSquare, Folder } from 'lucide-react';
import { cn } from '../../lib/utils';
import { UserNav } from './UserNav';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import * as projectApi from '../../services/projectApi';

interface GlobalSidebarProps {
  className?: string;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem = ({ to, icon, label }: NavItemProps) => {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Link
          to={to}
          className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {icon}
          <span className="sr-only">{label}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">
        {label}
      </TooltipContent>
    </Tooltip>
  );
};

export function GlobalSidebarContent() {
  const { t } = useTranslation();

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: projectApi.getProjects,
  });

  const firstProjectId = projects?.[0]?.id;

  return (
    <div className="flex flex-col h-full">
      {/* Header/Logo */}
      <div className="flex h-[52px] items-center justify-center flex-shrink-0">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link to="/" className="flex items-center justify-center">
              <img src="/logo.png" alt={t("common.appName")} className="h-7 w-7" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            {t("common.appName")}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center space-y-2 py-4">
        <NavItem
          to="/inbox"
          icon={<MessageSquare className="h-5 w-5" />}
          label={t("inbox.title")}
        />
        <NavItem
          to="/settings/projects"
          icon={<Folder className="h-5 w-5" />}
          label={t("settings.menu.projects")}
        />
      </nav>

      {/* Footer / User Controls */}
      <div className="p-2 flex justify-center border-t border-border/50">
        <UserNav isCollapsed={true} />
      </div>
    </div>
  );
}

export function GlobalSidebar({ className }: GlobalSidebarProps) {
  return (
    <TooltipProvider>
      <aside
        className={cn(
          'hidden flex-col border-r bg-muted/40 md:flex h-full w-16',
          className
        )}
      >
        <GlobalSidebarContent />
      </aside>
    </TooltipProvider>
  );
}
