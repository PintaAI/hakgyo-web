import { getKelasDetail } from "@/app/actions/kelas/detail";
import KelasDetailPage from "@/components/kelas/kelas-detail-page";
import { notFound } from "next/navigation";
import { SessionProvider } from "@/components/session-provider";

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface KelasDetailProps {
  params: Promise<{ id: string }>;
}

export default async function KelasDetail({ params }: KelasDetailProps) {
  const { id } = await params;
  const result = await getKelasDetail(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <SessionProvider>
      <KelasDetailPage kelas={result.data} />
    </SessionProvider>
  );
}
