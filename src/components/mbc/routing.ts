import type { UserRole } from "./types";
import { roleOptions } from "./roles";

export function parseRoleValue(value?: string | null): UserRole | null {
  const role = value?.replace("#role=", "").toUpperCase();

  return roleOptions.some((option) => option.role === role)
    ? (role as UserRole)
    : null;
}

export function parseNfcMode(value?: string | null) {
  return value === "physical";
}

export function buildModeHref(role: UserRole | null, physical: boolean) {
  const params = new URLSearchParams();

  if (role) {
    params.set("role", role.toLowerCase());
  }

  if (physical) {
    params.set("nfc", "physical");
  }

  const query = params.toString();

  return query ? `/?${query}` : "/";
}

export function parseAmountInput(value: string) {
  return value.trim() ? Number(value) : Number.NaN;
}
