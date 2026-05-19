// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "../table";

describe("Table", () => {
  it("renders semantic table pieces", () => {
    render(
      <Table>
        <TableCaption>Transaksi terakhir</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Tipe</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>TOPUP</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>1 item</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );

    expect(screen.getByRole("table")).toHaveAttribute("data-slot", "table");
    expect(screen.getByText("Transaksi terakhir")).toHaveAttribute(
      "data-slot",
      "table-caption",
    );
    expect(screen.getByRole("columnheader", { name: "Tipe" })).toHaveAttribute(
      "data-slot",
      "table-head",
    );
    expect(screen.getByRole("cell", { name: "TOPUP" })).toHaveAttribute(
      "data-slot",
      "table-cell",
    );
  });
});
