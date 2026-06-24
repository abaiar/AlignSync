"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertTriangle, Check, Minus } from "lucide-react";
import api from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Product {
  id: number;
  name: string;
  model: string | null;
  price: number;
  category: string;
  function_versions?: string[];
}

interface ProductsResponse {
  items: Product[];
  total?: number;
}

interface CreateOrderPayload {
  order_type: string;
  items: { product_id: number; quantity: number; function_version?: string }[];
  remark?: string;
  submit: boolean;
}

interface ApiErrorShape {
  response?: { data?: { detail?: unknown } };
  message?: string;
}

type OrderType = "camera" | "software";

interface SelectedItem {
  productId: number;
  name: string;
  model: string | null;
  price: number;
  quantity: number;
  functionVersion: string;
}

const ORDER_TYPES: { value: OrderType; label: string; category: string }[] = [
  { value: "camera", label: "相机采购", category: "camera" },
  { value: "software", label: "软件采购", category: "software" },
];

function formatMoney(v: number): string {
  return `¥${(v ?? 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [orderType, setOrderType] = useState<OrderType>("camera");
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Record<number, SelectedItem>>({});
  const [remark, setRemark] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const category = useMemo(
    () => ORDER_TYPES.find((t) => t.value === orderType)?.category ?? "camera",
    [orderType],
  );

  const fetchProducts = useCallback(async (cat: string) => {
    setLoadingProducts(true);
    setProductsError(null);
    try {
      const { data } = await api.get<ProductsResponse>("/api/products", {
        params: { category: cat, skip: 0, limit: 100 },
      });
      const list = Array.isArray(data) ? data : data.items ?? [];
      setProducts(list);
    } catch (err) {
      const apiErr = err as ApiErrorShape;
      const detail = apiErr?.response?.data?.detail;
      setProductsError(typeof detail === "string" ? detail : "加载产品列表失败");
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    setSelected({});
    fetchProducts(category);
  }, [category, fetchProducts]);

  const totalAmount = useMemo(
    () => Object.values(selected).reduce((sum, item) => sum + item.price * item.quantity, 0),
    [selected],
  );

  const selectedList = useMemo(() => Object.values(selected), [selected]);

  function toggleProduct(product: Product) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[product.id]) {
        delete next[product.id];
      } else {
        next[product.id] = {
          productId: product.id,
          name: product.name,
          model: product.model,
          price: product.price,
          quantity: 1,
          functionVersion: product.function_versions?.[0] ?? "",
        };
      }
      return next;
    });
  }

  function updateQuantity(productId: number, quantity: number) {
    setSelected((prev) => {
      const item = prev[productId];
      if (!item) return prev;
      const q = Math.max(1, Math.floor(Number.isFinite(quantity) ? quantity : 1));
      return { ...prev, [productId]: { ...item, quantity: q } };
    });
  }

  function updateFunctionVersion(productId: number, functionVersion: string) {
    setSelected((prev) => {
      const item = prev[productId];
      if (!item) return prev;
      return { ...prev, [productId]: { ...item, functionVersion } };
    });
  }

  async function handleSubmit(submit: boolean) {
    if (selectedList.length === 0) {
      setSubmitError("请至少选择一个产品");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: CreateOrderPayload = {
        order_type: orderType,
        items: selectedList.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          ...(item.functionVersion ? { function_version: item.functionVersion } : {}),
        })),
        remark: remark.trim() || undefined,
        submit,
      };
      const { data } = await api.post<{ id: number }>("/api/purchase-orders", payload);
      router.push(`/dashboard/purchase-orders/${data.id}`);
    } catch (err) {
      const apiErr = err as ApiErrorShape;
      const detail = apiErr?.response?.data?.detail;
      setSubmitError(typeof detail === "string" ? detail : "提交订单失败，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="新建采购订单"
        description="选择采购类型与产品，填写数量后保存草稿或直接提交。"
        actions={
          <Link href="/dashboard/purchase-orders">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              返回列表
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Left — product selection */}
        <div className="flex flex-col gap-6">
          {/* Order type */}
          <Card>
            <CardHeader>
              <CardTitle>订单类型</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {ORDER_TYPES.map((t) => {
                  const isActive = orderType === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setOrderType(t.value)}
                      className={
                        isActive
                          ? "flex min-w-[160px] items-center gap-3 rounded border border-accent bg-accent/10 px-4 py-3 text-left"
                          : "flex min-w-[160px] items-center gap-3 rounded border border-border bg-surface-elevated px-4 py-3 text-left hover:border-fg-muted"
                      }
                    >
                      <span
                        className={
                          isActive
                            ? "flex h-4 w-4 items-center justify-center rounded-full border border-accent bg-accent"
                            : "flex h-4 w-4 items-center justify-center rounded-full border border-border"
                        }
                      >
                        {isActive && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                      <span className="text-sm font-medium text-fg-primary">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Product list */}
          <Card>
            <CardHeader>
              <CardTitle>产品列表</CardTitle>
              <span className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
                {category.toUpperCase()}
              </span>
            </CardHeader>
            <CardContent className="p-0">
              {loadingProducts && (
                <div className="flex items-center justify-center gap-2 py-12 font-mono text-xs uppercase tracking-widest text-fg-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  加载产品中…
                </div>
              )}
              {productsError && !loadingProducts && (
                <div className="flex items-start gap-2 px-4 py-6 text-sm text-danger">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{productsError}</span>
                </div>
              )}
              {!loadingProducts && !productsError && products.length === 0 && (
                <div className="px-4 py-12 text-center font-mono text-xs uppercase tracking-widest text-fg-muted">
                  暂无可用产品
                </div>
              )}
              {!loadingProducts && !productsError && products.length > 0 && (
                <ul className="divide-y divide-border">
                  {products.map((product) => {
                    const isSelected = !!selected[product.id];
                    return (
                      <li
                        key={product.id}
                        className="flex items-center justify-between gap-4 px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                isSelected
                                  ? "flex h-5 w-5 shrink-0 items-center justify-center border border-accent bg-accent text-white"
                                  : "flex h-5 w-5 shrink-0 items-center justify-center border border-border"
                              }
                            >
                              {isSelected && <Check className="h-3.5 w-3.5" />}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleProduct(product)}
                              className="min-w-0 flex-1 text-left"
                            >
                              <p className="truncate text-sm font-medium text-fg-primary">
                                {product.name}
                              </p>
                              <p className="truncate font-mono text-[10px] uppercase tracking-wider text-fg-muted">
                                {product.model ?? "—"} · {formatMoney(product.price)}
                              </p>
                            </button>
                          </div>
                        </div>
                        <Button
                          variant={isSelected ? "secondary" : "primary"}
                          onClick={() => toggleProduct(product)}
                          className="h-7 px-3 text-xs"
                        >
                          {isSelected ? (
                            <>
                              <Minus className="h-3 w-3" />
                              移除
                            </>
                          ) : (
                            "选择"
                          )}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right — selected items + remark + actions */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>已选项目</CardTitle>
              <span className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
                {selectedList.length} 项
              </span>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {selectedList.length === 0 && (
                <p className="py-6 text-center font-mono text-xs uppercase tracking-widest text-fg-muted">
                  请从左侧选择产品
                </p>
              )}
              {selectedList.map((item) => {
                const product = products.find((p) => p.id === item.productId);
                const versions = product?.function_versions ?? [];
                return (
                  <div key={item.productId} className="border border-border bg-surface-elevated p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-fg-primary">{item.name}</p>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
                          {item.model ?? "—"} · {formatMoney(item.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleProduct(product!)}
                        className="font-mono text-[10px] uppercase tracking-wider text-fg-muted hover:text-danger"
                      >
                        移除
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-end gap-3">
                      <Input
                        label="数量"
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
                        className="w-24"
                      />
                      {orderType === "software" && versions.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <label className="font-mono text-xs uppercase tracking-wider text-fg-secondary">
                            功能版本
                          </label>
                          <select
                            value={item.functionVersion}
                            onChange={(e) => updateFunctionVersion(item.productId, e.target.value)}
                            className="h-9 rounded border border-border bg-surface-elevated px-3 font-sans text-sm text-fg-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
                          >
                            {versions.map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="ml-auto text-right">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
                          小计
                        </p>
                        <p className="font-mono text-sm font-semibold tabular-nums text-accent">
                          {formatMoney(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>备注</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={3}
                placeholder="可选 — 填写订单备注或特殊要求"
                className="w-full resize-y rounded border border-border bg-surface-elevated px-3 py-2 font-sans text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-widest text-fg-muted">
                  合计金额
                </span>
                <span className="font-display text-2xl font-extrabold tabular-nums text-accent">
                  {formatMoney(totalAmount)}
                </span>
              </div>
              {submitError && (
                <div className="flex items-start gap-2 border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  disabled={submitting || selectedList.length === 0}
                  onClick={() => handleSubmit(false)}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  保存草稿
                </Button>
                <Button
                  className="flex-1"
                  disabled={submitting || selectedList.length === 0}
                  onClick={() => handleSubmit(true)}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  提交订单
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
