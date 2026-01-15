import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, Outlet } from 'react-router-dom';
import { MainLayout } from './MainLayout';
import { GlobalSidebar } from './GlobalSidebar';
import { MobileHeader } from './MobileHeader';

// Mocking child components for isolation
vi.mock('./GlobalSidebar', () => ({
  GlobalSidebar: ({ className }: { className?: string }) => (
    <div data-testid="mock-global-sidebar" className={className}>
      Mock Global Sidebar
    </div>
  ),
}));
vi.mock('./MobileHeader', () => ({
  MobileHeader: ({ className }: { className?: string }) => (
    <div data-testid="mock-mobile-header" className={className}>
      Mock Mobile Header
    </div>
  ),
}));

// Mock Outlet as it's part of react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    Outlet: () => <div data-testid="mock-outlet">Outlet Content</div>,
  };
});

describe('MainLayout', () => {
  const setScreenWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
    fireEvent(window, new Event('resize')); // Trigger resize event
  };

  beforeEach(() => {
    // Reset innerWidth before each test
    setScreenWidth(1024); // Default to desktop size
  });

  it('renders GlobalSidebar on desktop screens (md or larger)', () => {
    setScreenWidth(769); // A screen width larger than md breakpoint (768px)
    render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    );

    // GlobalSidebar should be present and visible (md:flex overrides hidden)
    const sidebar = screen.getByTestId('mock-global-sidebar');
    expect(sidebar).toBeInTheDocument();
    expect(sidebar).toHaveClass('hidden'); // 'hidden' should not be active
    expect(sidebar).toHaveClass('md:flex'); // 'md:flex' should be active

    // MobileHeader should be present but hidden by CSS (md:hidden active)
    const mobileHeader = screen.getByTestId('mock-mobile-header');
    expect(mobileHeader).toBeInTheDocument();
    expect(mobileHeader).toHaveClass('md:hidden'); // 'md:hidden' should be present
  });

  it('renders MobileHeader on mobile screens (smaller than md)', () => {
    setScreenWidth(767); // Just below md breakpoint
    render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    );

    // GlobalSidebar should be present but hidden by CSS ('hidden' active)
    const sidebar = screen.getByTestId('mock-global-sidebar');
    expect(sidebar).toBeInTheDocument();
    expect(sidebar).toHaveClass('hidden'); // 'hidden' should be active
    expect(sidebar).toHaveClass('md:flex'); // 'md:flex' is present but not active

    // MobileHeader should be present and visible (md:hidden not active)
    const mobileHeader = screen.getByTestId('mock-mobile-header');
    expect(mobileHeader).toBeInTheDocument();
    expect(mobileHeader).toHaveClass('md:hidden'); // 'md:hidden' is present but not active, making it visible
  });

  it('has correct top-level flexbox styling', () => {
    render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    );

    const mainDiv = screen.getByTestId('mock-global-sidebar').parentElement;
    expect(mainDiv).toHaveClass('flex');
    expect(mainDiv).toHaveClass('h-screen');
    expect(mainDiv).toHaveClass('overflow-hidden');
    expect(mainDiv).toHaveClass('bg-background');

    const mainContentArea = screen.getByTestId('mock-mobile-header').parentElement;
    expect(mainContentArea).toHaveClass('flex');
    expect(mainContentArea).toHaveClass('flex-col');
    expect(mainContentArea).toHaveClass('flex-1');
    expect(mainContentArea).toHaveClass('overflow-hidden');

    const mainElement = screen.getByTestId('mock-outlet').parentElement;
    expect(mainElement).toHaveClass('flex-1');
    expect(mainElement).toHaveClass('overflow-y-auto');
  });
});
