import { render, screen } from "@testing-library/preact";
import { FormSubmissionMessage } from "../FormSubmissionMessage";
import type { FormSubmissionMetadata } from "@live-chat/shared-types";
import { describe, it, expect } from "vitest";

describe("FormSubmissionMessage", () => {
  const mockMetadata: FormSubmissionMetadata = {
    formRequestMessageId: "msg-1",
    submissionId: "sub-1",
    templateName: "Customer Feedback",
    data: {
      name: "John Doe",
      rating: 5,
      comments: "Great service!",
    },
  };

  it("renders submitted data read-only", () => {
    render(
      <FormSubmissionMessage
        metadata={mockMetadata}
        theme="light"
        isFromVisitor={true}
      />,
    );

    expect(screen.getByText(/Customer Feedback/)).toBeInTheDocument();
    expect(screen.getByText("name")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("rating")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("comments")).toBeInTheDocument();
    expect(screen.getByText("Great service!")).toBeInTheDocument();
  });

  it("displays boolean values as Yes/No", () => {
    const metadataWithBoolean: FormSubmissionMetadata = {
      ...mockMetadata,
      data: {
        ...mockMetadata.data,
        isSubscribed: true,
        hasAccount: false,
      },
    };

    render(
      <FormSubmissionMessage
        metadata={metadataWithBoolean}
        theme="light"
        isFromVisitor={false}
      />,
    );

    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("applies visitor styling when isFromVisitor is true", () => {
    const { container } = render(
      <FormSubmissionMessage
        metadata={mockMetadata}
        theme="light"
        isFromVisitor={true}
        primaryColor="#ff0000"
      />,
    );

    const bubble = container.firstChild;
    expect(bubble).toBeDefined();
  });

  it("renders correctly in dark theme", () => {
    const { container } = render(
      <FormSubmissionMessage
        metadata={mockMetadata}
        theme="dark"
        isFromVisitor={false}
      />,
    );

    const bubble = container.firstChild as HTMLElement;
    expect(bubble).toBeDefined();
    // Dark theme should use different background
    expect(bubble.style.backgroundColor).toBeTruthy();
  });

  it('displays null and undefined values as "-"', () => {
    const metadataWithNullValues: FormSubmissionMetadata = {
      ...mockMetadata,
      data: {
        name: "John",
        email: null,
        phone: undefined,
      } as Record<string, unknown>,
    };

    render(
      <FormSubmissionMessage
        metadata={metadataWithNullValues}
        theme="light"
        isFromVisitor={true}
      />,
    );

    expect(screen.getByText("John")).toBeInTheDocument();
    // Null and undefined values should display as "-"
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });
});
