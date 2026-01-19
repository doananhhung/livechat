import { render, screen, fireEvent, waitFor } from "@testing-library/preact";
import { FormRequestMessage } from "../FormRequestMessage";
import type {
  FormRequestMetadata,
  ActionFieldType,
} from "@live-chat/shared-types";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("FormRequestMessage", () => {
  const mockMetadata: FormRequestMetadata = {
    templateId: 1,
    templateName: "Customer Feedback",
    templateDescription: "Please provide your feedback",
    definition: {
      fields: [
        {
          key: "name",
          label: "Your Name",
          type: "text" as ActionFieldType,
          required: true,
        },
        {
          key: "rating",
          label: "Rating",
          type: "number" as ActionFieldType,
          required: true,
        },
        {
          key: "comments",
          label: "Comments",
          type: "text" as ActionFieldType,
          required: false,
        },
      ],
    },
  };

  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form fields from definition", () => {
    render(
      <FormRequestMessage
        metadata={mockMetadata}
        messageId="msg-1"
        onSubmit={mockOnSubmit}
        theme="light"
      />,
    );

    expect(screen.getByText("Customer Feedback")).toBeInTheDocument();
    expect(
      screen.getByText("Please provide your feedback"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Rating/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Comments/)).toBeInTheDocument();
  });

  it("submit button is enabled (validation happens on submit)", () => {
    render(
      <FormRequestMessage
        metadata={mockMetadata}
        messageId="msg-1"
        onSubmit={mockOnSubmit}
        theme="light"
      />,
    );

    const submitButton = screen.getByRole("button", { name: /Submit/i });
    expect(submitButton).not.toBeDisabled();
  });

  it("shows validation errors when required fields are empty on submit", async () => {
    render(
      <FormRequestMessage
        metadata={mockMetadata}
        messageId="msg-1"
        onSubmit={mockOnSubmit}
        theme="light"
      />,
    );

    const submitButton = screen.getByRole("button", { name: /Submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Your Name is required/)).toBeInTheDocument();
      expect(screen.getByText(/Rating is required/)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("shows loading state during submission", async () => {
    mockOnSubmit.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000)),
    );

    render(
      <FormRequestMessage
        metadata={mockMetadata}
        messageId="msg-1"
        onSubmit={mockOnSubmit}
        theme="light"
      />,
    );

    fireEvent.input(screen.getByLabelText(/Your Name/), {
      target: { value: "John" },
    });
    fireEvent.input(screen.getByLabelText(/Rating/), {
      target: { value: "5" },
    });

    const submitButton = screen.getByRole("button", { name: /Submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Submitting/i)).toBeInTheDocument();
    });
  });

  it("shows expired state when form is expired", () => {
    render(
      <FormRequestMessage
        metadata={mockMetadata}
        messageId="msg-1"
        onSubmit={mockOnSubmit}
        theme="light"
        isExpired={true}
      />,
    );

    expect(screen.getByText(/expired/i)).toBeInTheDocument();
  });

  it("shows submitted state when form is already submitted", () => {
    render(
      <FormRequestMessage
        metadata={mockMetadata}
        messageId="msg-1"
        onSubmit={mockOnSubmit}
        theme="light"
        isSubmitted={true}
      />,
    );

    expect(screen.getByText(/Form submitted/i)).toBeInTheDocument();
  });

  it("renders date field with date picker", () => {
    const metadataWithDate: FormRequestMetadata = {
      ...mockMetadata,
      definition: {
        fields: [
          {
            key: "birthdate",
            label: "Birth Date",
            type: "date" as ActionFieldType,
            required: true,
          },
        ],
      },
    };

    render(
      <FormRequestMessage
        metadata={metadataWithDate}
        messageId="msg-1"
        onSubmit={mockOnSubmit}
        theme="light"
      />,
    );

    const dateInput = screen.getByLabelText(/Birth Date/);
    expect(dateInput).toHaveAttribute("type", "date");

    fireEvent.input(dateInput, { target: { value: "2024-01-15" } });
    expect(dateInput).toHaveValue("2024-01-15");
  });

  it("renders boolean field as checkbox and toggles correctly", () => {
    const metadataWithBoolean: FormRequestMetadata = {
      ...mockMetadata,
      definition: {
        fields: [
          {
            key: "subscribe",
            label: "Subscribe to newsletter",
            type: "boolean" as ActionFieldType,
            required: false,
          },
        ],
      },
    };

    render(
      <FormRequestMessage
        metadata={metadataWithBoolean}
        messageId="msg-1"
        onSubmit={mockOnSubmit}
        theme="light"
      />,
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("renders select field with options", () => {
    const metadataWithSelect: FormRequestMetadata = {
      ...mockMetadata,
      definition: {
        fields: [
          {
            key: "priority",
            label: "Priority",
            type: "select" as ActionFieldType,
            required: true,
            options: ["Low", "Medium", "High"],
          },
        ],
      },
    };

    render(
      <FormRequestMessage
        metadata={metadataWithSelect}
        messageId="msg-1"
        onSubmit={mockOnSubmit}
        theme="light"
      />,
    );

    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();

    // Check all options are rendered
    expect(screen.getByText("Low")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();

    // Select an option
    fireEvent.change(select, { target: { value: "High" } });
    expect(select).toHaveValue("High");
  });

  it("clears validation error when user types in field", async () => {
    render(
      <FormRequestMessage
        metadata={mockMetadata}
        messageId="msg-1"
        onSubmit={mockOnSubmit}
        theme="light"
      />,
    );

    // Submit to trigger validation error
    const submitButton = screen.getByRole("button", { name: /Submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Your Name is required/)).toBeInTheDocument();
    });

    // Type in the field
    const nameInput = screen.getByLabelText(/Your Name/);
    fireEvent.input(nameInput, { target: { value: "John" } });

    // Error should be cleared
    await waitFor(() => {
      expect(
        screen.queryByText(/Your Name is required/),
      ).not.toBeInTheDocument();
    });
  });
});
