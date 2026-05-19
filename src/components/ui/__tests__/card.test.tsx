// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../card";

describe("Card", () => {
  it("renders card composition slots", () => {
    render(
      <Card size="sm" data-testid="card">
        <CardHeader>
          <CardTitle>Balance</CardTitle>
          <CardDescription>Latest card balance</CardDescription>
          <CardAction>Action</CardAction>
        </CardHeader>
        <CardContent>Rp50.000</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );

    expect(screen.getByTestId("card")).toHaveAttribute("data-slot", "card");
    expect(screen.getByTestId("card")).toHaveAttribute("data-size", "sm");
    expect(screen.getByText("Balance")).toHaveAttribute("data-slot", "card-title");
    expect(screen.getByText("Latest card balance")).toHaveAttribute(
      "data-slot",
      "card-description",
    );
    expect(screen.getByText("Action")).toHaveAttribute("data-slot", "card-action");
    expect(screen.getByText("Rp50.000")).toHaveAttribute("data-slot", "card-content");
    expect(screen.getByText("Footer")).toHaveAttribute("data-slot", "card-footer");
  });
});
