// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "../alert";
import { Badge, badgeVariants } from "../badge";

describe("feedback components", () => {
  it("renders alert slots with alert role", () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Transaksi ditolak</AlertTitle>
        <AlertDescription>Kartu belum terdaftar.</AlertDescription>
        <AlertAction>Retry</AlertAction>
      </Alert>,
    );

    expect(screen.getByRole("alert")).toHaveAttribute("data-slot", "alert");
    expect(screen.getByText("Transaksi ditolak")).toHaveAttribute(
      "data-slot",
      "alert-title",
    );
    expect(screen.getByText("Kartu belum terdaftar.")).toHaveAttribute(
      "data-slot",
      "alert-description",
    );
    expect(screen.getByText("Retry")).toHaveAttribute("data-slot", "alert-action");
  });

  it("renders badge variants", () => {
    render(<Badge variant="outline">OUT</Badge>);

    expect(screen.getByText("OUT")).toHaveTextContent("OUT");
    expect(badgeVariants({ variant: "destructive" })).toContain("text-destructive");
  });
});
