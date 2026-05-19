// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Separator } from "../separator";
import { Switch } from "../switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../tooltip";

describe("interactive UI primitives", () => {
  it("renders tabs with active content", () => {
    render(
      <Tabs defaultValue="station">
        <TabsList>
          <TabsTrigger value="station">Station</TabsTrigger>
          <TabsTrigger value="gate">Gate</TabsTrigger>
        </TabsList>
        <TabsContent value="station">Station panel</TabsContent>
        <TabsContent value="gate">Gate panel</TabsContent>
      </Tabs>,
    );

    expect(screen.getByText("Station")).toHaveAttribute("data-slot", "tabs-trigger");
    expect(screen.getByText("Station panel")).toHaveAttribute(
      "data-slot",
      "tabs-content",
    );
  });

  it("renders switch and separator slots", () => {
    render(
      <div>
        <Switch aria-label="Simulation mode" size="sm" defaultChecked />
        <Separator orientation="vertical" data-testid="separator" />
      </div>,
    );

    expect(screen.getByRole("switch", { name: "Simulation mode" })).toHaveAttribute(
      "data-slot",
      "switch",
    );
    expect(screen.getByTestId("separator")).toHaveAttribute(
      "data-slot",
      "separator",
    );
  });

  it("renders tooltip trigger children", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Help</TooltipTrigger>
          <TooltipContent>More info</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    expect(screen.getByText("Help")).toHaveAttribute("data-slot", "tooltip-trigger");
  });
});
