import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { InboxLayout } from "./InboxLayout";
import { useMediaQuery } from "../../hooks/use-media-query";

// Mock the react-i18next hook
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock react-router-dom hooks
const mockUseParams = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useNavigate: vi.fn(),
    useParams: () => mockUseParams(),
    Outlet: () => <div data-testid="mock-outlet-content">Outlet Content</div>,
  };
});

// Mock react-query hook
const mockUseQuery = vi.fn();
const mockGetQueriesData = vi.fn();
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useQuery: (...args: any[]) => mockUseQuery(...args),
    useQueryClient: () => ({
      getQueriesData: mockGetQueriesData,
      getQueryCache: () => ({
        subscribe: () => () => {}, // Returns an unsubscribe function
      }),
    }),
  };
});

// Mock socket context
vi.mock("../../contexts/SocketContext", () => ({
  useSocket: () => ({ socket: { emit: vi.fn() } }),
}));

// Mock hooks
vi.mock("../../hooks/use-media-query", () => ({
  useMediaQuery: vi.fn(),
}));

// Mock useVisitorEvents hook
vi.mock("../../features/inbox/hooks/useVisitorEvents", () => ({
  useVisitorEvents: vi.fn(),
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
vi.mock("../../components/features/inbox/VisitorContextPanel", () => ({
  VisitorContextPanel: () => <div data-testid="mock-visitor-panel">Visitor Panel</div>,
}));

// Mock Resizable Components to capture props for verification
vi.mock("../../components/ui/resizable", () => ({
  ResizablePanelGroup: (props: any) => (
    <div data-testid="resizable-group" data-autosave-id={props.autoSaveId}>
      {props.children}
    </div>
  ),
  ResizablePanel: (props: any) => (
    <div 
      data-testid="resizable-panel" 
      data-collapsible={props.collapsible} 
      data-default-size={props.defaultSize}
      data-min-size={props.minSize}
      data-max-size={props.maxSize}
    >
      {props.children}
    </div>
  ),
  ResizableHandle: () => <div data-testid="resizable-handle" />,
}));

describe("InboxLayout", () => {
  const mockProjects = [{ id: 1, name: "Project Alpha" }];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default: Desktop
    (useMediaQuery as any).mockReturnValue(true);

    // Default: Projects loaded
    mockUseQuery.mockReturnValue({
      data: mockProjects,
      isLoading: false,
      isError: false,
    });
    
    // Default: Params
    mockUseParams.mockReturnValue({ projectId: "1", conversationId: "123" });

    // Default: No conversation found in cache
    mockGetQueriesData.mockReturnValue([]);
  });

  it("renders Desktop layout with ResizablePanelGroup and correct persistence key", () => {
    (useMediaQuery as any).mockReturnValue(true);

    render(
      <BrowserRouter>
        <InboxLayout />
      </BrowserRouter>
    );

    const group = screen.getByTestId("resizable-group");
    expect(group).toBeInTheDocument();
    expect(group).toHaveAttribute("data-autosave-id", "inbox-layout-v1");
  });

  it("renders Panels with correct constraints and collapsible props", () => {
    (useMediaQuery as any).mockReturnValue(true);
    // Mock conversation to show 3rd panel
    mockGetQueriesData.mockReturnValue([
        [
            ['conversations'], 
            { pages: [{ data: [{ id: "123", visitorId: "99" }] }] }
        ]
    ]);

    render(
      <BrowserRouter>
        <InboxLayout />
      </BrowserRouter>
    );

    const panels = screen.getAllByTestId("resizable-panel");
    expect(panels).toHaveLength(3);

    // Left Panel (Conversation List)
    const leftPanel = panels[0];
    expect(leftPanel).toHaveAttribute("data-collapsible", "true");
    expect(leftPanel).toHaveAttribute("data-default-size", "20");
    expect(leftPanel).toHaveAttribute("data-min-size", "15");
    expect(leftPanel).toHaveAttribute("data-max-size", "30");

    // Center Panel (Message Area)
    const centerPanel = panels[1];
    expect(centerPanel).toHaveAttribute("data-default-size", "55");
    expect(centerPanel).toHaveAttribute("data-min-size", "30");

    // Right Panel (Visitor Details)
    const rightPanel = panels[2];
    expect(rightPanel).toHaveAttribute("data-collapsible", "true");
    expect(rightPanel).toHaveAttribute("data-default-size", "25");
    expect(rightPanel).toHaveAttribute("data-min-size", "20");
    expect(rightPanel).toHaveAttribute("data-max-size", "40");
  });

  it("renders Mobile layout (no ResizablePanelGroup)", () => {
    (useMediaQuery as any).mockReturnValue(false);

    render(
      <BrowserRouter>
        <InboxLayout />
      </BrowserRouter>
    );

    expect(screen.queryByTestId("resizable-group")).not.toBeInTheDocument();
    expect(screen.getByTestId("mock-outlet-content")).toBeInTheDocument();
  });

  it("renders VisitorContextPanel on Desktop when conversation is found in cache", () => {
    (useMediaQuery as any).mockReturnValue(true);
    mockGetQueriesData.mockReturnValue([
        [
            ['conversations'], 
            { pages: [{ data: [{ id: "123", visitorId: "99" }] }] }
        ]
    ]);

    render(
      <BrowserRouter>
        <InboxLayout />
      </BrowserRouter>
    );

    expect(screen.getByTestId("mock-visitor-panel")).toBeInTheDocument();
  });

  it("does NOT render VisitorContextPanel if conversation not found", () => {
    (useMediaQuery as any).mockReturnValue(true);
    mockGetQueriesData.mockReturnValue([]); // Empty cache

    render(
      <BrowserRouter>
        <InboxLayout />
      </BrowserRouter>
    );

    expect(screen.queryByTestId("mock-visitor-panel")).not.toBeInTheDocument();
  });

  it("shows loading state", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    render(
      <BrowserRouter>
        <InboxLayout />
      </BrowserRouter>
    );
    expect(screen.getByTestId("mock-spinner")).toBeInTheDocument();
  });
});
