import { Card, CardHeader } from "@/components/ui/card";

import { TelkomselMark } from "./brand";

export function LoadingShell() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff_0%,#fff1f3_16%,#fff7f8_48%,#fff_100%)] text-foreground">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 shadow-[0_4px_18px_rgba(0,0,0,0.10)] backdrop-blur">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <TelkomselMark />
          <div className="h-14 min-w-28 rounded-full bg-primary sm:min-w-52" />
        </div>
      </header>
      <section className="mx-auto flex max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <Card className="w-full max-w-5xl bg-[#fffafb] px-2 py-10 sm:px-10">
          <CardHeader className="gap-4">
            <div className="h-8 w-28 rounded-full bg-accent" />
            <div className="h-11 w-full max-w-xl rounded-2xl bg-slate-100" />
            <div className="h-6 w-full max-w-2xl rounded-full bg-slate-100" />
          </CardHeader>
        </Card>
      </section>
    </main>
  );
}
