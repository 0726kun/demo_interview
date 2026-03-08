import {
  getAllProducts,
  getAllClients,
  getAllHoldings,
  getAllFollowUps,
} from "@/lib/server/store";

export async function GET() {
  const [products, clients, holdings, followUps] = await Promise.all([
    Promise.resolve(getAllProducts()),
    Promise.resolve(getAllClients()),
    Promise.resolve(getAllHoldings()),
    Promise.resolve(getAllFollowUps()),
  ]);
  return Response.json({ products, clients, holdings, followUps });
}
