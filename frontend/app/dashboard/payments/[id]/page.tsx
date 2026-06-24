"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Download,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";

type PaymentStatus =
  | "awaiting_confirm"
  | "confirmed"
  | "pending_verify"
  | "amount_abnormal";

interface PaymentDetail {
  id: number;
  order_id: number;
  order_no?: string;
  amount: number;
  payment_method: string;
  payment_account?: string | null;
  payment_date: string;
  status: PaymentStatus;
  remark?: string | null;
  voucher_url?: string | null;
  voucher_filename?: string | null;
  created_at?: string;
}

interface ApiErrorShape {
  response?: { data?: { detail?: unknown } };
}

const STATUS_LABEL: Record<string, string> = {
  awaiting_confirm: "待确认",
  confirmed: "已确认",
  pending_verify: "待核实",
  amount_abnormal: "金额异常",
};

const STATUS_TONE: Record<string, "warning" | "success" | "muted" | "danger"> = {
  awaiting_confirm: "warning",
  confirmed: "success",
  pending_verify: "muted",
  amount_abnormal: "danger",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  bank_transfer: "银行转账",
  alipay: "支付宝",
  wechat: "微信支付",
};

const ABNORMAL_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "pending_verify", label: "待核实" },
  { value: "amount_abnormal", label: "金额异常" },
];

const selectClass =
  "h-9 rounded border border-border bg-surface-elevated px-3 font-sans text-sm text-fg-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40";

const textareaClass =
  "w-full resize-y rounded border border-border bg-surface-elevated px-3 py-2 font-sans text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40";

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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

function extractError(err: unknown, fallback: string): string {
  const apiErr = err as ApiErrorShape;
  const detail = apiErr?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  return fallback;
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(url);
}

function resolveVoucherUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
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

