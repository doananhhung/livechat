import { useAuthStore } from "../../stores/authStore";
import { UserNav } from "./UserNav";
import { ThemeToggleButton } from "../ui/ThemeToggleButton";

export const Header = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6">
        <div className="mr-4 hidden md:flex">
          <a href="/inbox" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block text-xl">
              Live Chat App
            </span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-3">
          <nav className="flex items-center space-x-3">
            <ThemeToggleButton />
            <UserNav />
          </nav>
        </div>
      </div>
    </header>
  );
};
