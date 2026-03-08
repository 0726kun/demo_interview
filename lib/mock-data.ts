import type { Product, Client, Holding, FollowUp } from "./types";

export const MOCK_PRODUCTS: Product[] = [
  { id: "p1", name: "稳健增长一号", type: "混合型", nav: 1.234, scale: 12.5, status: "运作中", establishedAt: "2022-03-15" },
  { id: "p2", name: "纯债安心", type: "债券型", nav: 1.056, scale: 8.2, status: "运作中", establishedAt: "2021-08-01" },
  { id: "p3", name: "成长先锋", type: "股票型", nav: 0.987, scale: 5.0, status: "运作中", establishedAt: "2023-01-10" },
  { id: "p4", name: "量化精选", type: "指数型", nav: 1.112, scale: 3.8, status: "运作中", establishedAt: "2022-11-20" },
  { id: "p5", name: "现金管家", type: "货币型", nav: 1.0, scale: 25.0, status: "运作中", establishedAt: "2020-05-01" },
  { id: "p6", name: "稳健增利二号", type: "债券型", nav: 1.078, scale: 6.0, status: "运作中", establishedAt: "2023-06-01" },
  { id: "p7", name: "均衡配置", type: "混合型", nav: 1.045, scale: 4.2, status: "募集中", establishedAt: "2024-02-01" },
  { id: "p8", name: "价值回报", type: "股票型", nav: 0.956, scale: 2.1, status: "已清盘", establishedAt: "2019-09-01" },
  { id: "p9", name: "短债增强", type: "债券型", nav: 1.023, scale: 7.0, status: "运作中", establishedAt: "2023-04-15" },
];

export const MOCK_CLIENTS: Client[] = [
  { id: "c1", name: "张总", contact: "某私行", phone: "138****0001" },
  { id: "c2", name: "李总", contact: "高净值个人", phone: "139****0002" },
  { id: "c3", name: "王经理", contact: "XX 银行渠道", phone: "136****0003" },
  { id: "c4", name: "赵女士", contact: "高净值个人", phone: "137****0004" },
  { id: "c5", name: "刘总", contact: "企业客户", phone: "135****0005" },
  { id: "c6", name: "陈经理", contact: "券商渠道", phone: "134****0006" },
  { id: "c7", name: "周总", contact: "高净值个人", phone: "133****0007" },
  { id: "c8", name: "吴女士", contact: "某私行", phone: "132****0008" },
  { id: "c9", name: "郑总", contact: "企业客户", phone: "131****0009" },
];

export const MOCK_HOLDINGS: Holding[] = [
  { clientId: "c1", productId: "p1", amount: 50 },
  { clientId: "c1", productId: "p2", amount: 100 },
  { clientId: "c1", productId: "p5", amount: 200 },
  { clientId: "c2", productId: "p1", amount: 80 },
  { clientId: "c2", productId: "p3", amount: 30 },
  { clientId: "c2", productId: "p6", amount: 60 },
  { clientId: "c3", productId: "p2", amount: 500 },
  { clientId: "c3", productId: "p5", amount: 800 },
  { clientId: "c4", productId: "p4", amount: 20 },
  { clientId: "c4", productId: "p5", amount: 150 },
  { clientId: "c5", productId: "p1", amount: 200 },
  { clientId: "c5", productId: "p2", amount: 150 },
  { clientId: "c6", productId: "p3", amount: 40 },
  { clientId: "c6", productId: "p4", amount: 35 },
  { clientId: "c7", productId: "p2", amount: 120 },
  { clientId: "c7", productId: "p6", amount: 80 },
  { clientId: "c8", productId: "p5", amount: 300 },
  { clientId: "c8", productId: "p1", amount: 60 },
  { clientId: "c9", productId: "p1", amount: 100 },
  { clientId: "c9", productId: "p2", amount: 200 },
  { clientId: "c9", productId: "p9", amount: 90 },
];

export const MOCK_FOLLOW_UPS: FollowUp[] = [
  { id: "f1", clientId: "c1", date: "2025-03-01", method: "电话", content: "讨论了稳健增长一号加仓意向，预计下周确认 20 万。" },
  { id: "f2", clientId: "c1", date: "2025-02-15", method: "面访", content: "介绍了纯债安心，客户对收益曲线满意。" },
  { id: "f3", clientId: "c2", date: "2025-03-05", method: "微信", content: "对成长先锋感兴趣，打算认购 50 万，等净值回调。" },
  { id: "f4", clientId: "c3", date: "2025-03-03", method: "电话", content: "渠道季度考核沟通，下月主推现金管家+纯债安心。" },
  { id: "f5", clientId: "c4", date: "2025-02-28", method: "邮件", content: "发送了量化精选产品说明书，待回复。" },
  { id: "f6", clientId: "c5", date: "2025-03-06", method: "面访", content: "企业资金配置需求，倾向稳健增利二号与稳健增长一号。" },
  { id: "f7", clientId: "c6", date: "2025-03-02", method: "电话", content: "券商渠道培训安排，下周落地。" },
  { id: "f8", clientId: "c7", date: "2025-02-20", method: "电话", content: "咨询短债增强与纯债安心差异，已解释久期与收益特征。" },
  { id: "f9", clientId: "c8", date: "2025-03-04", method: "面访", content: "现金管家续作意向强，另对均衡配置（募集中）有兴趣。" },
  { id: "f10", clientId: "c9", date: "2025-03-01", method: "电话", content: "今天和李总电话聊了半小时，他对稳健增长一号有兴趣，打算下周认购 50 万。" },
];
