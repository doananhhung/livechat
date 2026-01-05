import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConversationList } from './ConversationList';
import { useGetConversations } from '../../../services/inboxApi';
import { ConversationStatus } from '@live-chat/shared-types';
import { vi, describe, it, expect, beforeEach, afterEach, type Mock } from 'vitest';

// Mock react-router-dom's useParams
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal() as typeof import('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
    MemoryRouter: actual.MemoryRouter, // Explicitly re-export MemoryRouter
  };
});

// Mock the API hook
vi.mock('../../../services/inboxApi', () => ({
  useGetConversations: vi.fn(),
  useUpdateConversationStatus: vi.fn(() => ({ mutate: vi.fn() })),
  useDeleteConversation: vi.fn(() => ({ mutate: vi.fn() })),
}));

// Mock zustand stores
vi.mock('../../../stores/projectStore', () => {
  const mockStore = {
    currentProjectId: null, // Default mock value
    setCurrentProjectId: vi.fn(),
  };
  return {
    useProjectStore: vi.fn((selector) => selector ? selector(mockStore) : mockStore),
  };
});
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

describe('ConversationList', () => {
  beforeEach(() => {
    (useParams as Mock).mockReturnValue({ projectId: '1' });
    (useGetConversations as Mock).mockReturnValue({
      data: { pages: [{ data: [], total: 0 }] },
      isLoading: false,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call useGetConversations with status=SOLVED when "Xong" button is clicked', async () => {
    renderWithClient(<ConversationList />);

    const solvedButton = screen.getByRole('button', { name: /Xong/i });
    fireEvent.click(solvedButton);

    await waitFor(() => {
      expect(useGetConversations).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ConversationStatus.SOLVED,
        })
      );
    });
  });
});
