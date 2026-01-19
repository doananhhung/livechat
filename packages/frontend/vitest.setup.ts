// vitest.setup.ts
import "@testing-library/jest-dom";
import { vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/preact";
import "./src/i18n"; // Initialize i18n for tests

// Clean up after each test to prevent Preact internal state leakage
afterEach(() => {
  cleanup();
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Create a div with id "root" to prevent "Target container is not a DOM element" error
const root = document.createElement("div");
root.id = "root";
document.body.appendChild(root);
