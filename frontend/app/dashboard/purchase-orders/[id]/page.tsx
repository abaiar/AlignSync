"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  X,
  Send,
  Check,
  Ban,
  CreditCard,
  Truck,
  PackageCheck,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  model: string | null;
  quantity: number;
  unit_price: number;
  function_version: string | null;
  confirmed_quantity: number | null;
  shipped_quantity: number | null;
}

interface OrderDetail {
  id: number;
  order_no: string;
  order_type: string;
  status: string;
  total_amount: number;
  created_at: string;
  remark: string | null;
  rejected_reason: string | null;
  confirmed_at: string | null;
  items: OrderItem[];
}

interface ApiErrorShape {
  response?: { data?: { detail?: unknown } };
  message?: string;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  pending: "待确认",
  confirmed: "已确认",
  rejected: "已驳回",
  awaiting_payment: "待付款",
  paid: "已付款",
  shipped: "已发货",
  completed: "已完成",
};

const STATUS_TONE: Record<string, "muted" | "warning" | "info" | "danger" | "success"> = {
  draft: "muted",
  pending: "warning",
  confirmed: "info",
  rejected: "danger",
  awaiting_payment: "warning",
  paid: "success",
  shipped: "info",
  completed: "success",
};

const ORDER_TYPE_LABEL: Record<string, string> = {
  camera: "相机采购",
  software: "软件采购",
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

function formatMoney(v: number): string {
  return `¥${(v ?? 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getErrorMessage(err: unknown, fallback: string): string {
  const apiErr = err as ApiErrorShape;
  const detail = apiErr?.response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
}

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const { hasPermission } = useAuth();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmQuantities, setConfirmQuantities] = useState<Record<number, number>>({});
  const [confirmPartial, setConfirmPartial] = useState(false);
  const [confirmRemark, setConfirmRemark] = useState("");

  // Reject modal state
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<OrderDetail>(`/api/purchase-orders/${orderId}`);
      setOrder(data);
      // Initialize confirm quantities from ordered quantities
      const initQ: Record<number, number> = {};
      data.items?.forEach((item) => {
        initQ[item.id] = item.confirmed_quantity ?? item.quantity;
      });
      setConfirmQuantities(initQ);
    } catch (err) {
      setError(getErrorMessage(err, "加载订单详情失败"));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  async function handleSubmitDraft() {
    setActionLoading(true);
    setActionError(null);
    try {
      await api.post(`/api/purchase-orders/${orderId}/submit`);
      await fetchOrder();
    } catch (err) {
      setActionError(getErrorMessage(err, "提交订单失败"));
    } finally {
      setActionLoading(false);
    }
  }

  function openConfirmModal() {
    if (!order) return;
    const initQ: Record<number, number> = {};
    order.items.forEach((item) => {
      initQ[item.id] = item.confirmed_quantity ?? item.quantity;
    });
    setConfirmQuantities(initQ);
    setConfirmPartial(false);
    setConfirmRemark("");
    setActionError(null);
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    if (!order) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await api.patch(`/api/purchase-orders/${orderId}/confirm`, {
        confirmed_quantities: confirmQuantities,
        remark: confirmRemark.trim() || undefined,
        partial: confirmPartial,
      });
      setConfirmOpen(false);
      await fetchOrder();
    } catch (err) {
      setActionError(getErrorMessage(err, "确认订单失败"));
    } finally {
      setActionLoading(false);
    }
  }

  function openRejectModal() {
    setRejectReason("");
    setActionError(null);
    setRejectOpen(true);
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      setActionError("请填写驳回原因");
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await api.patch(`/api/purchase-orders/${orderId}/reject`, {
        reason: rejectReason.trim(),
      });
      setRejectOpen(false);
      await fetchOrder();
    } catch (err) {
      setActionError(getErrorMessage(err, "驳回订单失败"));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReceive() {
    setActionLoading(true);
    setActionError(null);
    try {
      await api.post(`/api/purchase-orders/${orderId}/receive`);
      await fetchOrder();
    } catch (err) {
      setActionError(getErrorMessage(err, "确认收货失败"));
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 font-mono text-xs uppercase tracking-widest text-fg-muted">
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
        加载订单详情…
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/dashboard/purchase-orders">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            返回列表
          </Button>
        </Link>
        <div className="flex items-start gap-2 border border-danger/40 bg-danger/10 px-4 py-6 text-sm text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const status = order.status;
  const canConfirm = hasPermission("purchase_order:confirm");
  const canPay = hasPermission("payment:create");
  const canShip = hasPermission("shipment:create");
  const canReceive = hasPermission("receive:confirm");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`订单 ${order.order_no}`}
        description="采购订单详情与处理。"
        actions={
          <Link href="/dashboard/purchase-orders">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              返回列表
            </Button>
          </Link>
        }
      />

      {actionError && (
        <div className="flex items-start gap-2 border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Order summary */}
      <Card>
        <CardHeader>
          <CardTitle>订单信息</CardTitle>
          <Badge tone={STATUS_TONE[status] ?? "muted"}>
            {STATUS_LABEL[status] ?? status}
          </Badge>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
                订单编号
              </dt>
              <dd className="mt-1 font-mono text-sm text-accent">{order.order_no}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
                订单类型
              </dt>
              <dd className="mt-1 text-sm text-fg-primary">
                {ORDER_TYPE_LABEL[order.order_type] ?? order.order_type}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
                总金额
              </dt>
              <dd className="mt-1 font-mono text-sm font-semibold tabular-nums text-fg-primary">
                {formatMoney(order.total_amount)}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
                创建时间
              </dt>
              <dd className="mt-1 font-mono text-xs text-fg-secondary">
                {formatDateTime(order.created_at)}
              </dd>
            </div>
            {order.confirmed_at && (
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
                  确认时间
                </dt>
                <dd className="mt-1 font-mono text-xs text-fg-secondary">
                  {formatDateTime(order.confirmed_at)}
                </dd>
              </div>
            )}
            <div className="col-span-2 sm:col-span-3 lg:col-span-4">
              <dt className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
                备注
              </dt>
              <dd className="mt-1 text-sm text-fg-primary">
                {order.remark || "—"}
              </dd>
            </div>
            {status === "rejected" && order.rejected_reason && (
              <div className="col-span-2 sm:col-span-3 lg:col-span-4">
                <dt className="font-mono text-[10px] uppercase tracking-widest text-danger">
                  驳回原因
                </dt>
                <dd className="mt-1 border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                  {order.rejected_reason}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Items table */}
      <Card>
        <CardHeader>
          <CardTitle>订单明细</CardTitle>
          <span className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
            {order.items?.length ?? 0} 项
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>产品名称</TH>
                <TH>型号</TH>
                <TH className="text-right">数量</TH>
                <TH className="text-right">单价</TH>
                <TH className="text-right">小计</TH>
                <TH>功能版本</TH>
                <TH className="text-right">已确认</TH>
                <TH className="text-right">已发货</TH>
              </TR>
            </THead>
            <TBody>
              {order.items?.map((item) => (
                <TR key={item.id}>
                  <TD className="font-medium">{item.product_name}</TD>
                  <TD className="font-mono text-xs text-fg-secondary">
                    {item.model ?? "—"}
                  </TD>
                  <TD className="text-right font-mono tabular-nums">{item.quantity}</TD>
                  <TD className="text-right font-mono tabular-nums">
                    {formatMoney(item.unit_price)}
                  </TD>
                  <TD className="text-right font-mono tabular-nums">
                    {formatMoney(item.unit_price * item.quantity)}
                  </TD>
                  <TD className="font-mono text-xs text-fg-secondary">
                    {item.function_version ?? "—"}
                  </TD>
                  <TD className="text-right font-mono tabular-nums">
                    {item.confirmed_quantity ?? "—"}
                  </TD>
                  <TD className="text-right font-mono tabular-nums">
                    {item.shipped_quantity ?? "—"}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
            {"// 可用操作"}
          </span>
          <div className="flex flex-wrap gap-2">
            {status === "draft" && (
              <Button onClick={handleSubmitDraft} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                提交订单
              </Button>
            )}
            {status === "pending" && canConfirm && (
              <>
                <Button onClick={openConfirmModal} disabled={actionLoading}>
                  <Check className="h-4 w-4" />
                  确认订单
                </Button>
                <Button variant="danger" onClick={openRejectModal} disabled={actionLoading}>
                  <Ban className="h-4 w-4" />
                  驳回
                </Button>
              </>
            )}
            {status === "confirmed" && canPay && (
              <Link href={`/dashboard/payments/new?order_id=${order.id}`}>
                <Button>
                  <CreditCard className="h-4 w-4" />
                  去付款
                </Button>
              </Link>
            )}
            {(status === "awaiting_payment" || status === "paid") && canShip && (
              <Link href={`/dashboard/shipments/new?order_id=${order.id}`}>
                <Button>
                  <Truck className="h-4 w-4" />
                  发货
                </Button>
              </Link>
            )}
            {status === "shipped" && canReceive && (
              <Button onClick={handleReceive} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
                确认收货
              </Button>
            )}
            {!["draft", "pending", "confirmed", "awaiting_payment", "paid", "shipped"].includes(status) && (
              <span className="font-mono text-xs uppercase tracking-widest text-fg-muted">
                当前状态无可用操作
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirm modal */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !actionLoading && setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-2xl animate-slide-up border border-border bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-fg-primary">
                确认订单
              </h3>
              <button
                onClick={() => !actionLoading && setConfirmOpen(false)}
                className="text-fg-muted hover:text-fg-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              <p className="mb-3 text-xs text-fg-secondary">
                为每个明细项填写确认数量。如需部分确认，请勾选「部分确认」。
              </p>
              <div className="flex flex-col gap-2">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 border border-border bg-surface-elevated px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg-primary">
                        {item.product_name}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
                        订单数量 {item.quantity}
                      </p>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={item.quantity}
                      value={confirmQuantities[item.id] ?? 0}
                      onChange={(e) =>
                        setConfirmQuantities((prev) => ({
                          ...prev,
                          [item.id]: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                        }))
                      }
                      className="w-24"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <label className="flex items-center gap-2 text-sm text-fg-primary">
                  <input
                    type="checkbox"
                    checked={confirmPartial}
                    onChange={(e) => setConfirmPartial(e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-accent"
                  />
                  部分确认（数量不足时仍确认订单）
                </label>
                <div>
                  <label className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                    确认备注
                  </label>
                  <textarea
                    value={confirmRemark}
                    onChange={(e) => setConfirmRemark(e.target.value)}
                    rows={2}
                    placeholder="可选"
                    className="mt-1.5 w-full resize-y rounded border border-border bg-surface-elevated px-3 py-2 font-sans text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
              <Button
                variant="secondary"
                onClick={() => setConfirmOpen(false)}
                disabled={actionLoading}
              >
                取消
              </Button>
              <Button onClick={handleConfirm} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                确认
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !actionLoading && setRejectOpen(false)}
        >
          <div
            className="w-full max-w-md animate-slide-up border border-border bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-danger">
                驳回订单
              </h3>
              <button
                onClick={() => !actionLoading && setRejectOpen(false)}
                className="text-fg-muted hover:text-fg-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <p className="mb-3 text-xs text-fg-secondary">请填写驳回原因，将记录在订单中。</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder="请输入驳回原因…"
                className="w-full resize-y rounded border border-border bg-surface-elevated px-3 py-2 font-sans text-sm text-fg-primary placeholder:text-fg-muted focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger/40"
              />
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
              <Button
                variant="secondary"
                onClick={() => setRejectOpen(false)}
                disabled={actionLoading}
              >
                取消
              </Button>
              <Button variant="danger" onClick={handleReject} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                确认驳回
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
