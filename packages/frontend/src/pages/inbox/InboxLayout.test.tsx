import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { InboxLayout } from "./InboxLayout";
import { useSocket } from "../../contexts/SocketContext"; // Mock this

// Mock the react-i18next hook
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock react-router-dom hooks
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useNavigate: vi.fn(),
    useParams: () => ({ projectId: "1", conversationId: "conv1" }), // Added conversationId
    Outlet: () => <div data-testid="mock-outlet-content">Outlet Content</div>,
  };
});

// Mock react-query hook
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

// Mock socket context
vi.mock("../../contexts/SocketContext", () => ({
  useSocket: () => ({ socket: { emit: vi.fn() } }),
}));

// Mock child components
vi.mock("../../components/features/inbox/ProjectSelector", () => ({
  ProjectSelector: () => <div data-testid="mock-project-selector"></div>,
}));
vi.mock("../../components/features/inbox/ConversationList", () => ({
  ConversationList: () => <div data-testid="mock-conversation-list"></div>,
}));
vi.mock("../../components/ui/Spinner", () => ({
  Spinner: () => <div data-testid="mock-spinner">Loading...</div>,
}));

describe("InboxLayout", () => {
  const mockProjects = [{ id: 1, name: "Project Alpha" }];

  beforeEach(() => {
    // Default mock for useQuery
    (useQuery as any).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      isError: false,
    });
  });

  it("renders correctly with sidebar and main content area", () => {
    render(
      <BrowserRouter>
        <InboxLayout />
      </BrowserRouter>
    );

    expect(screen.getByTestId("mock-project-selector")).toBeInTheDocument();
    expect(screen.getByTestId("mock-conversation-list")).toBeInTheDocument();
    expect(screen.getByTestId("mock-outlet-content")).toBeInTheDocument();
  });

  it("ensures sidebar and main content area use h-full and flexbox layout", () => {
    render(
      <BrowserRouter>
        <InboxLayout />
      </BrowserRouter>
    );

    const mainLayoutDiv = screen
      .getByTestId("mock-project-selector")
      .closest("div.flex");
    expect(mainLayoutDiv).toBeInTheDocument();
    expect(mainLayoutDiv).toHaveClass("h-full");
    expect(mainLayoutDiv).toHaveClass("bg-muted/40");

    const asideElement = screen
      .getByTestId("mock-project-selector")
      .closest("aside");
    expect(asideElement).toBeInTheDocument();
    expect(asideElement).toHaveClass("flex");
    expect(asideElement).toHaveClass("flex-col");
    expect(asideElement).toHaveClass("w-full");
    expect(asideElement).toHaveClass("sm:w-80");
    expect(asideElement).toHaveClass("h-full"); // Crucial check for h-full

    const mainElement = screen
      .getByTestId("mock-outlet-content")
      .closest("main");
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass("flex-1"); // InboxContent is wrapped in <main> with flex-1
  });

  it("shows loading state", () => {
    (useQuery as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    render(
      <BrowserRouter>
        <InboxLayout />
      </BrowserRouter>
    );
    expect(screen.getByTestId("mock-spinner")).toBeInTheDocument(); // Assert against data-testid
  });

  it("shows error state", () => {
    (useQuery as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    render(
      <BrowserRouter>
        <InboxLayout />
      </BrowserRouter>
    );
    expect(screen.getByText("inbox.loadError")).toBeInTheDocument();
  });

  it("shows no projects state", () => {
    (useQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    render(
      <BrowserRouter>
        <InboxLayout />
      </BrowserRouter>
    );
    expect(screen.getByText("inbox.noProjects")).toBeInTheDocument();
  });
});
