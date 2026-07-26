import { serverFetch } from "@/lib/server-api";
import ContractDetailManager from "./ContractDetailManager";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contract = await serverFetch(`/api/finance/contracts/${id}/`);
  return <ContractDetailManager initialContract={contract} />;
}
