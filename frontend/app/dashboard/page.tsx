"use client";

import { ClipboardList, Cpu, Camera, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth";

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "info" | "success" | "warning" | "muted";
}

function StatCard({ label, value, icon: Icon, tone }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
            {label}
          </p>
          <p className="mt-2 font-display text-3xl font-extrabold tabular-nums text-fg-primary">
            {value}
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center border border-border bg-surface-elevated">
          <Icon className="h-4 w-4 text-accent" />
        </div>
      </CardContent>
      <div className="flex items-center justify-between border-t border-border px-4 py-2">
        <Badge tone={tone}>待接入</Badge>
        <span className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
          LIVE
        </span>
      </div>
    </Card>
  );
}

export default function DashboardHomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="统计概览"
        description="生产协同关键指标 — 数据将在后续任务中接入后端统计接口。"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="采购订单数" value="—" icon={ClipboardList} tone="info" />
        <StatCard label="设备数" value="—" icon={Cpu} tone="success" />
        <StatCard label="相机数" value="—" icon={Camera} tone="warning" />
        <StatCard label="软件锁数" value="—" icon={KeyRound} tone="muted" />
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
              请通过左侧导航访问各业务模块。
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
              {"// 业务页面将在后续任务中实现"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
