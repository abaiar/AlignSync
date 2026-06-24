"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  LifeBuoy,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

type AfterSalesStatus =
  | "pending"
  | "processing"
  | "resolved"
  | "closed"
  | "rejected";

interface AfterSalesDetail {
  id: number;
  ticket_no: string;
  type: string;
  category: string;
  item_sn: string;
  device_id: string | number | null;
  title: string;
  description: string;
  status: AfterSalesStatus;
  created_at: string;
  updated_at?: string;
  handler_name?: string | null;
  handled_at?: string | null;
  resolution?: string | null;
}

interface ApiErrorShape {
  response?: { data?: { detail?: unknown } };
}

function extractError(err: unknown, fallback: string): string {
  const apiErr = err as ApiErrorShape;
  const detail = apiErr?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object") {
    try {
      return JSON.stringify(detail);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "待处理",
  processing: "处理中",
  resolved: "已解决",
  closed: "已关闭",
  rejected: "已拒绝",
};

function statusTone(
  status: string,
): "warning" | "info" | "success" | "muted" | "danger" {
  switch (status) {
    case "pending":
      return "warning";
    case "processing":
      return "info";
    case "resolved":
      return "success";
    case "closed":
      return "muted";
    case "rejected":
      return "danger";
    default:
      return "muted";
  }
}

const TYPE_LABEL: Record<string, string> = {
  camera_repair: "返修",
  camera_replace: "更换",
  camera_return: "退货",
  software_upgrade: "升级",
  software_reactivate: "重新激活",
  software_replace: "更换",
  software_return: "退货",
};

const CATEGORY_LABEL: Record<string, string> = {
  camera: "相机",
  software: "软件",
};

function deriveCategory(type: string): string {
  if (type.startsWith("camera_")) return "camera";
  if (type.startsWith("software_")) return "software";
  return type;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("zh-CN", { hour12: false });
  } catch {
    return iso;
  }
}

const HANDLE_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "processing", label: "处理中" },
  { value: "resolved", label: "已解决" },
  { value: "closed", label: "已关闭" },
  { value: "rejected", label: "已拒绝" },
];

const textareaClass =
  "w-full rounded border border-border bg-surface-elevated px-3 py-2 font-sans text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40";

const selectClass =
  "h-9 rounded border border-border bg-surface-elevated px-3 font-sans text-sm text-fg-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40";

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

