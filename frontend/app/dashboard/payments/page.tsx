"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, Wallet, FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import api from "@/lib/api";

type PaymentStatus =
  | "awaiting_confirm"
  | "confirmed"
  | "pending_verify"
  | "amount_abnormal";

interface PaymentListItem {
  id: number;
  order_id: number;
  order_no?: string;
  amount: number;
  payment_method: string;
  status: PaymentStatus;
  payment_date: string;
  voucher_url?: string | null;
}

interface PaymentListResponse {
  items: PaymentListItem[];
  total?: number;
}

interface ApiErrorShape {
  response?: { data?: { detail?: unknown } };
}

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "全部", value: "" },
  { label: "待确认", value: "awaiting_confirm" },
  { label: "已确认", value: "confirmed" },
  { label: "待核实", value: "pending_verify" },
  { label: "金额异常", value: "amount_abnormal" },
];

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

export default function PaymentListPage() {
  const router = useRouter();
  const [activeStatus, setActiveStatus] = useState("");
  const [items, setItems] = useState<PaymentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async (status: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { skip: 0, limit: 50 };
      if (status) params.status = status;
      const { data } = await api.get<PaymentListResponse | PaymentListItem[]>(
        "/api/payments",
        { params },
      );
      const list = Array.isArray(data) ? data : data.items ?? [];
      setItems(list);
    } catch (err) {
      const apiErr = err as ApiErrorShape;
      const detail = apiErr?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "加载付款列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments(activeStatus);
  }, [activeStatus, fetchPayments]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="财务管理"
        description="付款记录查询与到账确认。"
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
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="flex items-center gap-2 border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-fg-muted">
            <Wallet className="h-8 w-8" />
            <p className="font-mono text-xs uppercase tracking-widest">暂无付款记录</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && items.length > 0 && (
          <Table>
            <THead>
              <TR>
                <TH>订单ID</TH>
                <TH className="text-right">金额</TH>
                <TH>付款方式</TH>
                <TH>状态</TH>
                <TH>付款日期</TH>
                <TH>凭证</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((p) => (
                <TR
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/dashboard/payments/${p.id}`)}
                >
                  <TD>
                    <span className="font-mono text-sm text-accent">
                      #{p.order_id}
                    </span>
                    {p.order_no && (
                      <span className="ml-2 font-mono text-xs text-fg-muted">
                        {p.order_no}
                      </span>
                    )}
                  </TD>
                  <TD className="text-right font-mono tabular-nums">
                    {formatMoney(p.amount)}
                  </TD>
                  <TD>
                    {PAYMENT_METHOD_LABEL[p.payment_method] ?? p.payment_method}
                  </TD>
                  <TD>
                    <Badge tone={STATUS_TONE[p.status] ?? "muted"}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </Badge>
                  </TD>
                  <TD className="font-mono text-xs text-fg-secondary">
                    {formatDate(p.payment_date)}
                  </TD>
                  <TD>
                    {p.voucher_url ? (
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-info">
                        <FileText className="h-3.5 w-3.5" />
                        已上传
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-fg-muted">—</span>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
        {"// 点击行查看付款详情"}
      </p>
    </div>
  );
}
