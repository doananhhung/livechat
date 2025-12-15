// src/pages/settings/SettingsLayout.tsx
import { NavLink, Outlet, Link } from "react-router-dom";
import { cn } from "../../lib/utils";

const navItems = [
  { name: "Hồ sơ cá nhân", href: "/settings/profile" },
  { name: "Bảo mật", href: "/settings/security" },
  { name: "Kết nối", href: "/settings/projects" },
];

export function SettingsLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-muted/40 border-r p-4 flex flex-col">
        <nav className="flex flex-col space-y-1 mb-6">
          <Link
            to="/dashboard"
            className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent"
          >
            &larr; Quay lại Inbox
          </Link>
        </nav>
        <h2 className="text-lg font-semibold mb-4 px-3 text-foreground">
          Cài đặt
        </h2>
        <nav className="flex flex-col space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 rounded-md text-sm font-medium",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8 bg-background">
        <Outlet />
      </main>
    </div>
  );
}
