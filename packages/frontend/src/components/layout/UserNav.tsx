// src/components/layout/UserNav.tsx

import { useAuthStore } from "../../stores/authStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/DropdownMenu";
import { Avatar } from "../../components/ui/Avatar";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";
import { cn } from "../../lib/utils";

interface UserNavProps {
  isCollapsed?: boolean;
}

export const UserNav = ({ isCollapsed = false }: UserNavProps) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      logout();
      navigate("/login");
    } catch (error) {
      console.error("An error occurred during logout:", error);
      navigate("/login");
    }
  };
  if (!user) return null;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        {/* Using native button for better click handling */}
        <button
          type="button"
          className={cn(
            "flex items-center justify-center rounded-full transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            isCollapsed 
              ? "h-12 w-12" 
              : "w-full gap-2 px-2 py-2 justify-start rounded-md"
          )}
        >
          <Avatar
            name={user.fullName}
            src={user.avatarUrl}
            size="sm"
            className="ring-2 ring-border ring-offset-2 ring-offset-background flex-shrink-0"
          />
          {!isCollapsed && (
            <div className="flex flex-col space-y-1 text-left min-w-0">
              <p className="text-sm font-medium leading-none truncate">{user.fullName}</p>
              <p className="text-xs leading-none text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56"
        align={isCollapsed ? "end" : "start"}
        side={isCollapsed ? "right" : "top"}
        forceMount
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.fullName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/settings/profile")}>
          <Settings className="mr-2 h-4 w-4" />
          <span>My Profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};