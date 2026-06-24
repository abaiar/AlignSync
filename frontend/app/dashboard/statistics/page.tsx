"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ClipboardList,
  Wallet,
  Cpu,
  Truck,
  RotateCcw,
  Camera,
  KeyRound,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import api from "@/lib/api";

interface ByMonth {
  month: string;
  purchase: number;
  production: number;
  shipment: number;
  return: number;
}

interface ByEnterprise {
  enterprise_id: number;
  name: string;
  purchase: number;
  production: number;
  shipment: number;
}

interface ByProduct {
  product_model: string;
  quantity: number;
  amount: number;
}

interface SummaryResponse {
  purchase_count: number;
  purchase_amount: number;
  production_count: number;
  shipment_count: number;
  return_count: number;
  camera_count: number;
  software_lock_count: number;
  by_month: ByMonth[];
  by_enterprise: ByEnterprise[];
  by_product: ByProduct[];
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "amber" | "blue" | "green" | "red" | "muted";
}

const TONE_TEXT: Record<StatCardProps["tone"], string> = {
  amber: "text-accent",
  blue: "text-info",
  green: "text-success",
  red: "text-danger",
  muted: "text-fg-secondary",
};

function StatCard({ label, value, icon: Icon, tone }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
            {label}
          </p>
          <Icon className={`h-4 w-4 ${TONE_TEXT[tone]}`} />
        </div>
        <p className="font-display text-3xl font-extrabold tabular-nums text-fg-primary">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

const CHART_COLORS = {
  purchase: "#f59e0b",
  production: "#58a6ff",
  shipment: "#3fb950",
  return: "#f85149",
};

const GRID_STROKE = "#30363d";
const AXIS_STROKE = "#8b949e";

const TOOLTIP_STYLE = {
  backgroundColor: "#161b22",
  border: `1px solid ${GRID_STROKE}`,
  borderRadius: "4px",
  fontSize: "12px",
  color: "#e6edf3",
};

function formatNumber(n: number): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("zh-CN");
}

