import { ChevronRight, LogOut, UserRound } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { TelkomselMark } from "../shared/brand";
import { LanguageFlag } from "../shared/language-flag";
import type { AppLocale, UserRole } from "../logic/types";
import { uiText } from "../i18n/ui-text";

export function AppHeader({
  activeRole,
  locale,
  onFocusLogin,
  onToggleLocale,
}: {
  activeRole: UserRole | null;
  locale: AppLocale;
  onFocusLogin: () => void;
  onToggleLocale: () => void;
}) {
  const text = uiText[locale];

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/96 shadow-[0_6px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:h-24 sm:px-6 lg:px-8">
        <TelkomselMark />
        <div className="flex items-center gap-3">
          <a
            href={activeRole ? "/" : "#role-login"}
            className={cn(
              buttonVariants({ variant: activeRole ? "outline" : "default" }),
              "h-12 min-w-24 rounded-full px-4 text-sm sm:h-14 sm:min-w-52 sm:text-lg",
            )}
            onClick={(event) => {
              if (activeRole) {
                return;
              }

              event.preventDefault();
              onFocusLogin();
            }}
          >
            {activeRole ? (
              <>
                <LogOut className="h-4 w-4" />
                {text.logout}
              </>
            ) : (
              <>
                <UserRound className="h-4 w-4" />
                {text.login}
              </>
            )}
          </a>
          <Button
            variant="outline"
            className="h-12 shrink-0 gap-2 rounded-full border-slate-200 px-4 text-[#001a41] sm:h-14"
            onClick={onToggleLocale}
            title={text.languageTitle}
            aria-label={text.languageTitle}
          >
            <LanguageFlag locale={locale} />
            {text.languageLabel}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
