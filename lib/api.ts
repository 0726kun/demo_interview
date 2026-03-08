/**
 * 前端数据层：通过 Next.js API 路由请求服务端数据，不直接引用 mock 数据。
 * 仅用于在客户端组件中调用（fetch 同源 /api/...）。
 */
import type { Product, Client, Holding, FollowUp } from "./types";

function getOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, getOrigin());
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== "") url.searchParams.set(k, v);
    });
  }
  const res = await fetch(url.toString());
  if (res.status === 404) return null as T;
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const url = getOrigin() + path;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

/** 产品列表，支持按类型、状态筛选和名称搜索 */
export async function getProducts(params?: {
  type?: Product["type"];
  status?: Product["status"];
  search?: string;
}): Promise<Product[]> {
  const q: Record<string, string> = {};
  if (params?.type) q.type = params.type;
  if (params?.status) q.status = params.status;
  if (params?.search != null) q.search = params.search;
  return get<Product[]>("/api/products", q);
}

/** 单个产品详情（按 id） */
export async function getProductById(id: string): Promise<Product | null> {
  return get<Product | null>(`/api/products/${id}`);
}

/** 客户列表 */
export async function getClients(params?: { search?: string }): Promise<Client[]> {
  return get<Client[]>("/api/clients", { search: params?.search ?? "" });
}

/** 单个客户详情 */
export async function getClientById(id: string): Promise<Client | null> {
  return get<Client | null>(`/api/clients/${id}`);
}

/** 某客户持有的产品（产品详情列表） */
export async function getHoldingsByClientId(clientId: string): Promise<Product[]> {
  return get<Product[]>(`/api/clients/${clientId}/holdings`);
}

/** 某产品被哪些客户持有（客户详情列表） */
export async function getHoldersByProductId(productId: string): Promise<Client[]> {
  return get<Client[]>(`/api/products/${productId}/holders`);
}

/** 某客户的跟进记录列表 */
export async function getFollowUpsByClientId(clientId: string): Promise<FollowUp[]> {
  return get<FollowUp[]>(`/api/clients/${clientId}/follow-ups`);
}

/** 新增跟进记录（提交到服务端，同进程内持久化到内存） */
export async function addFollowUp(
  clientId: string,
  data: { date: string; method: string; content: string }
): Promise<FollowUp> {
  return post<FollowUp>(`/api/clients/${clientId}/follow-ups`, data);
}

/** Dashboard 一次拉取：产品、客户、持有关系、跟进记录（供图表统计用） */
export async function getDashboard(): Promise<{
  products: Product[];
  clients: Client[];
  holdings: Holding[];
  followUps: FollowUp[];
}> {
  return get("/api/dashboard");
}

/** 全量产品（供 Dashboard 等统计用） */
export async function getAllProducts(): Promise<Product[]> {
  const data = await getDashboard();
  return data?.products ?? [];
}

/** 全量客户（供 Dashboard 等统计用） */
export async function getAllClients(): Promise<Client[]> {
  const data = await getDashboard();
  return data?.clients ?? [];
}

/** 全量持有关系（供 Dashboard 等统计用） */
export async function getAllHoldings(): Promise<Holding[]> {
  const data = await getDashboard();
  return data?.holdings ?? [];
}

/** 全量跟进记录（供 Dashboard 等统计用） */
export async function getAllFollowUps(): Promise<FollowUp[]> {
  const data = await getDashboard();
  return data?.followUps ?? [];
}
