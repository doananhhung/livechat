import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MobileHeader } from './MobileHeader';

// Mock dependencies
vi.mock('./UserNav', () => ({
  UserNav: () => <div data-testid="mock-user-nav">User Nav</div>,
}));

vi.mock('./GlobalSidebar', () => ({
  GlobalSidebarContent: () => <div data-testid="mock-sidebar-content">Sidebar Content</div>,
}));

// Mock UI components to avoid hydration errors (nested buttons)
vi.mock('../../components/ui/Button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('../../components/ui/sheet', () => ({
  Sheet: ({ children }: any) => <div>{children}</div>,
  SheetTrigger: ({ children }: any) => <div data-testid="sheet-trigger">{children}</div>, // Use div to avoid button nesting
  SheetContent: ({ children }: any) => <div data-testid="sheet-content">{children}</div>,
}));

describe('MobileHeader', () => {
  it('renders title and user nav', () => {
    render(
      <BrowserRouter>
        <MobileHeader />
      </BrowserRouter>
    );
    expect(screen.getByText('Live Chat')).toBeInTheDocument();
    expect(screen.getByTestId('mock-user-nav')).toBeInTheDocument();
  });

  it('renders hamburger menu trigger', () => {
    render(
      <BrowserRouter>
        <MobileHeader />
      </BrowserRouter>
    );
    // The trigger wraps the button
    const trigger = screen.getByTestId('sheet-trigger');
    expect(trigger).toBeInTheDocument();
    // Check for the accessible label on the inner button
    expect(screen.getByText('Toggle navigation menu')).toBeInTheDocument();
  });

  it('renders sidebar content within sheet', () => {
    render(
      <BrowserRouter>
        <MobileHeader />
      </BrowserRouter>
    );
    // Since we mocked Sheet to just render children, content is always there
    expect(screen.getByTestId('sheet-content')).toBeInTheDocument();
    expect(screen.getByTestId('mock-sidebar-content')).toBeInTheDocument();
  });
});
