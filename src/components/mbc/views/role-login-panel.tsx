import { ChevronRight, CreditCard, DoorClosed, DoorOpen, Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { roleDescription, roleOptions, roleTitle } from "../logic/roles";
import type { AppLocale, UserRole } from "../logic/types";
import { uiText } from "../i18n/ui-text";

export function RoleLoginPanel({
  locale,
  onLogin,
}: {
  locale: AppLocale;
  onLogin: (role: UserRole) => void;
}) {
  const text = uiText[locale];

  return (
    <section id="role-login" className="mx-auto flex max-w-7xl items-center justify-center px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <Card className="w-full max-w-5xl bg-[#fffafb] px-1 py-8 sm:px-10 sm:py-10">
        <CardHeader className="gap-4">
          <Badge className="h-8 w-fit rounded-full bg-accent px-4 text-primary">
            {text.roleAccess}
          </Badge>
          <CardTitle className="max-w-3xl text-3xl font-black text-[#001a41] sm:text-5xl">
            {text.roleLoginTitle}
          </CardTitle>
          <CardDescription className="max-w-3xl text-[0.95rem] leading-7 sm:text-base">
            {text.roleLoginDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {roleOptions.map((option) => (
              <a
                key={option.role}
                href={`/?role=${option.role.toLowerCase()}`}
                onClick={() => onLogin(option.role)}
                className="group flex min-h-44 flex-col rounded-[22px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_rgba(237,27,47,0.12)]"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
                    <RoleIcon role={option.role} />
                  </div>
                  <Badge variant="outline" className="rounded-full border-slate-200 bg-white text-xs text-slate-500">
                    {option.defaultMode}
                  </Badge>
                </div>
                <h2 className="text-xl font-black text-[#001a41]">
                  {roleTitle(option.role, locale)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {roleDescription(option.role, locale)}
                </p>
                <div className="mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white">
                  {text.enter}
                  <ChevronRight className="h-4 w-4" />
                </div>
              </a>
            ))}
          </div>
          <p className="text-sm leading-6 text-slate-600">{text.localSessionNote}</p>
        </CardContent>
      </Card>
    </section>
  );
}

function RoleIcon({ role }: { role: UserRole }) {
  if (role === "ADMIN") {
    return <CreditCard className="h-5 w-5" />;
  }

  if (role === "GATE") {
    return <DoorOpen className="h-5 w-5" />;
  }

  if (role === "TERMINAL") {
    return <DoorClosed className="h-5 w-5" />;
  }

  return <Eye className="h-5 w-5" />;
}
