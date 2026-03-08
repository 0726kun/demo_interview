import { NextRequest } from "next/server";
import { getFollowUpsByClientId, addFollowUp } from "@/lib/server/store";

type Params = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  { params }: Params
) {
  const { id } = await params;
  const list = getFollowUpsByClientId(id);
  return Response.json(list);
}

export async function POST(
  request: NextRequest,
  { params }: Params
) {
  const { id: clientId } = await params;
  const body = await request.json();
  const { date, method, content } = body as { date?: string; method?: string; content?: string };
  if (!date || !content || typeof date !== "string" || typeof content !== "string") {
    return Response.json(
      { error: "缺少 date 或 content，或类型不正确" },
      { status: 400 }
    );
  }
  const followUp = addFollowUp(clientId, {
    date,
    method: typeof method === "string" ? method : "电话",
    content,
  });
  return Response.json(followUp, { status: 201 });
}
