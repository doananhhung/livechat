import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VisitorNameEditor } from '../VisitorNameEditor';
import { useUpdateVisitor } from '../../../../features/inbox/hooks/useUpdateVisitor';
import { useToast } from '../../../ui/use-toast';
import { vi } from 'vitest';

// Mock useUpdateVisitor hook
vi.mock('../../../../features/inbox/hooks/useUpdateVisitor', () => ({
  useUpdateVisitor: vi.fn(),
}));

vi.mock('../../../ui/use-toast', () => ({
  useToast: vi.fn(), // Mock directly as a jest function if relying on import
}));

const queryClient = new QueryClient();

const mockVisitor = {
  id: 1,
  projectId: 1,
  visitorUid: 'visitor-123',
  displayName: 'Original Name',
  currentUrl: 'http://example.com',
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  sessions: [],
  notes: [],
};

describe('VisitorNameEditor', () => {
  const mockMutateAsync = vi.fn();
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useUpdateVisitor as ReturnType<typeof vi.fn>).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
    (useToast as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        toast: mockToast
    });
  });

  const renderComponent = (visitor = mockVisitor, projectId = 1) =>
    render(
      <QueryClientProvider client={queryClient}>
          <VisitorNameEditor visitor={visitor} projectId={projectId} />
      </QueryClientProvider>
    );

  it('displays the visitor name and pencil icon initially', () => {
    renderComponent();
    expect(screen.getByText('Original Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Edit visitor name')).toBeInTheDocument();
  });

  it('enters edit mode when pencil icon is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByLabelText('Edit visitor name'));
    expect(screen.getByDisplayValue('Original Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Save name')).toBeInTheDocument();
    expect(screen.getByLabelText('Cancel editing')).toBeInTheDocument();
  });

  it('updates draft name on input change', () => {
    renderComponent();
    fireEvent.click(screen.getByLabelText('Edit visitor name'));
    const input = screen.getByDisplayValue('Original Name');
    fireEvent.change(input, { target: { value: 'New Name' } });
    expect(screen.getByDisplayValue('New Name')).toBeInTheDocument();
  });

  it('calls mutateAsync and exits edit mode on save', async () => {
    mockMutateAsync.mockResolvedValueOnce({});
    renderComponent();
    fireEvent.click(screen.getByLabelText('Edit visitor name'));
    const input = screen.getByDisplayValue('Original Name');
    fireEvent.change(input, { target: { value: 'New Name' } });
    fireEvent.click(screen.getByLabelText('Save name'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        projectId: 1,
        visitorId: 1,
        displayName: 'New Name',
      });
      expect(screen.queryByDisplayValue('New Name')).not.toBeInTheDocument();
      expect(screen.getByText('Original Name')).toBeInTheDocument(); // Name should update via react-query invalidate
    });
  });

  it('resets draft name and exits edit mode on cancel', () => {
    renderComponent();
    fireEvent.click(screen.getByLabelText('Edit visitor name'));
    const input = screen.getByDisplayValue('Original Name');
    fireEvent.change(input, { target: { value: 'New Name' } });
    fireEvent.click(screen.getByLabelText('Cancel editing'));
    expect(screen.queryByDisplayValue('New Name')).not.toBeInTheDocument();
    expect(screen.getByText('Original Name')).toBeInTheDocument();
  });

  it('disables save button for empty name', () => {
    renderComponent();
    fireEvent.click(screen.getByLabelText('Edit visitor name'));
    const input = screen.getByDisplayValue('Original Name');
    fireEvent.change(input, { target: { value: '   ' } });
    
    // Save button should be disabled for empty name
    const saveButton = screen.getByLabelText('Save name');
    expect(saveButton).toBeDisabled();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('disables save button for too long name', () => {
    renderComponent();
    fireEvent.click(screen.getByLabelText('Edit visitor name'));
    const input = screen.getByDisplayValue('Original Name');
    fireEvent.change(input, { target: { value: 'a'.repeat(51) } });
    
    // Save button should be disabled for too long name
    const saveButton = screen.getByLabelText('Save name');
    expect(saveButton).toBeDisabled();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('shows error toast on mutateAsync failure', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('API Error'));
    renderComponent();
    fireEvent.click(screen.getByLabelText('Edit visitor name'));
    const input = screen.getByDisplayValue('Original Name');
    fireEvent.change(input, { target: { value: 'Valid Name' } });
    fireEvent.click(screen.getByLabelText('Save name'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
    });
  });
});
