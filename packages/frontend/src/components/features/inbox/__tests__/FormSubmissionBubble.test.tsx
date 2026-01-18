// src/components/features/inbox/__tests__/FormSubmissionBubble.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormSubmissionBubble } from "../FormSubmissionBubble";
import { MessageStatus } from "@live-chat/shared-types";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "actions.formDisplay.templateSubmitted": `${params?.templateName} Submitted`,
        "actions.formDisplay.submittedTime": `Submitted ${params?.time}`,
        "actions.formDisplay.edit": "Edit",
        "actions.formDisplay.delete": "Delete",
        "actions.formDisplay.yes": "Yes",
        "actions.formDisplay.no": "No",
      };
      return translations[key] || key;
    },
  }),
}));

describe("FormSubmissionBubble", () => {
  const mockMessage = {
    id: "2",
    conversationId: 123,
    content: "Form submitted: Booking Form",
    contentType: "form_submission",
    fromCustomer: true,
    createdAt: new Date().toISOString(),
    status: MessageStatus.SENT,
    metadata: {
      formRequestMessageId: "1",
      submissionId: "sub-123",
      templateName: "Booking Form",
      data: {
        guestName: "John Doe",
        checkInDate: "2024-03-15",
        roomType: "Deluxe",
        specialRequests: "Late checkout",
      },
    },
  };

  it("renders template name with checkmark", () => {
    render(<FormSubmissionBubble message={mockMessage} />);
    expect(screen.getByText("Booking Form Submitted")).toBeInTheDocument();
  });

  it("renders key-value pairs from data", () => {
    render(<FormSubmissionBubble message={mockMessage} />);
    expect(screen.getByText("Guest Name:")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Room Type:")).toBeInTheDocument();
    expect(screen.getByText("Deluxe")).toBeInTheDocument();
  });

  it("collapses/expands data section on click", () => {
    render(<FormSubmissionBubble message={mockMessage} />);
    
    // Should be expanded by default
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    
    // Click to collapse
    fireEvent.click(screen.getByText("Booking Form Submitted"));
    
    // Data should be hidden
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    
    // Click to expand again
    fireEvent.click(screen.getByText("Booking Form Submitted"));
    
    // Data should be visible again
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("shows edit button when onEdit is provided", () => {
    const onEdit = vi.fn();
    render(<FormSubmissionBubble message={mockMessage} onEdit={onEdit} />);
    
    const editButton = screen.getByText("Edit");
    expect(editButton).toBeInTheDocument();
    
    fireEvent.click(editButton);
    expect(onEdit).toHaveBeenCalledWith("sub-123");
  });

  it("shows delete button when onDelete is provided", () => {
    const onDelete = vi.fn();
    render(<FormSubmissionBubble message={mockMessage} onDelete={onDelete} />);
    
    const deleteButton = screen.getByText("Delete");
    expect(deleteButton).toBeInTheDocument();
    
    fireEvent.click(deleteButton);
    expect(onDelete).toHaveBeenCalledWith("sub-123");
  });
});
