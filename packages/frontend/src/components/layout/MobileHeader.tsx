import { Link } from "react-router-dom";
import { Menu, MessageSquare } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Sheet, SheetContent, SheetTrigger } from "../../components/ui/sheet";

import { UserNav } from "./UserNav";
import { GlobalSidebarContent } from "./GlobalSidebar"; // Import the reusable content

interface MobileHeaderProps {
  className?: string;
}

/**
 * MobileHeader Component
 *
 * Renders the header specifically for mobile views. It includes an app title,
 * a hamburger menu to open a Sheet containing the GlobalSidebar content,
 * and a simplified UserNav.
 *
 * @param {MobileHeaderProps} props - The properties for the component.
 * @param {string} [props.className] - Optional CSS class names to apply to the header.
 *
 * @returns {JSX.Element} The rendered mobile header.
 */
export function MobileHeader({ className }: MobileHeaderProps) {
  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between border-b bg-background px-4 md:hidden", // Visible only on mobile
        className,
      )}
    >
      <div className="flex items-center space-x-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            {/* Reuse the content from GlobalSidebar, always expanded on mobile */}
            <GlobalSidebarContent />
          </SheetContent>
        </Sheet>
        <Link to="/" className="flex items-center space-x-2 text-xl font-bold">
          <MessageSquare className="h-6 w-6" />
          <span>Live Chat</span>
        </Link>
      </div>

      <div className="flex items-center">
        {/* Simplified UserNav for mobile header */}
        <UserNav />
      </div>
    </header>
  );
}
