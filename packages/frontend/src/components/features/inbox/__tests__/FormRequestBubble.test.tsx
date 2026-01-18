// src/components/features/inbox/__tests__/FormRequestBubble.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormRequestBubble } from "../FormRequestBubble";
import { ActionFieldType, MessageStatus } from "@live-chat/shared-types";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "actions.formDisplay.awaitingResponse": "Awaiting visitor response",
        "actions.formDisplay.visitorFilling": "Visitor is filling form...",
        "actions.formDisplay.submitted": "Submitted",
        "actions.formDisplay.expired": "Expired",
        "actions.formDisplay.textField": "Text field",
        "actions.formDisplay.numberField": "Number field",
        "actions.formDisplay.dateField": "Date field",
        "actions.formDisplay.yesNo": "Yes/No",
      };
      if (key === "actions.formDisplay.fields" && params?.count !== undefined) {
        return `${params.count} fields`;
      }
      return translations[key] || key;
    },
  }),
}));

// Mock the typing store
vi.mock("../../../../stores/typingStore", () => ({
  useTypingStore: vi.fn(() => ({
    fillingStatus: {},
  })),
}));

import { useTypingStore } from "../../../../stores/typingStore";
const mockUseTypingStore = vi.mocked(useTypingStore);

describe("FormRequestBubble", () => {
  const mockMessage = {
    id: "1",
    conversationId: 123,
    content: "Form request: Booking Form",
    contentType: "form_request",
    fromCustomer: false,
    createdAt: new Date().toISOString(),
    status: MessageStatus.SENT,
    metadata: {
      templateId: 1,
      templateName: "Booking Form",
      templateDescription: "Please fill out your details",
      definition: {
        fields: [
          { key: "name", label: "Guest Name", type: ActionFieldType.TEXT, required: true },
          { key: "date", label: "Check-in Date", type: ActionFieldType.DATE, required: true },
          { key: "room", label: "Room Type", type: ActionFieldType.SELECT, required: false, options: ["Standard", "Deluxe"] },
          { key: "requests", label: "Special Requests", type: ActionFieldType.TEXT, required: false },
        ],
      },
      expiresAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    },
  };

  beforeEach(() => {
    mockUseTypingStore.mockReturnValue({ fillingStatus: {} } as any);
  });

  it("renders template name and field count badge", () => {
    render(<FormRequestBubble message={mockMessage} conversationId={123} />);
    expect(screen.getByText("Booking Form")).toBeInTheDocument();
    expect(screen.getByText("4 fields")).toBeInTheDocument();
  });

  it("shows template description", () => {
    render(<FormRequestBubble message={mockMessage} conversationId={123} />);
    expect(screen.getByText("Please fill out your details")).toBeInTheDocument();
  });

  it("expands on chevron click to show field list", () => {
    render(<FormRequestBubble message={mockMessage} conversationId={123} />);
    
    // Initially fields should not be visible
    expect(screen.queryByText("Guest Name")).not.toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(screen.getByText("Booking Form"));
    
    // Now fields should be visible
    expect(screen.getByText("Guest Name")).toBeInTheDocument();
    expect(screen.getByText("Check-in Date")).toBeInTheDocument();
  });

  it("shows pending status by default", () => {
    render(<FormRequestBubble message={mockMessage} conversationId={123} />);
    expect(screen.getByText(/Awaiting visitor response/)).toBeInTheDocument();
  });

  it("shows filling status when visitor is filling", () => {
    mockUseTypingStore.mockReturnValue({ fillingStatus: { 123: true } } as any);
    render(<FormRequestBubble message={mockMessage} conversationId={123} />);
    expect(screen.getByText(/Visitor is filling form/)).toBeInTheDocument();
  });

  it("shows expired status when form is expired", () => {
    const expiredMessage = {
      ...mockMessage,
      metadata: {
        ...mockMessage.metadata,
        expiresAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      },
    };
    render(<FormRequestBubble message={expiredMessage} conversationId={123} />);
    expect(screen.getByText(/Expired/)).toBeInTheDocument();
  });

  it("applies muted styling to expired forms", () => {
    const expiredMessage = {
      ...mockMessage,
      metadata: {
        ...mockMessage.metadata,
        expiresAt: new Date(Date.now() - 86400000).toISOString(),
      },
    };
    const { container } = render(<FormRequestBubble message={expiredMessage} conversationId={123} />);
    const card = container.querySelector(".border-dashed");
    expect(card).toBeInTheDocument();
  });
});

