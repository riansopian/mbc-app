// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Input } from "../input";
import { Label } from "../label";
import { Textarea } from "../textarea";

describe("form controls", () => {
  it("associates label and input", () => {
    render(
      <div>
        <Label htmlFor="member-id">Member ID</Label>
        <Input id="member-id" defaultValue="MBC001" />
      </div>,
    );

    const input = screen.getByLabelText("Member ID");

    expect(input).toHaveAttribute("data-slot", "input");
    expect(input).toHaveValue("MBC001");
  });

  it("renders textarea with pass-through attributes", () => {
    render(<Textarea aria-label="Payload" readOnly value="encrypted" />);

    const textarea = screen.getByLabelText("Payload");

    expect(textarea).toHaveAttribute("data-slot", "textarea");
    expect(textarea).toHaveValue("encrypted");
    expect(textarea).toHaveAttribute("readonly");
  });
});
