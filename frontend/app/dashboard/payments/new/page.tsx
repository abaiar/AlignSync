"use client";

import { Suspense, useCallback, useEffect, useState, FormEvent, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Upload,
  Landmark,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import api from "@/lib/api";

interface OrderDetail {
  id: number;
  order_no: string;
  total_amount: number;
  status: string;
}

interface BankInfo {
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  branch?: string;
}

interface ApiErrorShape {
  response?: { data?: { detail?: unknown } };
}

const PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: "bank_transfer", label: "银行转账" },
  { value: "alipay", label: "支付宝" },
  { value: "wechat", label: "微信支付" },
];

const selectClass =
  "h-9 rounded border border-border bg-surface-elevated px-3 font-sans text-sm text-fg-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40";

const textareaClass =
  "w-full resize-y rounded border border-border bg-surface-elevated px-3 py-2 font-sans text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40";

function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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

function NewPaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id") || "";

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(!!orderId);
  const [orderError, setOrderError] = useState<string | null>(null);

  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentAccount, setPaymentAccount] = useState("");
  const [paymentDate, setPaymentDate] = useState(today());
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [remark, setRemark] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchOrder = useCallback(async (id: string) => {
    setLoadingOrder(true);
    setOrderError(null);
    try {
      const { data } = await api.get<OrderDetail>(
        `/api/purchase-orders/${id}`,
      );
      setOrder(data);
      setAmount(String(data.total_amount ?? ""));
    } catch (err) {
      setOrderError(extractError(err, "加载订单详情失败"));
    } finally {
      setLoadingOrder(false);
    }
  }, []);

  const fetchBankInfo = useCallback(async () => {
    try {
      const { data } = await api.get<BankInfo>("/api/payments/bank-info");
      setBankInfo(data);
    } catch {
      // Bank info is for reference only — silently ignore errors
    }
  }, []);

  useEffect(() => {
    if (orderId) fetchOrder(orderId);
    fetchBankInfo();
  }, [orderId, fetchOrder, fetchBankInfo]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setVoucherFile(file);
  }

  function clearFile() {
    setVoucherFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!orderId) {
      setSubmitError("缺少订单ID");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setSubmitError("请输入有效的付款金额");
      return;
    }
    if (!paymentDate) {
      setSubmitError("请选择付款日期");
      return;
    }
    if (!voucherFile) {
      setSubmitError("请上传付款凭证");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("order_id", orderId);
      formData.append("amount", String(amount));
      formData.append("payment_method", paymentMethod);
      if (paymentAccount.trim()) {
        formData.append("payment_account", paymentAccount.trim());
      }
      formData.append("payment_date", paymentDate);
      if (remark.trim()) {
        formData.append("remark", remark.trim());
      }
      formData.append("voucher", voucherFile);

      const { data } = await api.post<{ id: number }>("/api/payments", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      router.push(`/dashboard/payments/${data.id}`);
    } catch (err) {
      setSubmitError(extractError(err, "提交付款记录失败，请重试"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!orderId) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="创建付款记录" />
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
        title="创建付款记录"
        description={
          order ? `订单 #${order.id} · ${order.order_no}` : "提交付款凭证供核验"
        }
        actions={
          <Button variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Left — form */}
        <Card>
          <CardHeader>
            <CardTitle>付款信息</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOrder ? (
              <div className="flex items-center justify-center gap-2 py-12 font-mono text-xs uppercase tracking-widest text-fg-muted">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                加载订单中…
              </div>
            ) : orderError ? (
              <div className="flex items-start gap-2 border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{orderError}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {order && (
                  <div className="flex items-center justify-between border border-border bg-surface-elevated px-3 py-2">
                    <span className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                      订单总金额
                    </span>
                    <span className="font-mono text-sm font-semibold tabular-nums text-accent">
                      {formatMoney(order.total_amount)}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="付款金额"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                      付款方式
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className={selectClass}
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="付款账号（可选）"
                    name="payment_account"
                    value={paymentAccount}
                    onChange={(e) => setPaymentAccount(e.target.value)}
                    placeholder="付款方账号"
                  />
                  <Input
                    label="付款日期"
                    name="payment_date"
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>

                {/* File upload — drag-drop styled area */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                    付款凭证 *
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {voucherFile ? (
                    <div className="flex items-center justify-between border border-accent/50 bg-accent/5 px-3 py-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <Upload className="h-4 w-4 shrink-0 text-accent" />
                        <span className="truncate font-mono text-sm text-fg-primary">
                          {voucherFile.name}
                        </span>
                        <span className="font-mono text-xs text-fg-muted">
                          ({(voucherFile.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={clearFile}
                        className="flex h-6 w-6 items-center justify-center text-fg-muted hover:text-danger"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-2 border border-dashed border-border bg-surface-elevated px-4 py-8 transition-colors hover:border-accent/50 hover:bg-accent/5"
                    >
                      <Upload className="h-6 w-6 text-fg-muted" />
                      <span className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                        点击上传付款凭证
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
                        支持图片 / PDF
                      </span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                    备注
                  </label>
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    rows={3}
                    placeholder="可选 — 填写付款备注"
                    className={textareaClass}
                  />
                </div>

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
                      "提交付款记录"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Right — bank info */}
        <Card>
          <CardHeader>
            <CardTitle>收款账户信息</CardTitle>
            <Landmark className="h-4 w-4 text-fg-muted" />
          </CardHeader>
          <CardContent>
            {bankInfo ? (
              <dl className="flex flex-col gap-3">
                {bankInfo.bank_name && (
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <dt className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                      开户银行
                    </dt>
                    <dd className="text-sm text-fg-primary">
                      {bankInfo.bank_name}
                    </dd>
                  </div>
                )}
                {bankInfo.account_name && (
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <dt className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                      账户名称
                    </dt>
                    <dd className="text-sm text-fg-primary">
                      {bankInfo.account_name}
                    </dd>
                  </div>
                )}
                {bankInfo.account_number && (
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <dt className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                      账号
                    </dt>
                    <dd className="font-mono text-sm text-accent">
                      {bankInfo.account_number}
                    </dd>
                  </div>
                )}
                {bankInfo.branch && (
                  <div className="flex items-center justify-between">
                    <dt className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                      支行
                    </dt>
                    <dd className="text-sm text-fg-primary">
                      {bankInfo.branch}
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="py-6 text-center font-mono text-xs uppercase tracking-widest text-fg-muted">
                加载中…
              </p>
            )}
            <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-fg-muted">
              {"// 请使用以上账户进行转账"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function NewPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center gap-2 py-16 font-mono text-xs uppercase tracking-widest text-fg-muted">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          加载中…
        </div>
      }
    >
      <NewPaymentForm />
    </Suspense>
  );
}
