import { NextRequest } from "next/server";
import { getClients } from "@/lib/server/store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const list = getClients({ search });
  return Response.json(list);
}
