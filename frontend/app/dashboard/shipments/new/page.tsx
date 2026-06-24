"use client";

import { Suspense, useCallback, useEffect, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Truck,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import api from "@/lib/api";

interface OrderItem {
  id: number;
  product_name: string;
  product_model?: string | null;
  quantity: number;
}

interface OrderDetail {
  id: number;
  order_no: string;
  total_amount: number;
  status: string;
  items: OrderItem[];
  target_enterprise_name?: string;
}

interface ApiErrorShape {
  response?: { data?: { detail?: unknown } };
}

const ITEM_TYPES: { value: string; label: string }[] = [
  { value: "camera", label: "相机" },
  { value: "software_lock", label: "软件锁" },
];

const selectClass =
  "h-9 rounded border border-border bg-surface-elevated px-3 font-sans text-sm text-fg-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40";

const textareaClass =
  "w-full resize-y rounded border border-border bg-surface-elevated px-3 py-2 font-sans text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40";

function extractError(err: unknown, fallback: string): string {
  const apiErr = err as ApiErrorShape;
  const detail = apiErr?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  return fallback;
}

interface ShipmentItemForm {
  order_item_id: number;
  item_type: string;
  item_sn: string;
  quantity: number;
}

function NewShipmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id") || "";

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(!!orderId);
  const [orderError, setOrderError] = useState<string | null>(null);

  const [logisticsCompany, setLogisticsCompany] = useState("");
  const [trackingNo, setTrackingNo] = useState("");
  const [partial, setPartial] = useState(false);
  const [remark, setRemark] = useState("");
  const [itemForms, setItemForms] = useState<Record<number, ShipmentItemForm>>({});

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchOrder = useCallback(async (id: string) => {
    setLoadingOrder(true);
    setOrderError(null);
    try {
      const { data } = await api.get<OrderDetail>(
        `/api/purchase-orders/${id}`,
      );
      setOrder(data);
      // Initialize item forms from order items
      const forms: Record<number, ShipmentItemForm> = {};
      for (const item of data.items ?? []) {
        forms[item.id] = {
          order_item_id: item.id,
          item_type: "camera",
          item_sn: "",
          quantity: item.quantity,
        };
      }
      setItemForms(forms);
    } catch (err) {
      setOrderError(extractError(err, "加载订单详情失败"));
    } finally {
      setLoadingOrder(false);
    }
  }, []);

  useEffect(() => {
    if (orderId) fetchOrder(orderId);
  }, [orderId, fetchOrder]);

  function updateItemForm(itemId: number, patch: Partial<ShipmentItemForm>) {
    setItemForms((prev) => {
      const cur = prev[itemId];
      if (!cur) return prev;
      return { ...prev, [itemId]: { ...cur, ...patch } };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!orderId) {
      setSubmitError("缺少订单ID");
      return;
    }
    if (!trackingNo.trim()) {
      setSubmitError("请输入运单号");
      return;
    }

    // Collect items that have an SN filled in
    const items = Object.values(itemForms).filter(
      (f) => f.item_sn.trim() !== "",
    );

    if (items.length === 0) {
      setSubmitError("请至少填写一个发货物品的序列号");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        order_id: Number(orderId),
        logistics_company: logisticsCompany.trim() || undefined,
        tracking_no: trackingNo.trim(),
        items: items.map((f) => ({
          order_item_id: f.order_item_id,
          item_type: f.item_type,
          item_sn: f.item_sn.trim(),
          quantity: f.quantity,
        })),
        partial,
        remark: remark.trim() || undefined,
      };
      const { data } = await api.post<{ id: number }>("/api/shipments", payload);
      router.push(`/dashboard/shipments/${data.id}`);
    } catch (err) {
      setSubmitError(extractError(err, "提交发货记录失败，请重试"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!orderId) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="创建发货记录" />
        <Card>
          <CardContent className="py-16 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-warning" />
            <p className="mt-3 font-mono text-xs uppercase tracking-widest text-fg-muted">
              缺少订单ID参数
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="创建发货记录"
        description={
          order ? `订单 #${order.id} · ${order.order_no}` : "填写物流与发货信息"
        }
        actions={
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
        }
      />

      {loadingOrder ? (
        <Card>
          <div className="flex items-center justify-center gap-2 py-16 font-mono text-xs uppercase tracking-widest text-fg-muted">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            加载订单中…
          </div>
        </Card>
      ) : orderError ? (
        <Card>
          <div className="flex items-start gap-2 px-4 py-6 text-sm text-danger">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{orderError}</span>
          </div>
        </Card>
      ) : order ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Logistics info */}
          <Card>
            <CardHeader>
              <CardTitle>物流信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="物流公司"
                  name="logistics_company"
                  value={logisticsCompany}
                  onChange={(e) => setLogisticsCompany(e.target.value)}
                  placeholder="如：顺丰速运"
                />
                <Input
                  label="运单号"
                  name="tracking_no"
                  required
                  value={trackingNo}
                  onChange={(e) => setTrackingNo(e.target.value)}
                  placeholder="物流运单号"
                  className="font-mono"
                />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>发货物品</CardTitle>
              <span className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
                {order.items?.length ?? 0} 项
              </span>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {order.items && order.items.length > 0 ? (
                order.items.map((item) => {
                  const form = itemForms[item.id];
                  if (!form) return null;
                  return (
                    <div
                      key={item.id}
                      className="border border-border bg-surface-elevated p-3"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-fg-primary">
                            {item.product_name}
                          </p>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
                            {item.product_model ?? "—"} · 订单数量 {item.quantity}
                          </p>
                        </div>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
                          #{item.id}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                            物品类型
                          </label>
                          <select
                            value={form.item_type}
                            onChange={(e) =>
                              updateItemForm(item.id, { item_type: e.target.value })
                            }
                            className={selectClass}
                          >
                            {ITEM_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Input
                          label="序列号 (SN)"
                          name={`sn_${item.id}`}
                          value={form.item_sn}
                          onChange={(e) =>
                            updateItemForm(item.id, { item_sn: e.target.value })
                          }
                          placeholder="输入 SN"
                          className="font-mono"
                        />
                        <Input
                          label="发货数量"
                          name={`qty_${item.id}`}
                          type="number"
                          min="1"
                          value={form.quantity}
                          onChange={(e) =>
                            updateItemForm(item.id, {
                              quantity: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="py-6 text-center font-mono text-xs uppercase tracking-widest text-fg-muted">
                  订单无物品
                </p>
              )}
            </CardContent>
          </Card>

          {/* Options + remark */}
          <Card>
            <CardHeader>
              <CardTitle>其他</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <label className="flex items-center gap-2 text-sm text-fg-secondary">
                <input
                  type="checkbox"
                  checked={partial}
                  onChange={(e) => setPartial(e.target.checked)}
                  className="h-4 w-4 accent-accent"
                />
                部分发货
              </label>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                  备注
                </label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={3}
                  placeholder="可选 — 填写发货备注"
                  className={textareaClass}
                />
              </div>
            </CardContent>
          </Card>

          {submitError && (
            <div className="flex items-start gap-2 border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  提交中…
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4" />
                  提交发货记录
                </>
              )}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

export default function NewShipmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center gap-2 py-16 font-mono text-xs uppercase tracking-widest text-fg-muted">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          加载中…
        </div>
      }
    >
      <NewShipmentForm />
    </Suspense>
  );
}
