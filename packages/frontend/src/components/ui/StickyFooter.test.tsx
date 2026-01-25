import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, type Mock, beforeEach } from "vitest";
import { StickyFooter } from "./StickyFooter";
import { useInView } from "react-intersection-observer";

vi.mock("react-intersection-observer", () => ({
  useInView: vi.fn(),
}));

describe("StickyFooter", () => {
  beforeEach(() => {
    (useInView as unknown as Mock).mockReturnValue({
      ref: vi.fn(),
      inView: true,
    });
  });

  it("renders children correctly", () => {
    render(
      <StickyFooter>
        <button>Save</button>
      </StickyFooter>,
    );
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("applies sticky positioning classes", () => {
    const { container } = render(
      <StickyFooter className="custom-class">Content</StickyFooter>,
    );
    // StickyFooter returns a Fragment, so we search for the sticky div
    const footer = container.querySelector(".sticky");
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass("bottom-0");
    expect(footer).toHaveClass("bg-card");
    expect(footer).toHaveClass("custom-class");
  });

  it("applies shadow when stuck (not in view)", () => {
    (useInView as unknown as Mock).mockReturnValue({
      ref: vi.fn(),
      inView: false, // Stuck means sentinel is NOT visible (scrolled past bottom)
    });

    const { container } = render(<StickyFooter>Content</StickyFooter>);
    const footer = container.querySelector(".sticky");
    expect(footer).toHaveClass("shadow-[0_-5px_10px_-2px_rgba(0,0,0,0.1)]");
    expect(footer).toHaveClass("border-t-transparent");
  });

  it("does not apply shadow when docked (in view)", () => {
    (useInView as unknown as Mock).mockReturnValue({
      ref: vi.fn(),
      inView: true, // Docked means sentinel IS visible
    });

    const { container } = render(<StickyFooter>Content</StickyFooter>);
    const footer = container.querySelector(".sticky");
    expect(footer).toHaveClass("shadow-none");
    expect(footer).not.toHaveClass("shadow-[0_-5px_10px_-2px_rgba(0,0,0,0.1)]");
  });
});
