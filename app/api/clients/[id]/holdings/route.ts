import { NextRequest } from "next/server";
import { getHoldingsByClientId } from "@/lib/server/store";

type Params = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  { params }: Params
) {
  const { id } = await params;
  const holdings = getHoldingsByClientId(id);
  return Response.json(holdings);
}
