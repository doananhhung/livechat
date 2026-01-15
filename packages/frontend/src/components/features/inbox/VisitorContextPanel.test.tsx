import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VisitorContextPanel } from './VisitorContextPanel';
import type { Conversation } from '@live-chat/shared-types';
import { ConversationStatus } from '@live-chat/shared-types';
import * as inboxApi from '../../../services/inboxApi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
vi.mock('../../../services/inboxApi', async (importOriginal) => {
  const actual = await importOriginal<typeof inboxApi>();
  return {
    ...actual,
    useGetVisitor: vi.fn(),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('./VisitorNoteList', () => ({
  VisitorNoteList: () => <div data-testid="visitor-note-list">Notes</div>,
}));

describe('VisitorContextPanel', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
    });
    vi.clearAllMocks();
  });

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
      lastSeenAt: new Date(),
      isOnline: true, // ADDED: Default to online for history tests
    },
    metadata: {
      referrer: 'https://google.com',
      landingPage: 'https://example.com/home',
      urlHistory: [
        { url: 'https://example.com/home', title: 'Home', timestamp: new Date().toISOString() },
        { url: 'https://example.com/pricing', title: 'Pricing', timestamp: new Date().toISOString() },
        { url: 'https://example.com/docs', title: 'Docs', timestamp: new Date().toISOString() },
        { url: 'https://example.com/contact', title: 'Contact', timestamp: new Date().toISOString() },
        { url: 'https://example.com/about', title: 'About', timestamp: new Date().toISOString() },
        { url: 'https://example.com/careers', title: 'Careers', timestamp: new Date().toISOString() },
      ],
    },
    assigneeId: null,
    assignee: null,
    assignedAt: null,
    lastMessageSnippet: null,
    lastMessageTimestamp: null,
  };

  it('renders visitor details and referrer', () => {
    vi.mocked(inboxApi.useGetVisitor).mockReturnValue({ 
      data: mockConversation.visitor, 
      isLoading: false 
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <VisitorContextPanel conversation={mockConversation} />
      </QueryClientProvider>
    );

    expect(screen.getByText('visitor.details')).toBeInTheDocument();
    // Added colon to match exact text
    expect(screen.getByText('visitor.referrer:')).toBeInTheDocument();
    expect(screen.getByText('https://google.com')).toBeInTheDocument();
    // Added colon to match exact text
    expect(screen.getByText('visitor.sessionHistory:')).toBeInTheDocument();
  });

  it('should show only latest 3 history items by default', () => {
    vi.mocked(inboxApi.useGetVisitor).mockReturnValue({ 
        data: mockConversation.visitor, 
        isLoading: false 
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <VisitorContextPanel conversation={mockConversation} />
      </QueryClientProvider>
    );

    // Latest 3: Careers, About, Contact
    expect(screen.getByText('Careers')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();

    // Not shown
    expect(screen.queryByText('Docs')).not.toBeInTheDocument();
  });

  describe('Online Status Indicator', () => {
    it('should render green dot, "online" title, and Current Page when visitor is online', () => {
      const onlineVisitor = { ...mockConversation.visitor, isOnline: true, currentUrl: 'https://test.com' };
      vi.mocked(inboxApi.useGetVisitor).mockReturnValue({
        data: onlineVisitor,
        isLoading: false,
      } as any);

      render(
        <QueryClientProvider client={queryClient}>
          <VisitorContextPanel conversation={mockConversation} />
        </QueryClientProvider>
      );

      // Status Indicator
      const statusIndicator = screen.getByTitle('visitor.status.online');
      expect(statusIndicator).toBeInTheDocument();
      expect(statusIndicator).toHaveClass('bg-green-500');

      // Current Page (Visible)
      expect(screen.getByText('visitor.currentPage:')).toBeInTheDocument();
      expect(screen.getByText('https://test.com')).toBeInTheDocument();
    });

    it('should render gray dot, "offline" title, Last Seen text, and HIDE Current Page when visitor is offline', () => {
      const offlineVisitor = { ...mockConversation.visitor, isOnline: false, currentUrl: 'https://test.com', lastSeenAt: new Date() };
      vi.mocked(inboxApi.useGetVisitor).mockReturnValue({
        data: offlineVisitor,
        isLoading: false,
      } as any);

      render(
        <QueryClientProvider client={queryClient}>
          <VisitorContextPanel conversation={mockConversation} />
        </QueryClientProvider>
      );

      // Status Indicator
      const statusIndicator = screen.getByTitle('visitor.status.offline');
      expect(statusIndicator).toBeInTheDocument();
      expect(statusIndicator).toHaveClass('bg-gray-400');

      // Last Seen Text (Visible)
      expect(screen.getByText(/visitor.lastSeen/)).toBeInTheDocument();

      // Current Page (Hidden)
      expect(screen.queryByText('visitor.currentPage:')).not.toBeInTheDocument();
      expect(screen.queryByText('https://test.com')).not.toBeInTheDocument();
    });

    it('should NOT render status indicator when isOnline is null (unknown)', () => {
      const unknownVisitor = { ...mockConversation.visitor, isOnline: null };
      vi.mocked(inboxApi.useGetVisitor).mockReturnValue({
        data: unknownVisitor,
        isLoading: false,
      } as any);

      render(
        <QueryClientProvider client={queryClient}>
          <VisitorContextPanel conversation={mockConversation} />
        </QueryClientProvider>
      );

      expect(screen.queryByTitle('visitor.status.online')).not.toBeInTheDocument();
      expect(screen.queryByTitle('visitor.status.offline')).not.toBeInTheDocument();
    });
  });

  it('should show all items when "View all" is clicked', async () => {
    vi.mocked(inboxApi.useGetVisitor).mockReturnValue({ 
        data: mockConversation.visitor, 
        isLoading: false 
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <VisitorContextPanel conversation={mockConversation} />
      </QueryClientProvider>
    );

    const toggleBtn = screen.getByText('visitor.viewAllPages');
    fireEvent.click(toggleBtn);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('visitor.showLess')).toBeInTheDocument();
  });
});