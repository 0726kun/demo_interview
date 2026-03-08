import { NextRequest } from "next/server";
import { getProductById } from "@/lib/server/store";

type Params = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  { params }: Params
) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) return Response.json(null, { status: 404 });
  return Response.json(product);
}
