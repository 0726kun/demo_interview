import { NextRequest } from "next/server";
import { getHoldersByProductId } from "@/lib/server/store";

type Params = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  { params }: Params
) {
  const { id } = await params;
  const holders = getHoldersByProductId(id);
  return Response.json(holders);
}
