import { Skeleton } from "@/components/ui/skeleton";

export function InfoTile({
  label,
  value,
  loading = false,
}: {
  label: string;
  value: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-5">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      {loading ? (
        <Skeleton className="mt-3 h-5 w-32 rounded-full" />
      ) : (
        <p className="mt-2 break-words text-lg font-extrabold text-[#001a41]">
          {value}
        </p>
      )}
    </div>
  );
}
