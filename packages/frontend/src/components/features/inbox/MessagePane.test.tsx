import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MessagePane } from './MessagePane';
import type { Conversation, Message } from '@live-chat/shared-types';
import { ConversationStatus, MessageStatus } from '@live-chat/shared-types';
import * as inboxApi from '../../../services/inboxApi';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
vi.mock('../../../services/inboxApi', async (importOriginal) => {
  const actual = await importOriginal<typeof inboxApi>();
  return {
    ...actual,
    useGetMessages: vi.fn(),
    useUpdateConversationStatus: vi.fn(),
    useSendAgentReply: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
    useNotifyAgentTyping: vi.fn(() => ({ mutate: vi.fn() })),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
    },
  }),
}));
vi.mock('../../../stores/typingStore', () => ({
  useTypingStore: () => ({ typingStatus: {} }),
}));
vi.mock('../../../components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
// Mock child components that we don't need to test in detail here
vi.mock('./MessageComposer', () => ({
  default: () => <div data-testid="message-composer">Composer</div>,
}));
vi.mock('./AssignmentControls', () => ({
  AssignmentControls: () => <div data-testid="assignment-controls">Assignment</div>,
}));

describe('MessagePane Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = (conversationId: string, projectId: string) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/inbox/projects/${projectId}/conversations/${conversationId}`]}>
          <Routes>
            <Route path="/inbox/projects/:projectId/conversations/:conversationId" element={<MessagePane />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  const mockConversation: Conversation = {
    id: 1,
    projectId: 1,
    visitorId: 101,
    status: ConversationStatus.OPEN,
    unreadCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    visitor: {
      id: 101,
      displayName: 'Visitor 101',
      projectId: 1,
      visitorUid: 'uid-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    metadata: {
      referrer: null,
      landingPage: '/',
      urlHistory: []
    },
    assigneeId: null,
    assignee: null,
    assignedAt: null,
    lastMessageSnippet: null,
    lastMessageTimestamp: null,
  };

  const mockMessages: Message[] = [
    {
      id: 'msg-1',
      conversationId: 1,
      content: 'Hello there',
      contentType: 'text',
      status: MessageStatus.SENT,
      fromCustomer: true,
      createdAt: new Date(),
      attachments: []
    }
  ];

  it('should render conversation header and messages', async () => {
    vi.mocked(inboxApi.useGetMessages).mockReturnValue({ data: mockMessages, isLoading: false } as any);
    vi.mocked(inboxApi.useUpdateConversationStatus).mockReturnValue({ mutate: vi.fn(), isPending: false } as any);
    
    // Mock the infinite query data structure for conversation
    queryClient.setQueryData(['conversations'], {
        pages: [{ data: [mockConversation] }],
        pageParams: [],
    });

    renderComponent('1', '1');

    await waitFor(() => {
        expect(screen.getByText('Visitor 101')).toBeInTheDocument();
    });

    expect(screen.getByText('Hello there')).toBeInTheDocument();
    expect(screen.getByTestId('message-composer')).toBeInTheDocument();
    expect(screen.getByTestId('assignment-controls')).toBeInTheDocument();
  });

  it('should NOT render VisitorContextPanel (it is moved to InboxLayout)', async () => {
    vi.mocked(inboxApi.useGetMessages).mockReturnValue({ data: [], isLoading: false } as any);
    vi.mocked(inboxApi.useUpdateConversationStatus).mockReturnValue({ mutate: vi.fn(), isPending: false } as any);
    
    queryClient.setQueryData(['conversations'], {
        pages: [{ data: [mockConversation] }],
        pageParams: [],
    });

    renderComponent('1', '1');

    await waitFor(() => {
        expect(screen.getByText('Visitor 101')).toBeInTheDocument();
    });

    // Verify "visitor.details" (which is the header of VisitorContextPanel) is NOT present
    expect(screen.queryByText('visitor.details')).not.toBeInTheDocument();
  });
});
