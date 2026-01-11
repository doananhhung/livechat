import type { NavigationEntry, VisitorSessionMetadata } from '@live-chat/shared-types';

const SESSION_STORAGE_KEY = 'visitor_session_history';
const MAX_HISTORY_LENGTH = 50;
const SENSITIVE_QUERY_PARAMS = ['token', 'password', 'secret', 'auth'];

class HistoryTracker {
  private metadata: VisitorSessionMetadata;
  private isInitialized = false;

  constructor() {
    this.metadata = this.loadFromSessionStorage() || {
      referrer: null,
      landingPage: window.location.href, // Default, will be updated on init
      urlHistory: [],
    };
  }

  /**
   * Initializes the history tracker.
   * Captures the initial referrer and landing page if not already set in sessionStorage.
   * Loads existing history from sessionStorage.
   */
  public init(): void {
    if (this.isInitialized) {
      return;
    }

    // Attempt to load from session storage first
    const storedMetadata = this.loadFromSessionStorage();

    if (storedMetadata) {
      this.metadata = storedMetadata;
      // Ensure landingPage is set if it was null (e.g. from an old session)
      if (!this.metadata.landingPage) {
        this.metadata.landingPage = this.getSanitizedUrl(window.location.href);
      }
    } else {
      // First time initialization in this session
      this.metadata.referrer = this.getSanitizedReferrer(document.referrer);
      this.metadata.landingPage = this.getSanitizedUrl(window.location.href);
      this.push(window.location.href, document.title); // Add current page as first entry
    }

    this.isInitialized = true;
    this.saveToSessionStorage(); // Persist initial or loaded state
  }

  /**
   * Adds a new URL entry to the history.
   * Sanitizes the URL and ensures the history length does not exceed the limit.
   * @param url The URL to add.
   * @param title The title of the page.
   */
  public push(url: string, title: string): void {
    const sanitizedUrl = this.getSanitizedUrl(url);

    // Only add if it's a new URL or different from the last one to avoid duplicates on soft navigation
    if (this.metadata.urlHistory.length > 0 && 
        this.metadata.urlHistory[this.metadata.urlHistory.length - 1].url === sanitizedUrl) {
      // If the URL is the same but the title changed, update the title
      if (this.metadata.urlHistory[this.metadata.urlHistory.length - 1].title !== title) {
        this.metadata.urlHistory[this.metadata.urlHistory.length - 1].title = title;
        this.saveToSessionStorage();
      }
      return;
    }

    const newEntry: NavigationEntry = {
      url: sanitizedUrl,
      title: title || sanitizedUrl, // Use URL if title is empty
      timestamp: new Date().toISOString(),
    };

    this.metadata.urlHistory.push(newEntry);

    // Maintain FIFO limit
    if (this.metadata.urlHistory.length > MAX_HISTORY_LENGTH) {
      this.metadata.urlHistory.shift();
    }
    this.saveToSessionStorage();
  }

  /**
   * Returns the current visitor session metadata.
   * @returns The current VisitorSessionMetadata object.
   */
  public getMetadata(): VisitorSessionMetadata {
    // Return a deep copy to prevent external modification
    return JSON.parse(JSON.stringify(this.metadata));
  }

  /**
   * Clears the history tracker's state from memory and sessionStorage.
   */
  public clear(): void {
    this.metadata = {
      referrer: null,
      landingPage: window.location.href,
      urlHistory: [],
    };
    this.isInitialized = false;
    this.removeFromSessionStorage();
  }

  /**
   * Sanitizes a URL by removing sensitive query parameters.
   * @param url The URL string to sanitize.
   * @returns The sanitized URL string.
   */
  private getSanitizedUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      SENSITIVE_QUERY_PARAMS.forEach(param => urlObj.searchParams.delete(param));
      return urlObj.toString();
    } catch (error) {
      console.error('HistoryTracker: Error sanitizing URL:', error);
      return url; // Return original URL if parsing fails
    }
  }

  /**
   * Sanitizes the referrer string.
   * @param referrer The referrer string.
   * @returns The sanitized referrer string or null if empty/invalid.
   */
  private getSanitizedReferrer(referrer: string): string | null {
    if (!referrer) return null;
    try {
      const referrerUrl = new URL(referrer);
      SENSITIVE_QUERY_PARAMS.forEach(param => referrerUrl.searchParams.delete(param));
      return referrerUrl.toString();
    } catch (error) {
      console.error('HistoryTracker: Error sanitizing referrer URL:', error);
      return referrer; // Return original if invalid
    }
  }

  /**
   * Loads visitor session metadata from sessionStorage.
   * @returns Loaded metadata or null if not found/parse error.
   */
  private loadFromSessionStorage(): VisitorSessionMetadata | null {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as VisitorSessionMetadata;
      }
    } catch (error) {
      console.error('HistoryTracker: Error loading from sessionStorage:', error);
      this.removeFromSessionStorage(); // Clear corrupted data
    }
    return null;
  }

  /**
   * Saves current visitor session metadata to sessionStorage.
   */
  private saveToSessionStorage(): void {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.metadata));
    } catch (error) {
      console.error('HistoryTracker: Error saving to sessionStorage:', error);
      // Fail silently as per design (core chat must not break)
    }
  }

  /**
   * Removes visitor session metadata from sessionStorage.
   */
  private removeFromSessionStorage(): void {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      console.error('HistoryTracker: Error removing from sessionStorage:', error);
    }
  }
}

export const historyTracker = new HistoryTracker();