export default function AfterSalesDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [ticket, setTicket] = useState<AfterSalesDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle form state
  const [handleStatus, setHandleStatus] = useState("processing");
  const [resolution, setResolution] = useState("");
  const [handling, setHandling] = useState(false);
  const [handleSuccess, setHandleSuccess] = useState<string | null>(null);
  const [handleError, setHandleError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchTicket() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<AfterSalesDetail>(
          `/api/after-sales/${params.id}`,
        );
        if (!cancelled) setTicket(data);
      } catch {
        if (!cancelled) setError("加载工单详情失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchTicket();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const canHandle =
    hasPermission("after_sales:handle") &&
    ticket !== null &&
    (ticket.status === "pending" || ticket.status === "processing");

  async function handleHandleSubmit(e: FormEvent) {
    e.preventDefault();
    setHandleError(null);
    setHandleSuccess(null);
    if (!resolution.trim()) {
      setHandleError("请输入处理说明");
      return;
    }
    setHandling(true);
    try {
      const { data } = await api.patch<AfterSalesDetail>(
        `/api/after-sales/${params.id}/handle`,
        {
          status: handleStatus,
          resolution: resolution.trim(),
        },
      );
      setTicket(data);
      setHandleSuccess("工单已处理");
      setResolution("");
    } catch (err) {
      setHandleError(extractError(err, "处理失败，请重试"));
    } finally {
      setHandling(false);
    }
  }

  const category = ticket
    ? ticket.category || deriveCategory(ticket.type)
    : "";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="售后工单详情"
        description={`工单 #${params.id}`}
        actions={
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
        }
      />

      {loading ? (
        <Card>
          <div className="flex items-center justify-center gap-2 py-16 font-mono text-xs uppercase tracking-widest text-fg-muted">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            加载中…
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="flex items-center gap-2 border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
            <Button variant="secondary" onClick={() => router.back()}>
              返回列表
            </Button>
          </div>
        </Card>
      ) : ticket ? (
        <div className="flex flex-col gap-6">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DetailRow label="工单号">
                <span className="font-mono">{ticket.ticket_no || `#${ticket.id}`}</span>
              </DetailRow>
              <DetailRow label="类型">
                {TYPE_LABEL[ticket.type] ?? ticket.type}
              </DetailRow>
              <DetailRow label="类别">
                {CATEGORY_LABEL[category] ?? category}
              </DetailRow>
              <DetailRow label="物品SN">
                <span className="font-mono">{ticket.item_sn || "—"}</span>
              </DetailRow>
              {ticket.device_id !== null &&
                ticket.device_id !== undefined &&
                ticket.device_id !== "" && (
                  <DetailRow label="设备ID">
                    <span className="font-mono">{String(ticket.device_id)}</span>
                  </DetailRow>
                )}
              <DetailRow label="状态">
                <Badge tone={statusTone(ticket.status)}>
                  {STATUS_LABEL[ticket.status] ?? ticket.status}
                </Badge>
              </DetailRow>
              <DetailRow label="创建时间">
                <span className="font-mono text-xs">
                  {formatDate(ticket.created_at)}
                </span>
              </DetailRow>
            </CardContent>
          </Card>

          {/* Issue details */}
          <Card>
            <CardHeader>
              <CardTitle>问题描述</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
                  标题
                </p>
                <p className="mt-1 text-base font-medium text-fg-primary">
                  {ticket.title || "—"}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
                  描述
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-fg-secondary">
                  {ticket.description || "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Handler info */}
          {(ticket.handler_name || ticket.handled_at || ticket.resolution) && (
            <Card>
              <CardHeader>
                <CardTitle>处理信息</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {ticket.handler_name && (
                  <DetailRow label="处理人">
                    {ticket.handler_name}
                  </DetailRow>
                )}
                {ticket.handled_at && (
                  <DetailRow label="处理时间">
                    <span className="font-mono text-xs">
                      {formatDate(ticket.handled_at)}
                    </span>
                  </DetailRow>
                )}
                {ticket.resolution && (
                  <div className="px-4 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
                      处理说明
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-fg-secondary">
                      {ticket.resolution}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Handle form */}
          {canHandle && (
            <Card>
              <CardHeader>
                <CardTitle>处理工单</CardTitle>
              </CardHeader>
              <CardContent>
                {handleSuccess && (
                  <div className="mb-4 flex items-start gap-2 border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{handleSuccess}</span>
                  </div>
                )}
                {handleError && (
                  <div className="mb-4 flex items-start gap-2 border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{handleError}</span>
                  </div>
                )}
                <form
                  onSubmit={handleHandleSubmit}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                      处理状态
                    </label>
                    <select
                      value={handleStatus}
                      onChange={(e) => setHandleStatus(e.target.value)}
                      className={selectClass}
                    >
                      {HANDLE_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                      处理说明
                    </label>
                    <textarea
                      className={cn(textareaClass, "min-h-[140px]")}
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="说明处理过程、原因或解决方案"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={handling}>
                      {handling ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          提交中…
                        </>
                      ) : (
                        "提交处理"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {ticket.status !== "pending" &&
            ticket.status !== "processing" &&
            !ticket.handler_name &&
            !ticket.resolution && (
              <div className="flex items-center justify-center gap-2 py-6 font-mono text-xs uppercase tracking-widest text-fg-muted">
                <LifeBuoy className="h-4 w-4" />
                工单已结束
              </div>
            )}
        </div>
      ) : null}
    </div>
  );
}
