// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Button, buttonVariants } from "../button";

describe("Button", () => {
  it("renders a native button with default variant classes", () => {
    render(<Button>Submit</Button>);

    const button = screen.getByRole("button", { name: "Submit" });

    expect(button).toHaveAttribute("data-slot", "button");
    expect(button).toHaveClass("bg-primary");
    expect(button).toHaveClass("h-11");
  });

  it("supports variants, sizes, custom classes, and click handlers", async () => {
    const onClick = vi.fn();

    render(
      <Button
        variant="outline"
        size="sm"
        className="extra-class"
        onClick={onClick}
      >
        Edit
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Edit" });
    button.click();

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button).toHaveClass("border-primary");
    expect(button).toHaveClass("h-9");
    expect(button).toHaveClass("extra-class");
  });

  it("exposes reusable variant classes for links", () => {
    expect(buttonVariants({ variant: "link" })).toContain("text-primary");
  });
});
