// src/components/layout/UserNav.tsx

import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "../../components/ui/DropdownMenu";
import { Avatar } from "../../components/ui/Avatar";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, Sun, Moon, Monitor, Languages } from "lucide-react";
import { cn } from "../../lib/utils";
import { useTranslation } from "react-i18next";

interface UserNavProps {
  isCollapsed?: boolean;
}

export const UserNav = ({ isCollapsed = false }: UserNavProps) => {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { theme, setTheme } = useThemeStore();
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
              : "w-full gap-2 px-2 py-2 justify-start rounded-md",
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
              <p className="text-sm font-medium leading-none truncate">
                {user.fullName}
              </p>
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
          <span>{t("settings.myProfile")}</span>
        </DropdownMenuItem>

        {/* Theme submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="mr-2 h-4 w-4" />
            <span>{t("settings.theme")}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="max-h-80 overflow-y-auto">
            {/* Base themes */}
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" />
              <span>{t("settings.themeLight")}</span>
              {theme === "light" && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" />
              <span>{t("settings.themeDark")}</span>
              {theme === "dark" && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="mr-2 h-4 w-4" />
              <span>{t("settings.themeSystem")}</span>
              {theme === "system" && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Dark themes */}
            <DropdownMenuItem onClick={() => setTheme("oled-void")}>
              <Moon className="mr-2 h-4 w-4" />
              <span>{t("settings.themeOledVoid")}</span>
              {theme === "oled-void" && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("nordic-frost")}>
              <Moon className="mr-2 h-4 w-4" />
              <span>{t("settings.themeNordicFrost")}</span>
              {theme === "nordic-frost" && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("cyberpunk")}>
              <Moon className="mr-2 h-4 w-4" />
              <span>{t("settings.themeCyberpunk")}</span>
              {theme === "cyberpunk" && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("terminal")}>
              <Moon className="mr-2 h-4 w-4" />
              <span>{t("settings.themeTerminal")}</span>
              {theme === "terminal" && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dracula")}>
              <Moon className="mr-2 h-4 w-4" />
              <span>{t("settings.themeDracula")}</span>
              {theme === "dracula" && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("solarized-dark")}>
              <Moon className="mr-2 h-4 w-4" />
              <span>{t("settings.themeSolarizedDark")}</span>
              {theme === "solarized-dark" && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Light themes */}
            <DropdownMenuItem onClick={() => setTheme("paperback")}>
              <Sun className="mr-2 h-4 w-4" />
              <span>{t("settings.themePaperback")}</span>
              {theme === "paperback" && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("matcha")}>
              <Sun className="mr-2 h-4 w-4" />
              <span>{t("settings.themeMatcha")}</span>
              {theme === "matcha" && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("lavender-mist")}>
              <Sun className="mr-2 h-4 w-4" />
              <span>{t("settings.themeLavenderMist")}</span>
              {theme === "lavender-mist" && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("high-contrast")}>
              <Sun className="mr-2 h-4 w-4" />
              <span>{t("settings.themeHighContrast")}</span>
              {theme === "high-contrast" && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("solarized-light")}>
              <Sun className="mr-2 h-4 w-4" />
              <span>{t("settings.themeSolarizedLight")}</span>
              {theme === "solarized-light" && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Language submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Languages className="mr-2 h-4 w-4" />
            <span>{t("settings.language")}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => i18n.changeLanguage("en")}>
              <span>English</span>
              {i18n.language === "en" && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => i18n.changeLanguage("vi")}>
              <span>Tiếng Việt</span>
              {i18n.language === "vi" && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t("settings.logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
