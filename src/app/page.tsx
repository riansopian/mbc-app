import { MbcApp } from "@/components/mbc-app";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; nfc?: string }>;
}) {
  const { role } = await searchParams;

  return <MbcApp initialRole={role ?? null} />;
}
