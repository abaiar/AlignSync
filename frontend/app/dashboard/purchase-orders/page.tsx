"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, AlertTriangle, ClipboardList } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";

interface PurchaseOrderListItem {
  id: number;
  order_no: string;
  order_type: string;
  status: string;
  total_amount: number;
  created_at: string;
}

interface PurchaseOrderListResponse {
  items: PurchaseOrderListItem[];
  total?: number;
}

interface ApiErrorShape {
  response?: { data?: { detail?: unknown } };
  message?: string;
}

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "全部", value: "" },
  { label: "草稿", value: "draft" },
  { label: "待确认", value: "pending" },
  { label: "已确认", value: "confirmed" },
  { label: "待付款", value: "awaiting_payment" },
  { label: "已付款", value: "paid" },
  { label: "已发货", value: "shipped" },
  { label: "已完成", value: "completed" },
];

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

function formatDateTime(iso: string): string {
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

export default function PurchaseOrdersListPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [activeStatus, setActiveStatus] = useState("");
  const [orders, setOrders] = useState<PurchaseOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (status: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { skip: 0, limit: 50 };
      if (status) params.status = status;
      const { data } = await api.get<PurchaseOrderListResponse>("/api/purchase-orders", { params });
      const list = Array.isArray(data) ? data : data.items ?? [];
      setOrders(list);
    } catch (err) {
      const apiErr = err as ApiErrorShape;
      const detail = apiErr?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "加载采购订单失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(activeStatus);
  }, [activeStatus, fetchOrders]);

  const canCreate = hasPermission("purchase_order:create");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="采购管理"
        description="管理相机与软件采购订单的全生命周期。"
        actions={
          canCreate ? (
            <Button onClick={() => router.push("/dashboard/purchase-orders/new")}>
              <Plus className="h-4 w-4" />
              新建订单
            </Button>
          ) : null
        }
      />

      <Card>
        {/* Status tabs */}
        <div className="flex flex-wrap items-center gap-1 border-b border-border px-3 py-2">
          {STATUS_TABS.map((tab) => {
            const isActive = activeStatus === tab.value;
            return (
              <button
                key={tab.value || "all"}
                onClick={() => setActiveStatus(tab.value)}
                className={
                  isActive
                    ? "rounded border border-accent/50 bg-accent/10 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-accent"
                    : "rounded border border-transparent px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-fg-secondary hover:bg-surface-elevated hover:text-fg-primary"
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 font-mono text-xs uppercase tracking-widest text-fg-muted">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            加载中…
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-start gap-2 px-4 py-6 text-sm text-danger">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-fg-muted">
            <ClipboardList className="h-8 w-8" />
            <p className="font-mono text-xs uppercase tracking-widest">暂无采购订单</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && orders.length > 0 && (
          <Table>
            <THead>
              <TR>
                <TH>订单编号</TH>
                <TH>类型</TH>
                <TH>状态</TH>
                <TH className="text-right">总金额</TH>
                <TH>创建时间</TH>
              </TR>
            </THead>
            <TBody>
              {orders.map((order) => (
                <TR
                  key={order.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/dashboard/purchase-orders/${order.id}`)}
                >
                  <TD>
                    <span className="font-mono text-sm text-accent">{order.order_no}</span>
                  </TD>
                  <TD>{ORDER_TYPE_LABEL[order.order_type] ?? order.order_type}</TD>
                  <TD>
                    <Badge tone={STATUS_TONE[order.status] ?? "muted"}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </Badge>
                  </TD>
                  <TD className="text-right font-mono tabular-nums">
                    {formatMoney(order.total_amount)}
                  </TD>
                  <TD className="font-mono text-xs text-fg-secondary">
                    {formatDateTime(order.created_at)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
        {"// 点击订单行查看详情"}
        {canCreate ? " · 点击「新建订单」创建采购单" : ""}
      </p>
    </div>
  );
}
