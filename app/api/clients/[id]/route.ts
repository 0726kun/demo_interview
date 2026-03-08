import { NextRequest } from "next/server";
import { getClientById } from "@/lib/server/store";

type Params = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  { params }: Params
) {
  const { id } = await params;
  const client = getClientById(id);
  if (!client) return Response.json(null, { status: 404 });
  return Response.json(client);
}
