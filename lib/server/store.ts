/**
 * 服务端数据层：仅被 app/api 的 Route Handler 引用，不在客户端打包。
 * 内存存储，重启后新增的跟进会丢失；产品/客户/持有关系为只读初始数据。
 */
import type { Product, Client, Holding, FollowUp } from "@/lib/types";
import {
  MOCK_PRODUCTS,
  MOCK_CLIENTS,
  MOCK_HOLDINGS,
  MOCK_FOLLOW_UPS,
} from "@/lib/mock-data";

const products = [...MOCK_PRODUCTS];
const clients = [...MOCK_CLIENTS];
const holdings = [...MOCK_HOLDINGS];
const followUps: FollowUp[] = [...MOCK_FOLLOW_UPS];

export function getProducts(params?: {
  type?: Product["type"];
  status?: Product["status"];
  search?: string;
}): Product[] {
  let list = [...products];
  if (params?.type) list = list.filter((p) => p.type === params.type);
  if (params?.status) list = list.filter((p) => p.status === params.status);
  if (params?.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q));
  }
  return list;
}

export function getProductById(id: string): Product | null {
  return products.find((p) => p.id === id) ?? null;
}

export function getClients(params?: { search?: string }): Client[] {
  let list = [...clients];
  if (params?.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.contact?.toLowerCase().includes(q) ?? false)
    );
  }
  return list;
}

export function getClientById(id: string): Client | null {
  return clients.find((c) => c.id === id) ?? null;
}

export function getHoldingsByClientId(clientId: string): Product[] {
  const productIds = holdings.filter((h) => h.clientId === clientId).map((h) => h.productId);
  return products.filter((p) => productIds.includes(p.id));
}

export function getHoldersByProductId(productId: string): Client[] {
  const clientIds = holdings.filter((h) => h.productId === productId).map((h) => h.clientId);
  return clients.filter((c) => clientIds.includes(c.id));
}

export function getFollowUpsByClientId(clientId: string): FollowUp[] {
  return followUps
    .filter((f) => f.clientId === clientId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function addFollowUp(
  clientId: string,
  data: { date: string; method: string; content: string }
): FollowUp {
  const newOne: FollowUp = {
    id: `f${Date.now()}`,
    clientId,
    date: data.date,
    method: data.method,
    content: data.content,
  };
  followUps.push(newOne);
  return newOne;
}

export function getAllProducts(): Product[] {
  return [...products];
}

export function getAllClients(): Client[] {
  return [...clients];
}

export function getAllHoldings(): Holding[] {
  return [...holdings];
}

export function getAllFollowUps(): FollowUp[] {
  return [...followUps];
}
