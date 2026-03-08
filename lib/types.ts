/**
 * 基金产品类型（题目要求：股票型/债券型/混合型等）
 */
export type ProductType = "股票型" | "债券型" | "混合型" | "货币型" | "指数型";

/**
 * 产品状态（题目要求：募集中/运作中/已清盘等）
 */
export type ProductStatus = "募集中" | "运作中" | "已清盘" | "封闭期";

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  /** 最新净值 */
  nav: number;
  /** 成立规模（亿元） */
  scale: number;
  status: ProductStatus;
  /** 成立日，便于排序与展示 */
  establishedAt: string;
}

export interface Client {
  id: string;
  name: string;
  /** 如：某机构 / 高净值个人 */
  contact?: string;
  phone?: string;
}

/**
 * 客户-产品持有关系（多对多）
 * 支持查询：某客户持有哪些产品、某产品被哪些客户持有
 */
export interface Holding {
  clientId: string;
  productId: string;
  /** 持有份额（万份），可选，用于后续图表等 */
  amount?: number;
}

/**
 * 客户跟进记录（题目示例：2025-03-01，电话沟通，讨论了XX产品认购意向）
 */
export interface FollowUp {
  id: string;
  clientId: string;
  date: string;
  method: string;
  content: string;
}
