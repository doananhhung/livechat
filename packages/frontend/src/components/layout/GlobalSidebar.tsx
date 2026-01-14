import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Folder, ChevronLeft, ChevronRight, PanelLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { UserNav } from './UserNav';
import { Button } from '../../components/ui/Button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';

interface GlobalSidebarProps {
  className?: string;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
}

const NavItem = ({ to, icon, label, isCollapsed }: NavItemProps) => {
  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link
            to={to}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:h-8 md:w-8"
          >
            {icon}
            <span className="sr-only">{label}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-4">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};

export function GlobalSidebarContent({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <div className="flex flex-col h-full relative">
      {/* Header/Logo */}
      <div className={cn("flex h-[52px] items-center flex-shrink-0", isCollapsed ? "justify-center" : "justify-start px-4")}>
        <Link to="/" className="flex items-center gap-2 font-bold">
          <MessageSquare className="h-6 w-6" />
          {!isCollapsed && <span>Live Chat</span>}
        </Link>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-2 py-4 overflow-y-auto pb-24", isCollapsed ? "px-2" : "px-4")}>
        <NavItem
          to="/inbox"
          icon={<MessageSquare className="h-5 w-5" />}
          label="Inbox"
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/settings/projects"
          icon={<Folder className="h-5 w-5" />}
          label="Projects"
          isCollapsed={isCollapsed}
        />
      </nav>

      {/* Footer / User Controls */}
      <div className={cn("absolute bottom-0 left-0 right-0 p-4 bg-muted/40", isCollapsed && "p-2 flex justify-center")}>
        <UserNav isCollapsed={isCollapsed} />
      </div>
    </div>
  );
}

export function GlobalSidebar({ className }: GlobalSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true); // Default to collapsed

  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'relative hidden flex-col border-r bg-muted/40 transition-all duration-300 ease-in-out md:flex z-30 h-full',
          isCollapsed ? 'w-16' : 'w-64',
          className
        )}
      >
        <GlobalSidebarContent isCollapsed={isCollapsed} />
        
        {/* Toggle Button */}
        <div className="absolute -right-3 top-20 z-20">
            <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 rounded-full border bg-background shadow-md hover:bg-accent hover:text-accent-foreground"
                onClick={toggleSidebar}
            >
                {isCollapsed ? (
                    <ChevronRight className="h-3 w-3" />
                ) : (
                    <ChevronLeft className="h-3 w-3" />
                )}
                <span className="sr-only">Toggle Sidebar</span>
            </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
