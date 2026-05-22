import type { AppLocale } from "../logic/types";

export function LanguageFlag({ locale }: { locale: AppLocale }) {
  if (locale === "en") {
    return (
      <span
        aria-hidden="true"
        className="relative h-5 w-8 overflow-hidden rounded-[6px] bg-[#012169] shadow-inner ring-1 ring-slate-200"
      >
        <span className="absolute left-1/2 top-1/2 h-[34px] w-[5px] -translate-x-1/2 -translate-y-1/2 rotate-[58deg] bg-white" />
        <span className="absolute left-1/2 top-1/2 h-[34px] w-[5px] -translate-x-1/2 -translate-y-1/2 -rotate-[58deg] bg-white" />
        <span className="absolute left-1/2 top-1/2 h-[34px] w-[2px] -translate-x-1/2 -translate-y-1/2 rotate-[58deg] bg-[#c8102e]" />
        <span className="absolute left-1/2 top-1/2 h-[34px] w-[2px] -translate-x-1/2 -translate-y-1/2 -rotate-[58deg] bg-[#c8102e]" />
        <span className="absolute inset-y-0 left-1/2 w-[7px] -translate-x-1/2 bg-white" />
        <span className="absolute inset-x-0 top-1/2 h-[7px] -translate-y-1/2 bg-white" />
        <span className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-[#c8102e]" />
        <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-[#c8102e]" />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="relative h-5 w-8 overflow-hidden rounded-[6px] bg-white shadow-inner ring-1 ring-slate-200"
    >
      <span className="absolute inset-x-0 top-0 h-1/2 bg-primary" />
      <span className="absolute inset-x-0 bottom-0 h-1/2 bg-white" />
    </span>
  );
}
