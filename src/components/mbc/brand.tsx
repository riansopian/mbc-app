export function TelkomselMark() {
  return (
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
      <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[linear-gradient(135deg,#ed1b2f_0%,#ed1b2f_58%,#ffb000_58%,#ffb000_100%)] text-lg font-black text-white shadow-[0_10px_24px_rgba(237,27,47,0.25)] sm:h-11 sm:w-11 sm:text-xl">
        T
        <span className="absolute -right-1 top-2 h-3 w-3 rounded-full bg-white/90" />
      </div>
      <div className="min-w-0 leading-none">
        <div className="max-w-[150px] truncate text-xl font-black tracking-tight text-primary sm:max-w-none sm:text-3xl">
          MyTelkomsel
        </div>
        <div className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.24em] text-[#001a41]/55 sm:text-xs">
          MBC Operator
        </div>
      </div>
    </div>
  );
}
