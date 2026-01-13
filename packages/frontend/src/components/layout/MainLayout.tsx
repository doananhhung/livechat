import { Outlet } from "react-router-dom";
import { GlobalSidebar } from "./GlobalSidebar";
import { MobileHeader } from "./MobileHeader";

export const MainLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <GlobalSidebar className="hidden md:flex" />

      <div className="flex flex-col flex-1 overflow-auto">
        {/* Mobile Header */}
        <MobileHeader className="md:hidden" />

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
