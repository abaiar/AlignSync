"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ClipboardList,
  Cpu,
  Camera,
  KeyRound,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";

interface SummaryResponse {
  purchase_count: number;
  purchase_amount: number;
  production_count: number;
  shipment_count: number;
  return_count: number;
  camera_count: number;
  software_lock_count: number;
  by_month: unknown[];
  by_enterprise: unknown[];
  by_product: unknown[];
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "info" | "success" | "warning" | "muted";
  loading?: boolean;
}

const TONE_TEXT: Record<StatCardProps["tone"], string> = {
  info: "text-info",
  success: "text-success",
  warning: "text-accent",
  muted: "text-fg-secondary",
};

function StatCard({ label, value, icon: Icon, tone, loading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
            {label}
          </p>
          <p className="mt-2 font-display text-3xl font-extrabold tabular-nums text-fg-primary">
            {loading ? "—" : value}
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center border border-border bg-surface-elevated">
          <Icon className={`h-4 w-4 ${TONE_TEXT[tone]}`} />
        </div>
      </CardContent>
      <div className="flex items-center justify-between border-t border-border px-4 py-2">
        <span
          className={`font-mono text-[10px] uppercase tracking-wider ${TONE_TEXT[tone]}`}
        >
          {loading ? "LOADING" : "LIVE"}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
          实时
        </span>
      </div>
    </Card>
  );
}

function defaultDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 11);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("zh-CN");
}

export default function DashboardHomePage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { start, end } = defaultDateRange();
      const { data } = await api.get<SummaryResponse>(
        "/api/statistics/summary",
        { params: { start_date: start, end_date: end } },
      );
      setSummary(data);
    } catch {
      setError("加载统计数据失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="统计概览"
        description="生产协同关键指标 — 数据实时来自后端统计接口。"
        actions={
          <Button
            variant="secondary"
            onClick={fetchSummary}
            title="刷新"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
            刷新
          </Button>
        }
      />

      {error && (
        <div className="flex items-start gap-2 border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="采购订单数"
          value={formatNumber(summary?.purchase_count)}
          icon={ClipboardList}
          tone="info"
          loading={loading}
        />
        <StatCard
          label="设备数"
          value={formatNumber(summary?.production_count)}
          icon={Cpu}
          tone="success"
          loading={loading}
        />
        <StatCard
          label="相机数"
          value={formatNumber(summary?.camera_count)}
          icon={Camera}
          tone="warning"
          loading={loading}
        />
        <StatCard
          label="软件锁数"
          value={formatNumber(summary?.software_lock_count)}
          icon={KeyRound}
          tone="muted"
          loading={loading}
        />
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <h2 className="font-display text-sm font-bold uppercase tracking-wider">
                欢迎使用
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-fg-secondary">
              你好，{user?.real_name || user?.username || "用户"}
              {user?.enterprise_name ? `（${user.enterprise_name}）` : ""}。
              本系统用于核心技术企业与定位仪生产厂之间的生产协同管理。
              请通过左侧导航访问各业务模块，或点击&ldquo;统计汇总&rdquo;查看完整分析报表。
            </p>
            {loading && (
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-fg-muted">
                <Loader2 className="h-3 w-3 animate-spin" />
                正在加载统计数据…
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
