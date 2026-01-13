import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { GlobalSidebar } from './GlobalSidebar';
import { UserNav } from './UserNav';

// Mock UserNav
vi.mock('./UserNav', () => ({
  UserNav: ({ isCollapsed }: { isCollapsed: boolean }) => (
    <div data-testid="mock-user-nav">User Nav {isCollapsed ? 'Collapsed' : 'Expanded'}</div>
  ),
}));

// Mock Tooltip components
vi.mock('../../components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
  TooltipProvider: ({ children }: any) => <>{children}</>,
}));

describe('GlobalSidebar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders in collapsed mode by default', () => {
    render(
      <BrowserRouter>
        <GlobalSidebar />
      </BrowserRouter>
    );

    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('w-16');
    expect(screen.queryByText('Live Chat')).not.toBeInTheDocument();
    
    // Toggle button should show ChevronRight (indicating expand action is available, or collapsed state)
    // Actually our logic says: collapsed ? ChevronRight : ChevronLeft.
    // Let's check for the button existence.
    expect(screen.getByRole('button', { name: /Toggle Sidebar/i })).toBeInTheDocument();
  });

  it('toggles between collapsed and expanded states', () => {
    render(
      <BrowserRouter>
        <GlobalSidebar />
      </BrowserRouter>
    );

    const toggleBtn = screen.getByRole('button', { name: /Toggle Sidebar/i });
    const sidebar = screen.getByRole('complementary');

    // Initial: Collapsed
    expect(sidebar).toHaveClass('w-16');

    // Click to Expand
    fireEvent.click(toggleBtn);
    expect(sidebar).toHaveClass('w-64');
    expect(screen.getByText('Live Chat')).toBeInTheDocument();

    // Click to Collapse
    fireEvent.click(toggleBtn);
    expect(sidebar).toHaveClass('w-16');
    expect(screen.queryByText('Live Chat')).not.toBeInTheDocument();
  });

  it('persists state to localStorage', () => {
    render(
      <BrowserRouter>
        <GlobalSidebar />
      </BrowserRouter>
    );

    const toggleBtn = screen.getByRole('button', { name: /Toggle Sidebar/i });
    
    // Initial: Default true (collapsed)
    // Expand it
    fireEvent.click(toggleBtn);
    expect(localStorage.getItem('sidebar-collapsed')).toBe('false');

    // Collapse it
    fireEvent.click(toggleBtn);
    expect(localStorage.getItem('sidebar-collapsed')).toBe('true');
  });

  it('reads state from localStorage on mount', () => {
    localStorage.setItem('sidebar-collapsed', 'false'); // Set to expanded

    render(
      <BrowserRouter>
        <GlobalSidebar />
      </BrowserRouter>
    );

    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('w-64');
    expect(screen.getByText('Live Chat')).toBeInTheDocument();
  });

  it('renders UserNav with correct isCollapsed prop', () => {
    render(
      <BrowserRouter>
        <GlobalSidebar />
      </BrowserRouter>
    );

    // Default collapsed
    expect(screen.getByTestId('mock-user-nav')).toHaveTextContent('User Nav Collapsed');

    // Expand
    fireEvent.click(screen.getByRole('button', { name: /Toggle Sidebar/i }));
    expect(screen.getByTestId('mock-user-nav')).toHaveTextContent('User Nav Expanded');
  });
});