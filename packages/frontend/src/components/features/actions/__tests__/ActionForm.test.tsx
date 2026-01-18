import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ActionForm } from "../ActionForm";
import { type ActionTemplate, ActionFieldType } from "@live-chat/shared-types";
import { actionsApi } from "../../../../services/actionApi";
import { vi } from "vitest";

// Mock API
vi.mock("../../../../services/actionApi", () => ({
  actionsApi: {
    createSubmission: vi.fn(),
  },
}));

// Mock Translation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("ActionForm", () => {
  const mockTemplate: ActionTemplate = {
    id: 1,
    projectId: 1,
    name: "Test Template",
    description: "Description",
    isEnabled: true,
    definition: {
      fields: [
        { key: "name", label: "Name", type: ActionFieldType.TEXT, required: true },
        { key: "age", label: "Age", type: ActionFieldType.NUMBER, required: false },
      ],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const onSuccessMock = vi.fn();
  const onCancelMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form fields correctly", () => {
    render(
      <ActionForm
        template={mockTemplate}
        conversationId="conv-1"
        onSuccess={onSuccessMock}
        onCancel={onCancelMock}
      />
    );

    expect(screen.getByText("Test Template")).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Age/i)).toBeInTheDocument();
  });

  it("submits valid data", async () => {
    (actionsApi.createSubmission as any).mockResolvedValue({});

    render(
        <ActionForm
          template={mockTemplate}
          conversationId="conv-1"
          onSuccess={onSuccessMock}
          onCancel={onCancelMock}
        />
      );

    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByLabelText(/Age/i), { target: { value: "30" } });
    fireEvent.click(screen.getByText("common.submit"));

    await waitFor(() => {
        expect(actionsApi.createSubmission).toHaveBeenCalledWith("conv-1", 1, {
            name: "John",
            age: 30,
        });
        expect(onSuccessMock).toHaveBeenCalled();
    });
  });

  it("shows validation error for required field", async () => {
    render(
        <ActionForm
          template={mockTemplate}
          conversationId="conv-1"
          onSuccess={onSuccessMock}
          onCancel={onCancelMock}
        />
      );

    fireEvent.click(screen.getByText("common.submit"));

    await waitFor(() => {
        expect(screen.getByText("common.required")).toBeInTheDocument();
        expect(actionsApi.createSubmission).not.toHaveBeenCalled();
    });
  });
});