function formatAmount(n: number): string {
  if (n === null || n === undefined) return "—";
  return `¥${n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function defaultDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 11);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

export default function StatisticsPage() {
  const { start: defaultStart, end: defaultEnd } = defaultDateRange();
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [productModel, setProductModel] = useState("");
  const [enterpriseId, setEnterpriseId] = useState("");
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        start_date: startDate,
        end_date: endDate,
      };
      if (productModel.trim()) params.product_model = productModel.trim();
      if (enterpriseId.trim()) params.enterprise_id = enterpriseId.trim();
      const { data } = await api.get<SummaryResponse>(
        "/api/statistics/summary",
        { params },
      );
      setSummary(data);
    } catch {
      setError("加载统计数据失败，请重试");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, productModel, enterpriseId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const monthData = summary?.by_month ?? [];
  const enterpriseData = summary?.by_enterprise ?? [];
  const productData = summary?.by_product ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="统计汇总"
        description="生产协同关键指标汇总 — 支持按时间、产品型号、企业筛选。"
        actions={
          <Button variant="secondary" onClick={fetchSummary} title="刷新">
            <RefreshCw className="h-4 w-4" />
            刷新
          </Button>
        }
      />

      {/* Filter bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="开始日期"
            name="start_date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="结束日期"
            name="end_date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Input
            label="产品型号"
            name="product_model"
            value={productModel}
            onChange={(e) => setProductModel(e.target.value)}
            placeholder="可选"
          />
          <Input
            label="企业ID"
            name="enterprise_id"
            value={enterpriseId}
            onChange={(e) => setEnterpriseId(e.target.value)}
            placeholder="可选"
          />
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={fetchSummary} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                查询中…
              </>
            ) : (
              "查询"
            )}
          </Button>
        </div>
      </Card>

      {error && (
        <div className="flex items-start gap-2 border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !summary ? (
        <Card>
          <div className="flex items-center justify-center gap-2 py-16 font-mono text-xs uppercase tracking-widest text-fg-muted">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            加载中…
          </div>
        </Card>
      ) : summary ? (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-7">
            <StatCard
              label="采购订单数"
              value={formatNumber(summary.purchase_count)}
              icon={ClipboardList}
              tone="amber"
            />
            <StatCard
              label="采购总额"
              value={formatAmount(summary.purchase_amount)}
              icon={Wallet}
              tone="amber"
            />
            <StatCard
              label="生产设备数"
              value={formatNumber(summary.production_count)}
              icon={Cpu}
              tone="blue"
            />
            <StatCard
              label="发货数"
              value={formatNumber(summary.shipment_count)}
              icon={Truck}
              tone="green"
            />
            <StatCard
              label="退货数"
              value={formatNumber(summary.return_count)}
              icon={RotateCcw}
              tone="red"
            />
            <StatCard
              label="相机数"
              value={formatNumber(summary.camera_count)}
              icon={Camera}
              tone="muted"
            />
            <StatCard
              label="软件锁数"
              value={formatNumber(summary.software_lock_count)}
              icon={KeyRound}
              tone="muted"
            />
          </div>

          {/* Monthly chart */}
          <Card>
            <CardHeader>
              <CardTitle>月度趋势</CardTitle>
            </CardHeader>
            <CardContent>
              {monthData.length === 0 ? (
                <div className="flex items-center justify-center py-12 font-mono text-xs uppercase tracking-widest text-fg-muted">
                  暂无月度数据
                </div>
              ) : (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthData}
                      margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
                    >
                      <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="month"
                        stroke={AXIS_STROKE}
                        tick={{ fill: AXIS_STROKE, fontSize: 12 }}
                        tickLine={{ stroke: GRID_STROKE }}
                        axisLine={{ stroke: GRID_STROKE }}
                      />
                      <YAxis
                        stroke={AXIS_STROKE}
                        tick={{ fill: AXIS_STROKE, fontSize: 12 }}
                        tickLine={{ stroke: GRID_STROKE }}
                        axisLine={{ stroke: GRID_STROKE }}
                      />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        cursor={{ fill: "rgba(245, 158, 11, 0.05)" }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 12, color: AXIS_STROKE }}
                      />
                      <Bar dataKey="purchase" name="采购" fill={CHART_COLORS.purchase} />
                      <Bar dataKey="production" name="生产" fill={CHART_COLORS.production} />
                      <Bar dataKey="shipment" name="发货" fill={CHART_COLORS.shipment} />
                      <Bar dataKey="return" name="退货" fill={CHART_COLORS.return} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bottom row: enterprise + product tables */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* By enterprise */}
            <Card>
              <CardHeader>
                <CardTitle>企业汇总</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {enterpriseData.length === 0 ? (
                  <div className="flex items-center justify-center py-12 font-mono text-xs uppercase tracking-widest text-fg-muted">
                    暂无企业数据
                  </div>
                ) : (
                  <Table>
                    <THead>
                      <tr>
                        <TH>企业</TH>
                        <TH className="text-right">采购</TH>
                        <TH className="text-right">生产</TH>
                        <TH className="text-right">发货</TH>
                      </tr>
                    </THead>
                    <TBody>
                      {enterpriseData.map((row) => (
                        <TR key={row.enterprise_id}>
                          <TD>
                            <span className="font-medium">{row.name || `#${row.enterprise_id}`}</span>
                          </TD>
                          <TD className="text-right font-mono tabular-nums">
                            {formatNumber(row.purchase)}
                          </TD>
                          <TD className="text-right font-mono tabular-nums">
                            {formatNumber(row.production)}
                          </TD>
                          <TD className="text-right font-mono tabular-nums">
                            {formatNumber(row.shipment)}
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* By product */}
            <Card>
              <CardHeader>
                <CardTitle>产品汇总</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {productData.length === 0 ? (
                  <div className="flex items-center justify-center py-12 font-mono text-xs uppercase tracking-widest text-fg-muted">
                    暂无产品数据
                  </div>
                ) : (
                  <Table>
                    <THead>
                      <tr>
                        <TH>产品型号</TH>
                        <TH className="text-right">数量</TH>
                        <TH className="text-right">金额</TH>
                      </tr>
                    </THead>
                    <TBody>
                      {productData.map((row, idx) => (
                        <TR key={`${row.product_model}-${idx}`}>
                          <TD className="font-mono text-sm">{row.product_model || "—"}</TD>
                          <TD className="text-right font-mono tabular-nums">
                            {formatNumber(row.quantity)}
                          </TD>
                          <TD className="text-right font-mono tabular-nums">
                            {formatAmount(row.amount)}
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
