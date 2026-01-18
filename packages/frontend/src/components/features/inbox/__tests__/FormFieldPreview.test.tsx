// src/components/features/inbox/__tests__/FormFieldPreview.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormFieldPreview } from "../FormFieldPreview";
import { ActionFieldType } from "@live-chat/shared-types";

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        "actions.formDisplay.textField": "Text field",
        "actions.formDisplay.numberField": "Number field",
        "actions.formDisplay.dateField": "Date field",
        "actions.formDisplay.yesNo": "Yes/No",
        "actions.formDisplay.yes": "Yes",
        "actions.formDisplay.no": "No",
      };
      if (key === "actions.formDisplay.options" && params?.options) {
        return `Options: ${params.options}`;
      }
      return translations[key] || key;
    },
  }),
}));

describe("FormFieldPreview", () => {
  describe("placeholder display (no value)", () => {
    it("shows [Text field] placeholder for text type", () => {
      const field = {
        key: "name",
        label: "Name",
        type: ActionFieldType.TEXT,
        required: false,
      };
      render(<FormFieldPreview field={field} />);
      expect(screen.getByText("[Text field]")).toBeInTheDocument();
    });

    it("shows [Number field] placeholder for number type", () => {
      const field = {
        key: "age",
        label: "Age",
        type: ActionFieldType.NUMBER,
        required: false,
      };
      render(<FormFieldPreview field={field} />);
      expect(screen.getByText("[Number field]")).toBeInTheDocument();
    });

    it("shows [Yes/No] placeholder for boolean type", () => {
      const field = {
        key: "agree",
        label: "Agree",
        type: ActionFieldType.BOOLEAN,
        required: false,
      };
      render(<FormFieldPreview field={field} />);
      expect(screen.getByText("[Yes/No]")).toBeInTheDocument();
    });
  });

  describe("value display", () => {
    it("shows actual value when provided for text", () => {
      const field = {
        key: "name",
        label: "Name",
        type: ActionFieldType.TEXT,
        required: false,
      };
      render(<FormFieldPreview field={field} value="John Doe" />);
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("shows ✓ Yes for boolean true", () => {
      const field = {
        key: "agree",
        label: "Agree",
        type: ActionFieldType.BOOLEAN,
        required: false,
      };
      render(<FormFieldPreview field={field} value={true} />);
      expect(screen.getByText(/✓.*Yes/)).toBeInTheDocument();
    });

    it("shows ✗ No for boolean false", () => {
      const field = {
        key: "agree",
        label: "Agree",
        type: ActionFieldType.BOOLEAN,
        required: false,
      };
      render(<FormFieldPreview field={field} value={false} />);
      expect(screen.getByText(/✗.*No/)).toBeInTheDocument();
    });
  });
});
