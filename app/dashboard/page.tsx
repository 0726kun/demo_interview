"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getDashboard } from "@/lib/api";
import type { Product, Holding, Client, FollowUp } from "@/lib/types";

/** 按产品类型汇总规模（亿元） */
function aggregateScaleByType(products: Product[]) {
  const map = new Map<string, number>();
  for (const p of products) {
    map.set(p.type, (map.get(p.type) ?? 0) + p.scale);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

/** 按产品状态统计数量 */
function countByStatus(products: Product[]) {
  const map = new Map<string, number>();
  for (const p of products) {
    map.set(p.status, (map.get(p.status) ?? 0) + 1);
  }
  const order = ["运作中", "募集中", "封闭期", "已清盘"];
  return order
    .filter((s) => map.has(s))
    .map((name) => ({ name, count: map.get(name) ?? 0 }));
}

/** 产品规模 Top N（亿元） */
function productScaleTopN(products: Product[], n: number) {
  return [...products]
    .sort((a, b) => b.scale - a.scale)
    .slice(0, n)
    .map((p) => ({ name: p.name, scale: p.scale }));
}

/** 客户持有产品数 Top N */
function topHoldingsByClient(holdings: Holding[], clients: Client[], n: number) {
  const countByClient = new Map<string, number>();
  for (const h of holdings) {
    countByClient.set(h.clientId, (countByClient.get(h.clientId) ?? 0) + 1);
  }
  const clientNames = new Map(clients.map((c) => [c.id, c.name]));
  return Array.from(countByClient.entries())
    .map(([clientId, count]) => ({
      name: clientNames.get(clientId) ?? clientId,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

/** 被持有次数最多的产品 Top N */
function topProductsByHoldings(holdings: Holding[], products: Product[], n: number) {
  const countByProduct = new Map<string, number>();
  for (const h of holdings) {
    countByProduct.set(h.productId, (countByProduct.get(h.productId) ?? 0) + 1);
  }
  const productNames = new Map(products.map((p) => [p.id, p.name]));
  return Array.from(countByProduct.entries())
    .map(([productId, count]) => ({
      name: productNames.get(productId) ?? productId,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

/** 跟进方式分布 */
function followUpsByMethod(followUps: FollowUp[]) {
  const map = new Map<string, number>();
  for (const f of followUps) {
    map.set(f.method, (map.get(f.method) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

const PIE_COLORS = [
  "var(--accent)",
  "var(--success)",
  "#58a6ff",
  "var(--warning)",
  "#bc8cff",
];

const BAR_COLORS: Record<string, string> = {
  运作中: "var(--success)",
  募集中: "var(--accent)",
  封闭期: "#58a6ff",
  已清盘: "var(--muted)",
};

const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--card-border)",
  borderRadius: "8px",
  color: "var(--foreground)",
};

function ChartCard({
  id,
  title,
  desc,
  children,
}: {
  id: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 sm:p-6"
      aria-labelledby={id}
    >
      <h2
        id={id}
        className="font-display text-lg font-semibold text-[var(--foreground)]"
      >
        {title}
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">{desc}</p>
      <div className="mt-4 h-[260px] w-full">{children}</div>
    </section>
  );
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(({ products: p, holdings: h, clients: c, followUps: f }) => {
        setProducts(p);
        setHoldings(h);
        setClients(c);
        setFollowUps(f ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const scaleByType = aggregateScaleByType(products);
  const statusCounts = countByStatus(products);
  const scaleTop6 = productScaleTopN(products, 6);
  const topClients = topHoldingsByClient(holdings, clients, 8);
  const topProducts = topProductsByHoldings(holdings, products, 6);
  const methodDistribution = followUpsByMethod(followUps);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          数据概览
        </h1>
        <div className="mt-12 flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        数据概览
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        产品、客户、持有与跟进多维度统计，便于销售把握业务全貌
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {/* 1. 按产品类型的规模占比 */}
        <ChartCard
          id="chart-type-scale"
          title="按产品类型的规模占比（亿元）"
          desc="各类型在管规模，便于分配推广重点"
        >
          {scaleByType.length === 0 ? (
            <div className="flex h-full items-center justify-center text-[var(--muted)] text-sm">
              暂无产品数据
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={scaleByType}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={80}
                  paddingAngle={2}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {scaleByType.map((_, i) => (
                    <Cell
                      key={scaleByType[i].name}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                      stroke="var(--card)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [`${value} 亿元`, "规模"]}
                  labelFormatter={(name) => name}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* 2. 按产品状态的数量 */}
        <ChartCard
          id="chart-status-count"
          title="按产品状态的数量"
          desc="运作中 / 募集中 / 已清盘等分布，了解在售结构"
        >
          {statusCounts.length === 0 ? (
            <div className="flex h-full items-center justify-center text-[var(--muted)] text-sm">
              暂无产品数据
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statusCounts}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--muted)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--card-border)" }}
                  tickLine={{ stroke: "var(--card-border)" }}
                />
                <YAxis
                  tick={{ fill: "var(--muted)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--card-border)" }}
                  tickLine={{ stroke: "var(--card-border)" }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [value, "产品数"]}
                  labelFormatter={(name) => name}
                />
                <Bar
                  dataKey="count"
                  fill="var(--accent)"
                  radius={[4, 4, 0, 0]}
                  name="产品数"
                >
                  {statusCounts.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={BAR_COLORS[entry.name] ?? "var(--accent)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* 3. 产品规模 Top 6 */}
        <ChartCard
          id="chart-scale-top"
          title="产品规模 Top 6（亿元）"
          desc="规模最大的产品，重点维护与续作"
        >
          {scaleTop6.length === 0 ? (
            <div className="flex h-full items-center justify-center text-[var(--muted)] text-sm">
              暂无产品数据
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={scaleTop6}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <XAxis
                  type="number"
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--card-border)" }}
                  tickLine={{ stroke: "var(--card-border)" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={70}
                  tick={{ fill: "var(--foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [value, "规模(亿)"]}
                  labelFormatter={(name) => name}
                />
                <Bar
                  dataKey="scale"
                  fill="#58a6ff"
                  radius={[0, 4, 4, 0]}
                  name="规模"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* 4. 客户持有产品数 Top 8 */}
        <ChartCard
          id="chart-client-holdings"
          title="客户持有产品数 Top 8"
          desc="持有产品多的客户，适合深度维护或交叉销售"
        >
          {topClients.length === 0 ? (
            <div className="flex h-full items-center justify-center text-[var(--muted)] text-sm">
              暂无持有数据
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topClients}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <XAxis
                  type="number"
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--card-border)" }}
                  tickLine={{ stroke: "var(--card-border)" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={72}
                  tick={{ fill: "var(--foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [value, "持有产品数"]}
                  labelFormatter={(name) => name}
                />
                <Bar
                  dataKey="count"
                  fill="var(--accent)"
                  radius={[0, 4, 4, 0]}
                  name="持有产品数"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* 5. 被持有最多的产品 Top 6 */}
        <ChartCard
          id="chart-product-holders"
          title="被持有最多的产品 Top 6"
          desc="客户覆盖最广的产品，可作主推或案例"
        >
          {topProducts.length === 0 ? (
            <div className="flex h-full items-center justify-center text-[var(--muted)] text-sm">
              暂无持有数据
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topProducts}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--card-border)" }}
                  tickLine={{ stroke: "var(--card-border)" }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--card-border)" }}
                  tickLine={{ stroke: "var(--card-border)" }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [value, "持有客户数"]}
                  labelFormatter={(name) => name}
                />
                <Bar
                  dataKey="count"
                  fill="var(--success)"
                  radius={[4, 4, 0, 0]}
                  name="持有客户数"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* 6. 跟进方式分布 */}
        <ChartCard
          id="chart-follow-method"
          title="跟进方式分布"
          desc="电话 / 面访 / 微信等占比，了解触达方式偏好"
        >
          {methodDistribution.length === 0 ? (
            <div className="flex h-full items-center justify-center text-[var(--muted)] text-sm">
              暂无跟进记录
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={methodDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={75}
                  paddingAngle={2}
                  label={({ name, value }) => `${name} ${value}`}
                >
                  {methodDistribution.map((_, i) => (
                    <Cell
                      key={methodDistribution[i].name}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                      stroke="var(--card)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [value, "次"]}
                  labelFormatter={(name) => name}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
