import type { MembershipCardService } from "@/lib/mbc/service";
import type { OperationResult } from "@/lib/mbc/types";

export type Feedback = {
  tone: "success" | "error" | "neutral";
  title: string;
  message: string;
};

export type NfcIssueDialogContent = {
  title: string;
  message: string;
  helper?: string;
};

export type UserRole = "ADMIN" | "GATE" | "TERMINAL" | "MEMBER";
export type AppMode = "station" | "gate" | "terminal" | "scout";
export type AppLocale = "id" | "en";

export type RoleOption = {
  role: UserRole;
  title: string;
  description: string;
  defaultMode: AppMode;
  allowedModes: AppMode[];
};

export type MutationRunner = (
  operation: (targetService: MembershipCardService) => Promise<OperationResult>,
) => void;
