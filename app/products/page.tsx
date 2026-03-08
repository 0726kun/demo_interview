import { getProducts } from "@/lib/server/store";
import { ProductsView } from "@/components/ProductsView";

/** 产品货架：服务端取首屏数据，客户端负责筛选与详情抽屉 */
export default async function ProductsPage() {
  const initialProducts = getProducts();
  return <ProductsView initialProducts={initialProducts} />;
}
