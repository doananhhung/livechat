import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProjectWidgetSettingsDialog } from "./ProjectWidgetSettingsDialog";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProjectWithRole } from "@live-chat/shared-types";
import { ProjectRole, WidgetTheme } from "@live-chat/shared-types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../ui/use-toast";

// Mock hooks
vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock("../../ui/use-toast", () => ({
  useToast: vi.fn(),
}));

// Mock API
vi.mock("../../../services/projectApi", () => ({
  updateProjectSettings: vi.fn(),
}));

describe("ProjectWidgetSettingsDialog", () => {
  const mockProject: ProjectWithRole = {
    id: 1,
    name: "Test Project",
    myRole: ProjectRole.MANAGER,
    createdAt: new Date(),
    widgetSettings: {
      theme: WidgetTheme.LIGHT,
      historyVisibility: "limit_to_active",
    },
    whitelistedDomains: [],
    members: [],
  };

  const mockOnOpenChange = vi.fn();
  const mockMutate = vi.fn();
  const mockInvalidateQueries = vi.fn();
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useMutation as any).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    (useQueryClient as any).mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    });

    (useToast as any).mockReturnValue({
      toast: mockToast,
    });
  });

  it("renders conversation history radio group", () => {
    render(
      <ProjectWidgetSettingsDialog
        project={mockProject}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    expect(screen.getByText("Lịch sử trò chuyện")).toBeInTheDocument();
    expect(screen.getByLabelText(/Ticket Style/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Chat Style/i)).toBeInTheDocument();
  });

  it("initializes with project settings", () => {
    render(
      <ProjectWidgetSettingsDialog
        project={mockProject}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const activeRadio = screen.getByLabelText(/Ticket Style/i) as HTMLInputElement;
    const foreverRadio = screen.getByLabelText(/Chat Style/i) as HTMLInputElement;

    expect(activeRadio.checked).toBe(true);
    expect(foreverRadio.checked).toBe(false);
  });

  it("updates form state when selection changes", () => {
    render(
      <ProjectWidgetSettingsDialog
        project={mockProject}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const foreverRadio = screen.getByLabelText(/Chat Style/i);
    fireEvent.click(foreverRadio);

    const activeRadio = screen.getByLabelText(/Ticket Style/i) as HTMLInputElement;
    expect((foreverRadio as HTMLInputElement).checked).toBe(true);
    expect(activeRadio.checked).toBe(false);
  });

  it("submits the correct data when saved", async () => {
    render(
      <ProjectWidgetSettingsDialog
        project={mockProject}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    // Change to 'forever'
    const foreverRadio = screen.getByLabelText(/Chat Style/i);
    fireEvent.click(foreverRadio);

    // Submit
    const saveButton = screen.getByText("Lưu thay đổi");
    fireEvent.click(saveButton);

    expect(mockMutate).toHaveBeenCalledWith(expect.objectContaining({
      historyVisibility: "forever",
    }));
  });
});
