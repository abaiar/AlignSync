"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Download,
  Loader2,
  AlertTriangle,
  Cpu,
  KeyRound,
  Camera,
  ClipboardList,
  ScanLine,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import api from "@/lib/api";

interface TraceabilityDevice {
  device_sn: string;
  device_name: string;
  model: string;
  assembled_by: string | null;
  assembled_at: string | null;
}

interface TraceabilitySoftwareLock {
  lock_id: string;
  software_version: string;
  function_version: string;
  expire_date: string;
  status: string;
}

interface TraceabilityCamera {
  sn: string;
  model: string;
  position_label: string;
  intrinsics: unknown;
  extrinsics: unknown;
}

interface TraceabilityPurchaseOrder {
  order_no: string;
  order_type: string;
  status: string;
  total_amount: number;
  created_at: string;
}

interface TraceabilityResult {
  device: TraceabilityDevice;
  software_lock: TraceabilitySoftwareLock | null;
  cameras: TraceabilityCamera[];
  purchase_orders: TraceabilityPurchaseOrder[];
}

interface ApiErrorShape {
  response?: { data?: { detail?: unknown }; status?: number };
  message?: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("zh-CN", { hour12: false });
  } catch {
    return iso;
  }
}

function formatDateOnly(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("zh-CN");
  } catch {
    return iso;
  }
}

