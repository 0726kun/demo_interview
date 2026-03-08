import { NextRequest } from "next/server";
import { getProducts } from "@/lib/server/store";
import type { ProductType, ProductStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as ProductType | null;
  const status = searchParams.get("status") as ProductStatus | null;
  const search = searchParams.get("search") ?? undefined;
  const list = getProducts({
    type: type ?? undefined,
    status: status ?? undefined,
    search,
  });
  return Response.json(list);
}
