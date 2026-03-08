import { getClients } from "@/lib/server/store";
import { ClientsView } from "@/components/ClientsView";

/** 客户管理：服务端取首屏数据，客户端负责搜索与详情抽屉 */
export default async function ClientsPage() {
  const initialClients = getClients();
  return <ClientsView initialClients={initialClients} />;
}
