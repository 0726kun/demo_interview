import { NextRequest } from "next/server";
import {
  getAllProducts,
  getAllClients,
  getHoldersByProductId,
  getHoldingsByClientId,
} from "@/lib/server/store";
import type { Product, Client } from "@/lib/types";

const MODEL = "qwen-turbo";
const BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
const API_KEY = "sk-17e0d4f5076e4f279683eeb6cb38b077";

function findClientByName(clients: Client[], name: string): Client | undefined {
  const n = name.replace(/\s/g, "");
  return clients.find(
    (c) =>
      c.name.includes(name) ||
      c.name.replace(/\s/g, "").includes(n) ||
      n.includes(c.name.replace(/\s/g, ""))
  );
}

function findProductByName(products: Product[], name: string): Product | undefined {
  return products.find((p) => p.name.includes(name) || name.includes(p.name));
}

function extractJsonFromResponse(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = codeBlock ? codeBlock[1].trim() : trimmed;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {

  let body: { message?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "请求体应为 JSON，且包含 message 字段" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return Response.json({ error: "message 不能为空" }, { status: 400 });
  }

  const products = getAllProducts();
  const clients = getAllClients();
  const clientNames = clients.map((c) => c.name).join("、");
  const productNames = products.map((p) => p.name).join("、");

  const systemPrompt = `你是渠道销售工作台的智能助手。根据用户输入，只输出一个 JSON 对象，不要其他文字。

可选类型与字段：
1. 查某产品被谁持有：{"type":"holders_of_product","productName":"产品名"}
2. 查某客户持有哪些产品（可限定类型）：{"type":"holdings_of_client","clientName":"客户名","productType":"股票型|债券型|混合型|货币型|指数型"（可选）}
3. 根据描述生成跟进建议：{"type":"follow_up","clientName":"客户名","method":"电话|面访|微信|邮件","content":"跟进内容摘要","date":"YYYY-MM-DD"}
4. 打开数据概览：{"type":"navigate_dashboard"}

当前客户名单：${clientNames}
当前产品名单：${productNames}

若无法判断意图，返回：{"type":"unknown"}

只输出上述 JSON，不要 markdown 标记。`;

  const chatUrl = `${BASE_URL.replace(/\/$/, "")}/chat/completions`;
  let res: Response;
  try {
    res = await fetch(chatUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 500,
      }),
    });
  } catch (e) {
    return Response.json(
      { error: `调用 LLM 失败：${e instanceof Error ? e.message : "网络错误"}` },
      { status: 502 }
    );
  }

  if (!res.ok) {
    const errText = await res.text();
    return Response.json(
      { error: `LLM 返回异常 ${res.status}: ${errText.slice(0, 200)}` },
      { status: 502 }
    );
  }

  let data: { choices?: Array<{ message?: { content?: string } }> };
  try {
    data = await res.json();
  } catch {
    return Response.json({ error: "LLM 响应解析失败" }, { status: 502 });
  }

  const content = data.choices?.[0]?.message?.content ?? "";
  const intent = extractJsonFromResponse(content);

  let replyContent = "";
  let followUpAction: {
    clientId: string;
    clientName: string;
    date: string;
    method: string;
    content: string;
  } | undefined;
  let navigatePath: string | undefined;

  const type = intent?.type as string | undefined;

  try {
    switch (type) {
      case "holders_of_product": {
        const productName = String(intent?.productName ?? "").trim();
        const product = findProductByName(products, productName);
        if (!product) {
          replyContent = `未找到名为「${productName}」的产品。`;
          break;
        }
        const holders = getHoldersByProductId(product.id);
        replyContent =
          holders.length === 0
            ? `产品「${product.name}」当前暂无持有客户。`
            : `产品「${product.name}」的持有客户共 ${holders.length} 位：\n${holders.map((c) => `· ${c.name}${c.contact ? `（${c.contact}）` : ""}`).join("\n")}`;
        break;
      }

      case "holdings_of_client": {
        const clientName = String(intent?.clientName ?? "").trim();
        const productType = intent?.productType as string | undefined;
        const client = findClientByName(clients, clientName);
        if (!client) {
          replyContent = `未找到客户「${clientName}」。`;
          break;
        }
        const holdings = getHoldingsByClientId(client.id);
        const list = productType ? holdings.filter((p) => p.type === productType) : holdings;
        if (list.length === 0) {
          replyContent = productType
            ? `客户「${client.name}」当前未持有${productType}产品。`
            : `客户「${client.name}」当前暂无持有产品。`;
        } else {
          replyContent = productType
            ? `客户「${client.name}」持有的${productType}产品共 ${list.length} 只：\n${list.map((p) => `· ${p.name}（净值 ${p.nav}，规模 ${p.scale} 亿）`).join("\n")}`
            : `客户「${client.name}」持有产品共 ${list.length} 只：\n${list.map((p) => `· ${p.name}（${p.type}，净值 ${p.nav}）`).join("\n")}`;
        }
        break;
      }

      case "follow_up": {
        const clientName = String(intent?.clientName ?? "").trim();
        const client = findClientByName(clients, clientName);
        const date =
          (intent?.date as string)?.slice(0, 10) || new Date().toISOString().slice(0, 10);
        const method = (intent?.method as string) || "电话";
        // LLM 常返回空 content，此时用用户原话作为跟进内容
        const rawContent = String(intent?.content ?? "").trim();
        const contentStr = (rawContent || message).slice(0, 500);
        if (!client) {
          replyContent = `未找到客户「${clientName}」，无法生成跟进建议。`;
          break;
        }
        replyContent = `已为「${client.name}」生成一条跟进建议，请点击「填入跟进表单」在客户详情中保存。`;
        followUpAction = {
          clientId: client.id,
          clientName: client.name,
          date,
          method,
          content: contentStr,
        };
        break;
      }

      case "navigate_dashboard":
        replyContent = "正在打开数据概览页…";
        navigatePath = "/dashboard";
        break;

      default:
        replyContent =
          "你好！我是渠道工作台的智能助手，可以为你做这些事：\n\n· **查客户持仓**：如「张总持有哪些债券型产品」\n· **查产品持有人**：如「稳健增长一号被谁持有」\n· **生成跟进建议**：描述沟通内容，如「今天和李总电话聊了半小时，他对稳健增长一号有兴趣，打算下周认购 50 万」\n· **打开数据概览**：说「打开数据概览」即可\n\n直接说你的需求就行。";
    }
  } catch (e) {
    replyContent = `处理结果时出错：${e instanceof Error ? e.message : "未知错误"}`;
  }

  return Response.json({
    content: replyContent,
    followUpAction: followUpAction ?? undefined,
    navigatePath,
  });
}
