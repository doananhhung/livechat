import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VisitorNameEditor } from '../VisitorNameEditor';
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

vi.mock('../../../ui/use-toast', () => ({
  useToast: vi.fn(),
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
    expect(screen.getByLabelText('visitor.rename.editAriaLabel')).toBeInTheDocument();
  });

  it('enters edit mode when pencil icon is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByLabelText('visitor.rename.editAriaLabel'));
    expect(screen.getByDisplayValue('Original Name')).toBeInTheDocument();
    expect(screen.getByLabelText('visitor.rename.saveAriaLabel')).toBeInTheDocument();
    expect(screen.getByLabelText('visitor.rename.cancelAriaLabel')).toBeInTheDocument();
  });

  it('updates draft name on input change', () => {
    renderComponent();
    fireEvent.click(screen.getByLabelText('visitor.rename.editAriaLabel'));
    const input = screen.getByDisplayValue('Original Name');
    fireEvent.change(input, { target: { value: 'New Name' } });
    expect(screen.getByDisplayValue('New Name')).toBeInTheDocument();
  });

  it('calls mutateAsync and exits edit mode on save', async () => {
    mockMutateAsync.mockResolvedValueOnce({});
    renderComponent();
    fireEvent.click(screen.getByLabelText('visitor.rename.editAriaLabel'));
    const input = screen.getByDisplayValue('Original Name');
    fireEvent.change(input, { target: { value: 'New Name' } });
    fireEvent.click(screen.getByLabelText('visitor.rename.saveAriaLabel'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        projectId: 1,
        visitorId: 1,
        displayName: 'New Name',
      });
      expect(screen.queryByDisplayValue('New Name')).not.toBeInTheDocument();
      expect(screen.getByText('Original Name')).toBeInTheDocument();
    });
  });

  it('resets draft name and exits edit mode on cancel', () => {
    renderComponent();
    fireEvent.click(screen.getByLabelText('visitor.rename.editAriaLabel'));
    const input = screen.getByDisplayValue('Original Name');
    fireEvent.change(input, { target: { value: 'New Name' } });
    fireEvent.click(screen.getByLabelText('visitor.rename.cancelAriaLabel'));
    expect(screen.queryByDisplayValue('New Name')).not.toBeInTheDocument();
    expect(screen.getByText('Original Name')).toBeInTheDocument();
  });

  it('disables save button for empty name', () => {
    renderComponent();
    fireEvent.click(screen.getByLabelText('visitor.rename.editAriaLabel'));
    const input = screen.getByDisplayValue('Original Name');
    fireEvent.change(input, { target: { value: '   ' } });
    
    const saveButton = screen.getByLabelText('visitor.rename.saveAriaLabel');
    expect(saveButton).toBeDisabled();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('disables save button for too long name', () => {
    renderComponent();
    fireEvent.click(screen.getByLabelText('visitor.rename.editAriaLabel'));
    const input = screen.getByDisplayValue('Original Name');
    fireEvent.change(input, { target: { value: 'a'.repeat(51) } });
    
    const saveButton = screen.getByLabelText('visitor.rename.saveAriaLabel');
    expect(saveButton).toBeDisabled();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('shows error toast on mutateAsync failure', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('API Error'));
    renderComponent();
    fireEvent.click(screen.getByLabelText('visitor.rename.editAriaLabel'));
    const input = screen.getByDisplayValue('Original Name');
    fireEvent.change(input, { target: { value: 'Valid Name' } });
    fireEvent.click(screen.getByLabelText('visitor.rename.saveAriaLabel'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
    });
  });
});
