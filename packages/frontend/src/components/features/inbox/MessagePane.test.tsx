import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MessagePane } from './MessagePane';
import { useGetMessages, useUpdateConversationStatus } from '../../../services/inboxApi';
import { ConversationStatus, type Conversation } from '@live-chat/shared-types';
import { vi, describe, it, expect, beforeEach, afterEach, type Mock } from 'vitest';
import { useToast } from '../../ui/use-toast';

// Mock react-router-dom's useParams
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal() as typeof import('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
    MemoryRouter: actual.MemoryRouter,
  };
});

// Mock the API hooks
vi.mock('../../../services/inboxApi', async (importOriginal) => {
  const actual = await importOriginal() as typeof import('../../../services/inboxApi');
  return {
    ...actual,
    useGetMessages: vi.fn(),
    useUpdateConversationStatus: vi.fn(),
    useGetVisitor: vi.fn(() => ({ data: undefined, isLoading: false })),
    useAssignConversation: vi.fn(() => ({ mutate: vi.fn() })),
    useUnassignConversation: vi.fn(() => ({ mutate: vi.fn() })),
  };
});

// Mock useToast hook
vi.mock('../../ui/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
    toasts: [],
  })),
  Toaster: vi.fn(() => null),
}));

// Mock zustand stores
vi.mock('../../../stores/projectStore', () => ({
  useProjectStore: vi.fn((selector) => selector ? selector({ setCurrentProjectId: vi.fn() }) : { setCurrentProjectId: vi.fn() }),
}));
vi.mock('../../../stores/typingStore', () => ({
  useTypingStore: () => ({
    typingStatus: {},
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithClient = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('MessagePane', () => {
  let mockUpdateConversationMutate: ReturnType<typeof useUpdateConversationStatus>['mutate'];
  let mockToast: ReturnType<typeof useToast>['toast'];

  beforeEach(() => {
    (useParams as Mock).mockReturnValue({ projectId: '1', conversationId: '1' });
    mockUpdateConversationMutate = vi.fn();
    (useUpdateConversationStatus as Mock).mockReturnValue({
      mutate: mockUpdateConversationMutate,
      isPending: false,
    });
    (useGetMessages as Mock).mockReturnValue({ data: [], isLoading: false });
    mockToast = vi.fn();
    (useToast as Mock).mockReturnValue({ toast: mockToast, toasts: [] });

    // Mock queryClient.getQueriesData to return a conversation
    vi.spyOn(queryClient, 'getQueriesData').mockReturnValue([
      [
        ['conversations'],
        {
          pages: [
            {
              data: [
                { id: '1', status: ConversationStatus.OPEN, projectId: 1, unreadCount: 0, visitor: { id: 1, displayName: 'Test Visitor' } } as Conversation,
              ],
            },
          ],
        },
      ],
    ] as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('should call updateStatus with SPAM when "Spam" option is selected', async () => {
    const user = userEvent.setup();
    renderWithClient(<MessagePane />);

    const statusDropdownButton = screen.getByRole('button', { name: /Mở/i });
    await user.click(statusDropdownButton);

    const markSpamOption = await screen.findByRole('menuitem', { name: /Spam/i });
    await user.click(markSpamOption);

    await waitFor(() => {
      expect(mockUpdateConversationMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 1,
          payload: { status: ConversationStatus.SPAM },
        }),
        expect.anything()
      );
    });
    
    // Simulate successful API call to trigger toast
    // Cast to Mock to avoid TS error
    (mockUpdateConversationMutate as Mock).mock.calls[0][1].onSuccess();

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Thành công',
          description: 'Cuộc hội thoại với "Test Visitor" đã được chuyển sang "Spam".',
        })
      );
    });
  });
});