export default function PaymentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Confirm modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmRemark, setConfirmRemark] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Abnormal modal
  const [showAbnormalModal, setShowAbnormalModal] = useState(false);
  const [abnormalStatus, setAbnormalStatus] = useState("pending_verify");
  const [abnormalRemark, setAbnormalRemark] = useState("");

  const fetchPayment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<PaymentDetail>(
        `/api/payments/${params.id}`,
      );
      setPayment(data);
    } catch (err) {
      setError(extractError(err, "加载付款详情失败"));
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  const canConfirm = hasPermission("payment:confirm");

  async function handleConfirm() {
    setActionLoading(true);
    try {
      await api.patch(`/api/payments/${params.id}/confirm`, {
        remark: confirmRemark.trim() || undefined,
      });
      setShowConfirmModal(false);
      setConfirmRemark("");
      await fetchPayment();
    } catch (err) {
      setError(extractError(err, "确认收款失败"));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMarkAbnormal() {
    setActionLoading(true);
    try {
      await api.patch(`/api/payments/${params.id}/mark-abnormal`, {
        status: abnormalStatus,
        remark: abnormalRemark.trim() || undefined,
      });
      setShowAbnormalModal(false);
      setAbnormalRemark("");
      setAbnormalStatus("pending_verify");
      await fetchPayment();
    } catch (err) {
      setError(extractError(err, "标记异常失败"));
    } finally {
      setActionLoading(false);
    }
  }

  const showActions =
    payment?.status === "awaiting_confirm" && canConfirm;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="付款详情"
        description={`记录 #${params.id}`}
        actions={
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
        }
      />

      {error && (
        <div className="flex items-start gap-2 border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <Card>
          <div className="flex items-center justify-center gap-2 py-16 font-mono text-xs uppercase tracking-widest text-fg-muted">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            加载中…
          </div>
        </Card>
      ) : payment ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
          {/* Payment info */}
          <Card>
            <CardHeader>
              <CardTitle>付款信息</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DetailRow label="付款ID">
                <span className="font-mono">#{payment.id}</span>
              </DetailRow>
              <DetailRow label="订单ID">
                <span className="font-mono text-accent">
                  #{payment.order_id}
                </span>
                {payment.order_no && (
                  <span className="ml-2 font-mono text-xs text-fg-muted">
                    {payment.order_no}
                  </span>
                )}
              </DetailRow>
              <DetailRow label="金额">
                <span className="font-mono font-semibold tabular-nums text-accent">
                  {formatMoney(payment.amount)}
                </span>
              </DetailRow>
              <DetailRow label="付款方式">
                {PAYMENT_METHOD_LABEL[payment.payment_method] ??
                  payment.payment_method}
              </DetailRow>
              {payment.payment_account && (
                <DetailRow label="付款账号">
                  <span className="font-mono text-xs">
                    {payment.payment_account}
                  </span>
                </DetailRow>
              )}
              <DetailRow label="付款日期">
                <span className="font-mono text-xs">
                  {formatDate(payment.payment_date)}
                </span>
              </DetailRow>
              <DetailRow label="状态">
                <Badge tone={STATUS_TONE[payment.status] ?? "muted"}>
                  {STATUS_LABEL[payment.status] ?? payment.status}
                </Badge>
              </DetailRow>
              {payment.remark && (
                <DetailRow label="备注">
                  <span className="text-sm text-fg-secondary">
                    {payment.remark}
                  </span>
                </DetailRow>
              )}
            </CardContent>
          </Card>

          {/* Voucher */}
          <Card>
            <CardHeader>
              <CardTitle>付款凭证</CardTitle>
              {payment.voucher_url && (
                <FileText className="h-4 w-4 text-fg-muted" />
              )}
            </CardHeader>
            <CardContent>
              {payment.voucher_url ? (
                <div className="flex flex-col gap-3">
                  {isImageUrl(payment.voucher_url) ? (
                    <div className="overflow-hidden border border-border bg-surface-elevated">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveVoucherUrl(payment.voucher_url)}
                        alt="付款凭证"
                        className="h-auto w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 border border-border bg-surface-elevated px-4 py-3">
                      <FileText className="h-5 w-5 shrink-0 text-info" />
                      <span className="min-w-0 flex-1 truncate font-mono text-sm text-fg-primary">
                        {payment.voucher_filename || "凭证文件"}
                      </span>
                    </div>
                  )}
                  <a
                    href={resolveVoucherUrl(payment.voucher_url)}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center justify-center gap-2 rounded border border-border bg-transparent px-4 font-sans text-sm text-fg-primary transition-colors hover:bg-surface-elevated"
                  >
                    <Download className="h-4 w-4" />
                    下载凭证
                  </a>
                </div>
              ) : (
                <p className="py-8 text-center font-mono text-xs uppercase tracking-widest text-fg-muted">
                  暂无凭证
                </p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {showActions && (
            <Card className="lg:col-span-2">
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-display text-sm font-bold uppercase tracking-wider text-fg-primary">
                    操作
                  </p>
                  <p className="mt-1 text-xs text-fg-secondary">
                    确认到账或标记异常状态
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={actionLoading}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    确认收款
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setShowAbnormalModal(true)}
                    disabled={actionLoading}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    标记异常
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}

      {/* Confirm modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider">
                确认收款
              </h3>
              <button
                onClick={() => !actionLoading && setShowConfirmModal(false)}
                className="text-fg-muted hover:text-fg-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col gap-4 p-4">
              <p className="text-sm text-fg-secondary">
                确认已收到此笔付款？此操作将更新付款状态为「已确认」。
              </p>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                  备注（可选）
                </label>
                <textarea
                  value={confirmRemark}
                  onChange={(e) => setConfirmRemark(e.target.value)}
                  rows={3}
                  placeholder="填写确认备注"
                  className={textareaClass}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={actionLoading}
                >
                  取消
                </Button>
                <Button onClick={handleConfirm} disabled={actionLoading}>
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  确认收款
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Abnormal modal */}
      {showAbnormalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider">
                标记异常
              </h3>
              <button
                onClick={() => !actionLoading && setShowAbnormalModal(false)}
                className="text-fg-muted hover:text-fg-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col gap-4 p-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                  异常类型
                </label>
                <select
                  value={abnormalStatus}
                  onChange={(e) => setAbnormalStatus(e.target.value)}
                  className={selectClass}
                >
                  {ABNORMAL_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                  备注
                </label>
                <textarea
                  value={abnormalRemark}
                  onChange={(e) => setAbnormalRemark(e.target.value)}
                  rows={3}
                  placeholder="说明异常原因"
                  className={textareaClass}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowAbnormalModal(false)}
                  disabled={actionLoading}
                >
                  取消
                </Button>
                <Button
                  variant="danger"
                  onClick={handleMarkAbnormal}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  确认标记
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
