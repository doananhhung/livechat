
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { historyTracker } from './historyTracker';
import type { VisitorSessionMetadata } from '@live-chat/shared-types';

describe('HistoryTracker', () => {
  const SESSION_KEY = 'visitor_session_history';

  beforeEach(() => {
    // Mock sessionStorage
    const store: Record<string, string> = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      store[key] = value;
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
      delete store[key];
    });
    
    // Clear instance state
    historyTracker.clear();
    
    // Mock window location
    Object.defineProperty(window, 'location', {
        value: {
            href: 'http://localhost:3000/home',
        },
        writable: true
    });
    
    // Mock document referrer
    Object.defineProperty(document, 'referrer', {
        value: 'http://google.com',
        configurable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('init() should capture referrer and landing page on first load', () => {
    historyTracker.init();
    
    const metadata = historyTracker.getMetadata();
    expect(metadata.referrer).toBe('http://google.com/');
    expect(metadata.landingPage).toBe('http://localhost:3000/home');
    expect(metadata.urlHistory).toHaveLength(1);
    expect(metadata.urlHistory[0].url).toBe('http://localhost:3000/home');
  });

  it('init() should load existing metadata from sessionStorage', () => {
    const existingMetadata: VisitorSessionMetadata = {
      referrer: 'http://twitter.com',
      landingPage: 'http://localhost:3000/blog',
      urlHistory: [
        { url: 'http://localhost:3000/blog', title: 'Blog', timestamp: new Date().toISOString() }
      ]
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(existingMetadata));

    historyTracker.init();
    
    const metadata = historyTracker.getMetadata();
    expect(metadata.referrer).toBe('http://twitter.com');
    expect(metadata.landingPage).toBe('http://localhost:3000/blog');
  });

  it('push() should add new URL and trim to limit', () => {
    historyTracker.init();
    
    // Simulate 55 pushes
    for (let i = 0; i < 55; i++) {
        historyTracker.push(`http://localhost:3000/page/${i}`, `Page ${i}`);
    }

    const metadata = historyTracker.getMetadata();
    expect(metadata.urlHistory).toHaveLength(50);
    // Should contain the last 50, so starting from index 5
    expect(metadata.urlHistory[0].url).toContain('/page/5');
    expect(metadata.urlHistory[49].url).toContain('/page/54');
  });

  it('push() should sanitize sensitive query params', () => {
    historyTracker.init();
    
    const sensitiveUrl = 'http://localhost:3000/reset?token=secret123&auth=abc';
    historyTracker.push(sensitiveUrl, 'Reset');

    const metadata = historyTracker.getMetadata();
    const lastEntry = metadata.urlHistory[metadata.urlHistory.length - 1];
    
    expect(lastEntry.url).toBe('http://localhost:3000/reset');
    expect(lastEntry.url).not.toContain('token');
  });

  it('push() should update title if URL matches last entry', () => {
    historyTracker.init();
    historyTracker.push('http://localhost:3000/page1', 'Loading...');
    historyTracker.push('http://localhost:3000/page1', 'Page 1 Loaded');

    const metadata = historyTracker.getMetadata();
    expect(metadata.urlHistory).toHaveLength(2); // Initial init + 1 unique push
    
    const lastEntry = metadata.urlHistory[metadata.urlHistory.length - 1];
    expect(lastEntry.title).toBe('Page 1 Loaded');
  });
});
