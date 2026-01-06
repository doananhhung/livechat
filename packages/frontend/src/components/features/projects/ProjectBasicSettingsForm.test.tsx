
import "@testing-library/jest-dom"; // Add this for toBeInTheDocument etc
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProjectBasicSettingsForm } from "./ProjectBasicSettingsForm";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../ui/use-toast";
import { type ProjectWithRole, ProjectRole } from "@live-chat/shared-types";

// Mock dependencies
vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock("../../ui/use-toast", () => ({
  useToast: vi.fn(),
}));

vi.mock("../../../services/projectApi", () => ({
  updateProject: vi.fn(),
}));

// Mock UI components to ensure stable behavior
vi.mock("../../ui/Input", () => ({
  Input: (props: any) => <input {...props} />,
}));

describe("ProjectBasicSettingsForm", () => {
  const mockProject: ProjectWithRole = {
    id: 1,
    name: "Test Project",
    whitelistedDomains: ["example.com"],
    myRole: ProjectRole.MANAGER,
    createdAt: new Date(),
    widgetSettings: { 
        primaryColor: "#000000", 
        // Assuming showAgentAvatar might not be in the current shared-types definition, 
        // let's stick to what's likely there or cast if necessary.
        // Checking widget-settings.types.ts would be ideal, but for now I'll cast to satisfy TS if the prop is strictly checked.
        // However, TS error said "Object literal may only specify known properties".
        // Let's remove unknown properties or verify type.
        // I will remove showAgentAvatar if it causes issues, or assume the type check failed because of strict typing.
        // Actually, let's keep it simple.
        logoUrl: "http://example.com/logo.png" 
    } as any, 
    autoResolveMinutes: 10,
    members: [],
  };

  const mockMutate = vi.fn();
  const mockToast = vi.fn();
  const mockInvalidateQueries = vi.fn();

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

  it("renders input field for Auto-Resolve Timer with current value", () => {
    render(<ProjectBasicSettingsForm project={mockProject} />);
    
    const input = screen.getByLabelText(/Tự động chuyển sang PENDING/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue(10);
  });

  it("renders input field with 0 if autoResolveMinutes is null/undefined", () => {
    const projectWithNull = { ...mockProject, autoResolveMinutes: null };
    render(<ProjectBasicSettingsForm project={projectWithNull} />);
    
    const input = screen.getByLabelText(/Tự động chuyển sang PENDING/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue(0);
  });

  it("calls update API with correct autoResolveMinutes when submitted", async () => {
    render(<ProjectBasicSettingsForm project={mockProject} />);
    
    const input = screen.getByLabelText(/Tự động chuyển sang PENDING/i);
    fireEvent.change(input, { target: { value: "20" } });
    
    const submitBtn = screen.getByRole("button", { name: /Lưu thay đổi/i });
    fireEvent.click(submitBtn);

    expect(mockMutate).toHaveBeenCalledWith(expect.objectContaining({
      name: "Test Project",
      whitelistedDomains: ["example.com"],
      autoResolveMinutes: 20,
    }));
  });

  it("shows error if autoResolveMinutes is negative", async () => {
    render(<ProjectBasicSettingsForm project={mockProject} />);
    
    const input = screen.getByLabelText(/Tự động chuyển sang PENDING/i);
    fireEvent.change(input, { target: { value: "-5" } });
    
    const submitBtn = screen.getByRole("button", { name: /Lưu thay đổi/i });
    fireEvent.click(submitBtn);

    expect(mockMutate).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Lỗi",
      variant: "destructive",
    }));
  });
});
