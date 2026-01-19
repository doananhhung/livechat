import { render, screen, fireEvent, within } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { UserNav } from "./UserNav";
import { useAuthStore } from "../../stores/authStore";

// Mock dependencies
vi.mock("../../stores/authStore", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("../../stores/themeStore", () => ({
  useThemeStore: () => ({ theme: "system", setTheme: vi.fn() }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: "en",
      changeLanguage: vi.fn(),
    },
  }),
}));

const mockedUseNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useNavigate: () => mockedUseNavigate,
  };
});

// Simplify UI component mocks
vi.mock("../../components/ui/Avatar", () => ({
  Avatar: ({ name }: { name: string }) => (
    <div data-testid="mock-avatar">{name}</div>
  ),
}));

// Remove Button mock since component uses native button
// vi.mock('../../components/ui/Button', () => ({...}));

vi.mock("../../components/ui/DropdownMenu", () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => (
    <div data-testid="mock-dropdown-content">{children}</div>
  ),
  DropdownMenuItem: ({ children, onClick }: any) => (
    <button data-testid="mock-dropdown-item" onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuSub: ({ children }: any) => (
    <div data-testid="mock-dropdown-sub">{children}</div>
  ),
  DropdownMenuSubTrigger: ({ children }: any) => (
    <div data-testid="mock-dropdown-sub-trigger">{children}</div>
  ),
  DropdownMenuSubContent: ({ children }: any) => (
    <div data-testid="mock-dropdown-sub-content">{children}</div>
  ),
}));

describe("UserNav", () => {
  const mockUser = {
    fullName: "John Doe",
    email: "john.doe@example.com",
    avatarUrl: "https://example.com/avatar.jpg",
  };

  const mockLogout = vi.fn();

  beforeEach(() => {
    mockLogout.mockClear();
    mockedUseNavigate.mockClear();

    // Correctly mock Zustand with selectors
    (useAuthStore as any).mockImplementation((selector: any) => {
      const state = {
        user: mockUser,
        logout: mockLogout,
      };
      return selector ? selector(state) : state;
    });
  });

  it("renders user details when expanded (isCollapsed=false)", () => {
    render(
      <BrowserRouter>
        <UserNav isCollapsed={false} />
      </BrowserRouter>,
    );
    // Find the trigger button (first button - others are dropdown items)
    const triggerBtn = screen.getAllByRole("button")[0];

    // We expect "John Doe" to appear twice: in Avatar and in the text details
    const nameElements = within(triggerBtn).getAllByText(mockUser.fullName);
    expect(nameElements).toHaveLength(2);

    expect(within(triggerBtn).getByText(mockUser.email)).toBeInTheDocument();
  });

  it("hides user details when collapsed (isCollapsed=true)", () => {
    render(
      <BrowserRouter>
        <UserNav isCollapsed={true} />
      </BrowserRouter>,
    );
    // Find the trigger button (first button - others are dropdown items)
    const triggerBtn = screen.getAllByRole("button")[0];

    // We expect "John Doe" to appear ONLY ONCE (in the Avatar)
    const nameElements = within(triggerBtn).getAllByText(mockUser.fullName);
    expect(nameElements).toHaveLength(1);

    // Email should be completely gone
    expect(
      within(triggerBtn).queryByText(mockUser.email),
    ).not.toBeInTheDocument();

    // Avatar should still be there
    expect(within(triggerBtn).getByTestId("mock-avatar")).toBeInTheDocument();
  });

  it("renders dropdown content correctly", () => {
    render(
      <BrowserRouter>
        <UserNav />
      </BrowserRouter>,
    );
    const dropdownContent = screen.getByTestId("mock-dropdown-content");
    expect(dropdownContent).toBeInTheDocument();

    // Check specific dropdown elements
    expect(
      within(dropdownContent).getByText(mockUser.fullName),
    ).toBeInTheDocument();
    expect(
      within(dropdownContent).getByText(mockUser.email),
    ).toBeInTheDocument();

    const items = screen.getAllByTestId("mock-dropdown-item");
    expect(items[0]).toHaveTextContent("settings.myProfile");
    // Items 1-3 are theme options (light, dark, system) inside DropdownMenuSubContent
    // Items 4-5 are language options
    expect(items[6]).toHaveTextContent("settings.logout");
  });

  it("navigates to profile on click", () => {
    render(
      <BrowserRouter>
        <UserNav />
      </BrowserRouter>,
    );
    const profileBtn = screen.getByText("settings.myProfile");
    fireEvent.click(profileBtn);
    expect(mockedUseNavigate).toHaveBeenCalledWith("/settings/profile");
  });

  it("calls logout on click", () => {
    render(
      <BrowserRouter>
        <UserNav />
      </BrowserRouter>,
    );
    const logoutBtn = screen.getByText("settings.logout");
    fireEvent.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalled();
    expect(mockedUseNavigate).toHaveBeenCalledWith("/login");
  });
});
