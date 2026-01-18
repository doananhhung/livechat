import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { FormRequestMessage } from '../FormRequestMessage';
import type { FormRequestMetadata, ActionFieldType } from '@live-chat/shared-types';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('FormRequestMessage', () => {
  const mockMetadata: FormRequestMetadata = {
    templateId: 1,
    templateName: 'Customer Feedback',
    templateDescription: 'Please provide your feedback',
    definition: {
      fields: [
        { key: 'name', label: 'Your Name', type: 'text' as ActionFieldType, required: true },
        { key: 'rating', label: 'Rating', type: 'number' as ActionFieldType, required: true },
        { key: 'comments', label: 'Comments', type: 'text' as ActionFieldType, required: false },
      ],
    },
  };

  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields from definition', () => {
    render(
      <FormRequestMessage
        metadata={mockMetadata}
        messageId="msg-1"
        onSubmit={mockOnSubmit}
        theme="light"
      />
    );

    expect(screen.getByText('Customer Feedback')).toBeInTheDocument();
    expect(screen.getByText('Please provide your feedback')).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Rating/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Comments/)).toBeInTheDocument();
  });

  it('submit button is enabled (validation happens on submit)', () => {
    render(
      <FormRequestMessage
        metadata={mockMetadata}
        messageId="msg-1"
        onSubmit={mockOnSubmit}
        theme="light"
      />
    );

    const submitButton = screen.getByRole('button', { name: /Submit/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('shows validation errors when required fields are empty on submit', async () => {
    render(
      <FormRequestMessage
        metadata={mockMetadata}
        messageId="msg-1"
        onSubmit={mockOnSubmit}
        theme="light"
      />
    );

    const submitButton = screen.getByRole('button', { name: /Submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Your Name is required/)).toBeInTheDocument();
      expect(screen.getByText(/Rating is required/)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(
      <FormRequestMessage
        metadata={mockMetadata}
        messageId="msg-1"
        onSubmit={mockOnSubmit}
        theme="light"
      />
    );

    fireEvent.input(screen.getByLabelText(/Your Name/), { target: { value: 'John' } });
    fireEvent.input(screen.getByLabelText(/Rating/), { target: { value: '5' } });

    const submitButton = screen.getByRole('button', { name: /Submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Submitting/i)).toBeInTheDocument();
    });
  });

  it('shows expired state when form is expired', () => {
    render(
      <FormRequestMessage
        metadata={mockMetadata}
        messageId="msg-1"
        onSubmit={mockOnSubmit}
        theme="light"
        isExpired={true}
      />
    );

    expect(screen.getByText(/expired/i)).toBeInTheDocument();
  });

  it('shows submitted state when form is already submitted', () => {
    render(
      <FormRequestMessage
        metadata={mockMetadata}
        messageId="msg-1"
        onSubmit={mockOnSubmit}
        theme="light"
        isSubmitted={true}
      />
    );

    expect(screen.getByText(/Form submitted/i)).toBeInTheDocument();
  });
});