function formatMoney(v: number): string {
  return `¥${(v ?? 0).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function lockStatusTone(
  status: string,
): "success" | "info" | "warning" | "danger" | "muted" {
  switch (status) {
    case "active":
    case "authorized":
      return "success";
    case "pending":
      return "warning";
    case "expired":
      return "danger";
    case "revoked":
      return "muted";
    default:
      return "info";
  }
}

function lockStatusLabel(status: string): string {
  const map: Record<string, string> = {
    active: "有效",
    authorized: "已授权",
    pending: "待激活",
    expired: "已过期",
    revoked: "已吊销",
  };
  return map[status] ?? status;
}

function orderStatusTone(
  status: string,
): "success" | "info" | "warning" | "danger" | "muted" {
  switch (status) {
    case "paid":
    case "completed":
      return "success";
    case "confirmed":
    case "shipped":
      return "info";
    case "pending":
    case "awaiting_payment":
    case "draft":
      return "warning";
    case "rejected":
      return "danger";
    default:
      return "muted";
  }
}

function orderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: "草稿",
    pending: "待确认",
    confirmed: "已确认",
    rejected: "已驳回",
    awaiting_payment: "待付款",
    paid: "已付款",
    shipped: "已发货",
    completed: "已完成",
  };
  return map[status] ?? status;
}

function orderTypeLabel(orderType: string): string {
  const map: Record<string, string> = {
    camera: "相机采购",
    software: "软件采购",
  };
  return map[orderType] ?? orderType;
}

function summarizeCalibration(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>);
    return `${keys.length} 项`;
  }
  return String(value).slice(0, 24);
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0">
      <span className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
        {label}
      </span>
      <span className="text-sm text-fg-primary">{children}</span>
    </div>
  );
}

function StepBadge({ step }: { step: string }) {
  return (
    <span className="flex h-6 w-6 items-center justify-center border border-accent/40 bg-accent/10 font-mono text-[10px] font-bold text-accent">
      {step}
    </span>
  );
}

function Connector() {
  return (
    <div className="flex justify-center py-1">
      <div className="h-6 w-px bg-border" />
    </div>
  );
}

function TraceabilityContent() {
  const searchParams = useSearchParams();
  const [deviceSn, setDeviceSn] = useState(
    searchParams.get("device_sn") || "",
  );
  const [cameraSn, setCameraSn] = useState(
    searchParams.get("camera_sn") || "",
  );
  const [lockId, setLockId] = useState(
    searchParams.get("software_lock_id") || "",
  );
  const [result, setResult] = useState<TraceabilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searched, setSearched] = useState(false);
  const [exporting, setExporting] = useState(false);

  const doSearch = useCallback(
    async (sn: string, cam: string, lock: string) => {
      if (!sn && !cam && !lock) {
        setError("请至少填写一个查询条件");
        return;
      }
      setLoading(true);
      setError(null);
      setNotFound(false);
      setResult(null);
      try {
        const params: Record<string, string> = {};
        if (sn) params.device_sn = sn;
        if (cam) params.camera_sn = cam;
        if (lock) params.software_lock_id = lock;
        const { data } = await api.get<TraceabilityResult>(
          "/api/traceability",
          { params },
        );
        setResult(data);
        setSearched(true);
      } catch (err) {
        const apiErr = err as ApiErrorShape;
        const status = apiErr?.response?.status;
        if (status === 404) {
          setNotFound(true);
          setSearched(true);
        } else {
          const detail = apiErr?.response?.data?.detail;
          setError(
            typeof detail === "string" ? detail : "查询失败，请重试",
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Auto-search on mount if URL params present
  useEffect(() => {
    const sn = searchParams.get("device_sn");
    const cam = searchParams.get("camera_sn");
    const lock = searchParams.get("software_lock_id");
    if (sn || cam || lock) {
      doSearch(sn || "", cam || "", lock || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch() {
    doSearch(deviceSn.trim(), cameraSn.trim(), lockId.trim());
  }

  async function handleExport() {
    if (!result) return;
    setExporting(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (deviceSn) params.device_sn = deviceSn;
      if (cameraSn) params.camera_sn = cameraSn;
      if (lockId) params.software_lock_id = lockId;
      const { data } = await api.get("/api/traceability/export", { params });
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `traceability-${
        deviceSn || cameraSn || lockId || "report"
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const apiErr = err as ApiErrorShape;
      const detail = apiErr?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "导出失败，请重试");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="设备追溯"
        description="按设备SN、相机SN或软件锁ID查询全链路追溯信息。"
        actions={
          result ? (
            <Button
              variant="secondary"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              导出报告
            </Button>
          ) : null
        }
      />

      {/* Search form */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="设备SN"
              name="device_sn"
              value={deviceSn}
              onChange={(e) => setDeviceSn(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="输入设备序列号"
            />
          </div>
          <div className="flex-1">
            <Input
              label="相机SN"
              name="camera_sn"
              value={cameraSn}
              onChange={(e) => setCameraSn(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="输入相机序列号"
            />
          </div>
          <div className="flex-1">
            <Input
              label="软件锁ID"
              name="software_lock_id"
              value={lockId}
              onChange={(e) => setLockId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="输入软件锁ID"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            查询
          </Button>
        </div>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-fg-muted">
          {"// 任选其一查询条件"}
        </p>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <Card>
          <div className="flex items-center justify-center gap-2 py-16 font-mono text-xs uppercase tracking-widest text-fg-muted">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            查询中…
          </div>
        </Card>
      )}

      {/* Not found */}
      {!loading && !error && notFound && (
        <Card>
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-fg-muted">
            <ScanLine className="h-8 w-8" />
            <p className="font-mono text-sm uppercase tracking-widest">
              未找到追溯信息
            </p>
            <p className="text-xs text-fg-muted">
              请检查查询条件是否正确，或该设备/相机/软件锁尚未建立追溯记录。
            </p>
          </div>
        </Card>
      )}

      {/* Results — visual chain */}
      {!loading && !error && result && (
        <div className="flex flex-col">
          {/* Step 01: Device info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <StepBadge step="01" />
                <CardTitle>设备信息</CardTitle>
              </div>
              <Cpu className="h-4 w-4 text-fg-muted" />
            </CardHeader>
            <CardContent className="p-0">
              <DetailRow label="设备SN">
                <span className="font-mono">{result.device.device_sn}</span>
              </DetailRow>
              <DetailRow label="设备名称">
                {result.device.device_name || "—"}
              </DetailRow>
              <DetailRow label="型号">
                {result.device.model || "—"}
              </DetailRow>
              <DetailRow label="组装人">
                {result.device.assembled_by || "—"}
              </DetailRow>
              <DetailRow label="组装时间">
                <span className="font-mono text-xs">
                  {formatDate(result.device.assembled_at)}
                </span>
              </DetailRow>
            </CardContent>
          </Card>

          <Connector />

          {/* Step 02: Software lock + Cameras */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Software lock */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <StepBadge step="02" />
                  <CardTitle>软件锁</CardTitle>
                </div>
                <KeyRound className="h-4 w-4 text-fg-muted" />
              </CardHeader>
              <CardContent className="p-0">
                {result.software_lock ? (
                  <>
                    <DetailRow label="锁ID">
                      <span className="font-mono">
                        {result.software_lock.lock_id}
                      </span>
                    </DetailRow>
                    <DetailRow label="软件版本">
                      {result.software_lock.software_version || "—"}
                    </DetailRow>
                    <DetailRow label="功能版本">
                      {result.software_lock.function_version || "—"}
                    </DetailRow>
                    <DetailRow label="到期日">
                      <span className="font-mono text-xs">
                        {formatDateOnly(result.software_lock.expire_date)}
                      </span>
                    </DetailRow>
                    <DetailRow label="状态">
                      <Badge
                        tone={lockStatusTone(result.software_lock.status)}
                      >
                        {lockStatusLabel(result.software_lock.status)}
                      </Badge>
                    </DetailRow>
                  </>
                ) : (
                  <p className="px-4 py-6 text-center font-mono text-xs uppercase tracking-widest text-fg-muted">
                    未绑定软件锁
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Cameras */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <StepBadge step="02" />
                  <CardTitle>相机列表</CardTitle>
                </div>
                <Camera className="h-4 w-4 text-fg-muted" />
              </CardHeader>
              <CardContent className="p-0">
                {result.cameras && result.cameras.length > 0 ? (
                  <ul className="divide-y divide-border">
                    {result.cameras.map((cam, idx) => (
                      <li key={`${cam.sn}-${idx}`} className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="font-mono text-sm text-fg-primary">
                              {cam.sn}
                            </p>
                            <p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
                              {cam.model || "—"} · 内参{" "}
                              {summarizeCalibration(cam.intrinsics)} · 外参{" "}
                              {summarizeCalibration(cam.extrinsics)}
                            </p>
                          </div>
                          <Badge tone="info">{cam.position_label}</Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-6 text-center font-mono text-xs uppercase tracking-widest text-fg-muted">
                    未绑定相机
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Connector />

          {/* Step 03: Purchase orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <StepBadge step="03" />
                <CardTitle>采购订单</CardTitle>
              </div>
              <ClipboardList className="h-4 w-4 text-fg-muted" />
            </CardHeader>
            <CardContent className="p-0">
              {result.purchase_orders && result.purchase_orders.length > 0 ? (
                <ul className="divide-y divide-border">
                  {result.purchase_orders.map((order, idx) => (
                    <li
                      key={`${order.order_no}-${idx}`}
                      className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-sm text-fg-primary">
                          {order.order_no}
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
                          {orderTypeLabel(order.order_type)} ·{" "}
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge tone={orderStatusTone(order.status)}>
                          {orderStatusLabel(order.status)}
                        </Badge>
                        <span className="font-mono text-sm font-semibold tabular-nums text-accent">
                          {formatMoney(order.total_amount)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-6 text-center font-mono text-xs uppercase tracking-widest text-fg-muted">
                  无关联采购订单
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Initial state hint */}
      {!loading && !error && !result && !notFound && !searched && (
        <Card>
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-fg-muted">
            <Search className="h-8 w-8" />
            <p className="font-mono text-xs uppercase tracking-widest">
              输入查询条件开始追溯
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function TraceabilityPage() {
  return (
    <Suspense fallback={null}>
      <TraceabilityContent />
    </Suspense>
  );
}
