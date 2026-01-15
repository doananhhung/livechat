import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RenameVisitorDialog } from '../RenameVisitorDialog';
import { useUpdateVisitor } from '../../../../features/inbox/hooks/useUpdateVisitor';
import { useToast } from '../../../ui/use-toast';
import { vi } from 'vitest';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock useUpdateVisitor hook
vi.mock('../../../../features/inbox/hooks/useUpdateVisitor', () => ({
  useUpdateVisitor: vi.fn(),
}));

// Mock useToast hook
vi.mock('../../../ui/use-toast', () => ({
  useToast: vi.fn(),
}));

// Mock Dialog components to render properly in tests
vi.mock('../../../ui/Dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div role="dialog" aria-labelledby="dialog-title">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2 id="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

describe('RenameVisitorDialog', () => {
  const mockOnClose = vi.fn();
  const mockMutateAsync = vi.fn();
  const mockToast = vi.fn();
  const mockVisitor = { 
    id: 1, 
    displayName: 'Original Name', 
    visitorUid: 'test-uid',
    projectId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSeenAt: new Date(), // ADDED
  };
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (useUpdateVisitor as ReturnType<typeof vi.fn>).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
    (useToast as ReturnType<typeof vi.fn>).mockReturnValue({
      toast: mockToast,
    });
  });

  const renderComponent = (isOpen = true, visitor = mockVisitor, projectId = 1) =>
    render(
      <QueryClientProvider client={queryClient}>
          <RenameVisitorDialog
            isOpen={isOpen}
            onClose={mockOnClose}
            visitor={visitor}
            projectId={projectId}
          />
      </QueryClientProvider>
    );

  it('renders the dialog with the current visitor name', () => {
    renderComponent();
    expect(screen.getByRole('dialog', { name: /visitor.rename.title/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Original Name')).toBeInTheDocument();
  });

  it('updates draft name on input change', () => {
    renderComponent();
    const input = screen.getByDisplayValue('Original Name');
    fireEvent.change(input, { target: { value: 'New Name' } });
    expect(screen.getByDisplayValue('New Name')).toBeInTheDocument();
  });

  it('calls mutateAsync, closes dialog and shows success toast on save', async () => {
    mockMutateAsync.mockResolvedValueOnce({});
    renderComponent();
    const input = screen.getByDisplayValue('Original Name');
    fireEvent.change(input, { target: { value: 'New Name' } });
    fireEvent.click(screen.getByRole('button', { name: /common.save/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        projectId: 1,
        visitorId: 1,
        displayName: 'New Name',
      });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'common.success' }));
    });
  });

  it('closes dialog on cancel button click', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /common.cancel/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('disables save button for empty name', () => {
    renderComponent();
    const input = screen.getByDisplayValue('Original Name');
    fireEvent.change(input, { target: { value: '   ' } });
    
    const saveButton = screen.getByRole('button', { name: /common.save/i });
    expect(saveButton).toBeDisabled();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('disables save button for too long name', () => {
    renderComponent();
    const input = screen.getByDisplayValue('Original Name');
    fireEvent.change(input, { target: { value: 'a'.repeat(51) } });
    
    const saveButton = screen.getByRole('button', { name: /common.save/i });
    expect(saveButton).toBeDisabled();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('shows error toast on mutateAsync failure', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('API Error'));
    renderComponent();
    const input = screen.getByDisplayValue('Original Name');
    fireEvent.change(input, { target: { value: 'Valid Name' } });
    fireEvent.click(screen.getByRole('button', { name: /common.save/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
    });
  });
});
