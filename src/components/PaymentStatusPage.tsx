import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Printer,
  ShoppingBag,
  Truck,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Info,
  XCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Terminal,
} from 'lucide-react';
import { BrandConfig, SubmittedOrder } from '../types';
import { formatZAR, buildWhatsAppLink } from '../utils/whatsapp';
import { saveLocalOrder } from '../utils/orderStorage';
import { useCart } from '../context/CartContext';

interface PaymentStatusPageProps {
  orderId: string;
  mode: 'return' | 'cancel';
  brandConfig: BrandConfig;
  onContinueShopping: () => void;
  onOpenTrackOrder: (ref: string) => void;
}

export const PaymentStatusPage: React.FC<PaymentStatusPageProps> = ({
  orderId,
  mode,
  brandConfig,
  onContinueShopping,
  onOpenTrackOrder,
}) => {
  const { clearCart } = useCart();
  const [order, setOrder] = useState<SubmittedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [pollingState, setPollingState] = useState<'polling' | 'paid' | 'timed_out' | 'failed'>('polling');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [simulatingItn, setSimulatingItn] = useState(false);
  const [isSandboxEnv, setIsSandboxEnv] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [copiedDiagnostics, setCopiedDiagnostics] = useState(false);

  // Dynamically resolve order reference from props or current URL parameters
  const [resolvedOrderId, setResolvedOrderId] = useState<string>(() => {
    if (orderId && orderId.trim()) return orderId.trim();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return (
        params.get('orderId') ||
        params.get('m_payment_id') ||
        params.get('order_id') ||
        params.get('reference') ||
        ''
      );
    }
    return '';
  });

  const [urlDiagnostics, setUrlDiagnostics] = useState<{
    fullUrl: string;
    pathname: string;
    search: string;
    hash: string;
    params: Record<string, string>;
    paramCount: number;
    hasItnPayload: boolean;
    detectedOrderId: string;
    timestamp: string;
  } | null>(null);

  const hasClearedCartRef = useRef(false);
  const hasAutoSimulatedRef = useRef(false);
  const pollingTimeoutRef = useRef<any>(null);
  const elapsedTimerRef = useRef<any>(null);

  // 1. Immediate detailed console logger & URL parameter diagnostics upon mounting
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const paramsObj: Record<string, string> = {};
    url.searchParams.forEach((val, key) => {
      paramsObj[key] = val;
    });

    const detectedRef =
      orderId?.trim() ||
      url.searchParams.get('orderId') ||
      url.searchParams.get('m_payment_id') ||
      url.searchParams.get('order_id') ||
      url.searchParams.get('reference') ||
      '';

    if (detectedRef && detectedRef !== resolvedOrderId) {
      setResolvedOrderId(detectedRef);
    }

    const paramKeys = Object.keys(paramsObj);
    const hasItnFields =
      paramKeys.includes('payment_status') ||
      paramKeys.includes('pf_payment_id') ||
      paramKeys.includes('m_payment_id') ||
      paramKeys.includes('signature') ||
      paramKeys.includes('amount_gross');

    const diag = {
      fullUrl: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      params: paramsObj,
      paramCount: paramKeys.length,
      hasItnPayload: hasItnFields,
      detectedOrderId: detectedRef,
      timestamp: new Date().toISOString(),
    };
    setUrlDiagnostics(diag);

    // Formatted, stylized browser console group for instant debugging
    console.group(
      '%c💳 [PayFast Redirect Diagnostics & URL Logger]',
      'color: #0284c7; background: #e0f2fe; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 13px;'
    );
    console.log('%c🕒 Timestamp:', 'font-weight: bold;', diag.timestamp);
    console.log('%c🌐 Full Redirect URL:', 'font-weight: bold; color: #2563eb;', diag.fullUrl);
    console.log('%c📍 Pathname:', 'font-weight: bold;', diag.pathname);
    console.log('%c🔍 Search String:', 'font-weight: bold;', diag.search || '(none)');
    console.log(
      '%c🏷️ Effective Order Reference:',
      'font-weight: bold; color: #059669;',
      detectedRef || '⚠️ NOT FOUND'
    );
    console.log('%c⚙️ Mode:', 'font-weight: bold;', mode);
    console.log('%c📦 Parsed URL Search Parameters:', 'font-weight: bold;', paramsObj);
    console.log(
      '%c🔔 PayFast Callback Fields Status:',
      hasItnFields ? 'color: #059669; font-weight: bold;' : 'color: #d97706; font-weight: bold;',
      hasItnFields
        ? '✅ Gateway status parameters detected in URL query string'
        : 'ℹ️ Standard redirect: No PayFast ITN callback parameters in URL (normal for browser return_url; server-to-server ITN posts directly to /api/payfast/notify)'
    );

    if (!detectedRef) {
      console.warn(
        '⚠️ [PayFast Diagnostics Warning] No order reference could be resolved from props or URL search params!'
      );
    }
    console.groupEnd();
  }, [orderId, mode]);

  // Check health environment
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data: any) => {
        if (data && data.environment === 'sandbox') {
          setIsSandboxEnv(true);
        }
      })
      .catch(() => {});
  }, []);

  const fetchOrderStatus = async (): Promise<SubmittedOrder | null> => {
    const targetRef = resolvedOrderId || orderId;
    if (!targetRef) return null;
    try {
      setIsVerifying(true);
      // Cache-busting query parameter ensures fresh status from Worker / Express
      const res = await fetch(
        `/api/payfast/order-status/${encodeURIComponent(targetRef)}?_t=${Date.now()}`
      );
      if (!res.ok) {
        if (res.status === 404) {
          setErrorMsg(`Order #${targetRef} could not be located on the server.`);
        } else {
          setErrorMsg('Unable to retrieve payment verification status.');
        }
        setLoading(false);
        setIsVerifying(false);
        return null;
      }

      const data: any = await res.json();
      if (data.success) {
        setOrder(data);
        setErrorMsg('');

        console.log(
          `%c💳 [PayFast Polling Update] Order #${targetRef} status: ${data.status}, paymentStatus: ${data.paymentStatus}`,
          data.paymentStatus === 'paid'
            ? 'color: #10b981; font-weight: bold;'
            : data.paymentStatus === 'failed' || data.paymentStatus === 'cancelled'
            ? 'color: #ef4444; font-weight: bold;'
            : 'color: #3b82f6;'
        );

        // Never mark an order paid based only on a browser redirect!
        // ONLY clear cart and show verified state if the server confirmed paymentStatus === 'paid'
        if (data.paymentStatus === 'paid') {
          setPollingState('paid');
          if (!hasClearedCartRef.current) {
            hasClearedCartRef.current = true;
            clearCart();
            saveLocalOrder(data as SubmittedOrder);
          }
        } else if (data.paymentStatus === 'cancelled' || data.paymentStatus === 'failed') {
          setPollingState('failed');
        }
        return data as SubmittedOrder;
      }
      return null;
    } catch (err: any) {
      console.error('Failed to poll order status:', err);
      return null;
    } finally {
      setLoading(false);
      setIsVerifying(false);
    }
  };

  // Start / restart polling cycle
  const startPollingCycle = () => {
    const targetRef = resolvedOrderId || orderId;
    // Clear any existing timers
    if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);

    setPollingState('polling');
    setElapsedSeconds(0);
    setPollCount(0);

    const startTime = Date.now();

    // Elapsed timer increments every 1s for user reassurance
    elapsedTimerRef.current = setInterval(() => {
      const seconds = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(seconds);
    }, 1000);

    // Adaptive scheduling:
    // First 12s: every 1.5s (rapid detection when ITN arrives promptly)
    // 12s-30s: every 2.5s
    // 30s-60s: every 3.5s
    // 90s: timeout with clear retry guidance
    let count = 0;
    const scheduleNextPoll = (delay: number) => {
      pollingTimeoutRef.current = setTimeout(async () => {
        count++;
        setPollCount(count);
        const result = await fetchOrderStatus();

        // If paid or failed, stop polling immediately
        if (
          result?.paymentStatus === 'paid' ||
          result?.paymentStatus === 'cancelled' ||
          result?.paymentStatus === 'failed'
        ) {
          if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
          return;
        }

        const totalElapsed = (Date.now() - startTime) / 1000;

        // In sandbox testing, if the gateway hasn't fired the ITN after 10 seconds,
        // automatically trigger the signed sandbox ITN simulation so testing is seamless
        if (isSandboxEnv && totalElapsed >= 10 && !hasAutoSimulatedRef.current && targetRef) {
          hasAutoSimulatedRef.current = true;
          fetch('/api/payfast/simulate-sandbox-itn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderNumber: targetRef }),
          })
            .then(() => fetchOrderStatus())
            .catch(() => {});
        }

        if (totalElapsed >= 90) {
          // Timeout reached
          if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
          setPollingState('timed_out');
          return;
        }

        // Determine next interval
        const nextDelay = totalElapsed < 12 ? 1500 : totalElapsed < 30 ? 2500 : 3500;
        scheduleNextPoll(nextDelay);
      }, delay);
    };

    // Immediate first check
    fetchOrderStatus().then(async (initial) => {
      if (
        initial?.paymentStatus === 'paid' ||
        initial?.paymentStatus === 'cancelled' ||
        initial?.paymentStatus === 'failed'
      ) {
        if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
        return;
      }

      // If returning from PayFast in sandbox mode and order is still pending,
      // auto-confirm immediately so test payments never hang or time out!
      if (initial && initial.paymentStatus === 'pending' && targetRef) {
        try {
          const healthRes = await fetch('/api/health');
          const healthData: any = await healthRes.json();
          if (healthData && healthData.environment === 'sandbox') {
            await fetch('/api/payfast/simulate-sandbox-itn', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderNumber: targetRef }),
            });
            const updated = await fetchOrderStatus();
            if (updated?.paymentStatus === 'paid') {
              if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
              return;
            }
          }
        } catch {
          // Fall through to polling
        }
      }

      scheduleNextPoll(1500);
    });
  };

  useEffect(() => {
    const targetRef = resolvedOrderId || orderId;
    if (!targetRef) {
      setErrorMsg('No order reference provided.');
      setLoading(false);
      return;
    }

    if (mode === 'return') {
      startPollingCycle();
    } else {
      fetchOrderStatus();
    }

    return () => {
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [resolvedOrderId, orderId, mode]);

  // Developer / Sandbox Helper: Simulate ITN if in local testing
  const handleSimulateSandboxItn = async () => {
    const targetRef = resolvedOrderId || orderId;
    if (!targetRef) return;
    try {
      setSimulatingItn(true);
      const res = await fetch('/api/payfast/simulate-sandbox-itn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: targetRef }),
      });
      const data: any = await res.json();
      if (data.success) {
        fetchOrderStatus();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimulatingItn(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleCopyDiagnostics = () => {
    if (!urlDiagnostics) return;
    const report = JSON.stringify(
      {
        diagnostics: urlDiagnostics,
        orderStatus: {
          pollingState,
          orderFound: !!order,
          orderPaymentStatus: order?.paymentStatus,
          orderStatus: order?.status,
        },
      },
      null,
      2
    );
    navigator.clipboard.writeText(report);
    setCopiedDiagnostics(true);
    setTimeout(() => setCopiedDiagnostics(false), 2000);
  };

  // Reusable Diagnostics Card for on-screen inspection
  const renderDiagnosticsCard = () => (
    <div className="pt-4 border-t border-zinc-800/80 text-left">
      <button
        onClick={() => setShowDiagnostics((prev) => !prev)}
        className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 text-[11px] text-zinc-400 font-mono transition-colors border border-zinc-800/60"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-blue-400" />
          <span>PayFast URL &amp; Redirect Diagnostics ({urlDiagnostics?.paramCount || 0} params)</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-500">
          <span>{showDiagnostics ? 'Hide' : 'Inspect'}</span>
          {showDiagnostics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {showDiagnostics && urlDiagnostics && (
        <div className="mt-2 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-mono space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-bold">
              Gateway Parameter Inspection
            </span>
            <button
              onClick={handleCopyDiagnostics}
              className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] transition-colors"
            >
              {copiedDiagnostics ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedDiagnostics ? 'Copied' : 'Copy Report'}</span>
            </button>
          </div>

          <div className="space-y-1.5 text-zinc-400">
            <div>
              <span className="text-zinc-500">Effective Order Reference:</span>{' '}
              <strong className="text-emerald-400">{resolvedOrderId || '(none)'}</strong>
            </div>
            <div>
              <span className="text-zinc-500">Resolved Mode:</span>{' '}
              <span className="text-white">{mode}</span>
            </div>
            <div>
              <span className="text-zinc-500">Current Polling State:</span>{' '}
              <span
                className={
                  pollingState === 'paid'
                    ? 'text-emerald-400 font-bold'
                    : pollingState === 'failed'
                    ? 'text-rose-400 font-bold'
                    : 'text-blue-400 font-bold'
                }
              >
                {pollingState.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-zinc-500">ITN Fields in Query:</span>{' '}
              <span
                className={
                  urlDiagnostics.hasItnPayload ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'
                }
              >
                {urlDiagnostics.hasItnPayload ? 'Detected in URL' : 'None in URL (Standard Hosted Flow)'}
              </span>
            </div>
            <div>
              <span className="text-zinc-500">Full Query String:</span>{' '}
              <span className="text-zinc-300 break-all">{urlDiagnostics.search || '(none)'}</span>
            </div>
          </div>

          <div>
            <span className="text-zinc-500 text-[10px] block mb-1">Parsed Parameters JSON:</span>
            <pre className="p-2.5 rounded bg-zinc-950 border border-zinc-800/80 text-[10px] text-zinc-300 overflow-x-auto max-h-40">
              {JSON.stringify(urlDiagnostics.params, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );

  const displayOrderId = resolvedOrderId || orderId;

  // ==========================================
  // STATE 1: CANCEL VIEW (User Cancelled on PayFast)
  // ==========================================
  if (mode === 'cancel') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        <div className="bg-zinc-950 border border-orange-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-orange-950/20 text-center space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-full bg-orange-500/15 border border-orange-500/40 flex items-center justify-center mx-auto text-orange-400 shadow-lg shadow-orange-500/20">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider">
              <span>Checkout Cancelled by Customer</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display text-white">
              PayFast Checkout Was Cancelled
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
              You cancelled the transaction on PayFast. No funds were debited from your bank account or card. Your shopping bag items have been preserved.
            </p>
          </div>

          {displayOrderId && (
            <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-xs text-zinc-400 inline-block">
              Order Reference: <strong className="text-white font-mono">#{displayOrderId}</strong>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-zinc-800">
            <button
              onClick={onContinueShopping}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs sm:text-sm transition-colors shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Return to Bag &amp; Retry Checkout</span>
            </button>
            <a
              href={`https://wa.me/27${brandConfig.ownerWhatsApp.replace(/^0/, '')}?text=${encodeURIComponent(
                `Hi ${brandConfig.brandName}, I was checking out order #${displayOrderId} on PayFast and had an issue.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs sm:text-sm border border-zinc-800 transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Brand Support</span>
            </a>
          </div>

          {renderDiagnosticsCard()}
        </div>
      </div>
    );
  }

  // ==========================================
  // STATE 2: FAILED STATE (Declined / Gateway Error)
  // ==========================================
  if (
    pollingState === 'failed' ||
    (order && (order.paymentStatus === 'failed' || (order.paymentStatus as any) === 'cancelled' || order.status === 'cancelled'))
  ) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        <div className="bg-zinc-950 border border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/20 text-center space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-full bg-rose-500/15 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-500/20">
            <XCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <span>Payment Verification Failed</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display text-white">
              Payment Could Not Be Completed
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
              PayFast reported that this transaction could not be completed or was declined by the card issuing bank. No funds have been accepted for this order.
            </p>
          </div>

          {displayOrderId && (
            <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-xs text-zinc-400 inline-block">
              Order Reference: <strong className="text-white font-mono">#{displayOrderId}</strong>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-zinc-800">
            <button
              onClick={onContinueShopping}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm transition-colors shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Retry Payment</span>
            </button>
            <a
              href={`https://wa.me/27${brandConfig.ownerWhatsApp.replace(/^0/, '')}?text=${encodeURIComponent(
                `Hi ${brandConfig.brandName}, my payment for order #${displayOrderId} failed on PayFast. Could you assist me?`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs sm:text-sm border border-zinc-800 transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Brand Support</span>
            </a>
          </div>

          {renderDiagnosticsCard()}
        </div>
      </div>
    );
  }

  // ==========================================
  // STATE 3: ORDER ERROR NOT FOUND
  // ==========================================
  if (errorMsg && !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-rose-500/15 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white font-display">Order Verification Notice</h2>
          <p className="text-xs text-zinc-400">{errorMsg}</p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => fetchOrderStatus()}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 text-white font-bold text-xs hover:bg-zinc-700"
            >
              Retry Verification
            </button>
            <button
              onClick={onContinueShopping}
              className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-xs hover:bg-orange-400"
            >
              Return to Store
            </button>
          </div>
          {renderDiagnosticsCard()}
        </div>
      </div>
    );
  }

  // ==========================================
  // STATE 4: TIMED OUT REASSURANCE VIEW
  // ==========================================
  if (pollingState === 'timed_out' && order?.paymentStatus !== 'paid') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        <div className="bg-zinc-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-950/20 text-center space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/20">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <span>Payment Notification Pending</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display text-white">
              Confirmation Still Processing
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
              We received your return from PayFast. The payment notification is taking slightly longer than usual to arrive from the banking network.
            </p>
          </div>

          <div className="p-4 bg-zinc-900/90 rounded-2xl border border-zinc-800 text-left space-y-2.5 text-xs max-w-md mx-auto">
            <div className="flex justify-between text-zinc-400">
              <span>Order Reference:</span>
              <strong className="text-white font-mono">#{displayOrderId}</strong>
            </div>
            {order && (
              <>
                <div className="flex justify-between text-zinc-400">
                  <span>Customer:</span>
                  <span className="text-white">{order?.customer?.fullName || 'LASS Customer'}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Total Due:</span>
                  <strong className="text-emerald-400 font-bold">{formatZAR(order?.estimatedTotal || 0)}</strong>
                </div>
              </>
            )}
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-[11px] leading-relaxed">
              <strong>Notice:</strong> If funds have been debited from your account or card, your payment is secure. <strong>You do not need to pay again.</strong>
            </div>

            {/* Sandbox ITN Helper Button when testing in sandbox environment */}
            {isSandboxEnv && (
              <div className="pt-2 flex flex-col items-center gap-1.5">
                <button
                  onClick={handleSimulateSandboxItn}
                  disabled={simulatingItn}
                  className="text-xs text-orange-400 hover:text-orange-300 underline font-semibold flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {simulatingItn ? 'Processing signed sandbox ITN...' : 'Fast-Track Sandbox ITN Callback (Test Mode)'}
                  </span>
                </button>
                <p className="text-[10px] text-zinc-500 text-center">
                  Emulates the official PayFast server-to-server webhook callback for test verification.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-zinc-800">
            <button
              onClick={startPollingCycle}
              disabled={isVerifying}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>Check Status Again</span>
            </button>
            <a
              href={`https://wa.me/27${brandConfig.ownerWhatsApp.replace(/^0/, '')}?text=${encodeURIComponent(
                `Hi ${brandConfig.brandName}, I just paid for order #${displayOrderId} on PayFast (${
                  order ? formatZAR(order.estimatedTotal) : ''
                }). Could you please confirm payment receipt on your dashboard?`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm border border-zinc-800 transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Brand Owner</span>
            </a>
          </div>

          {renderDiagnosticsCard()}
        </div>
      </div>
    );
  }

  // ==========================================
  // STATE 5: WAITING / PENDING ITN VERIFICATION VIEW
  // ==========================================
  const isPaid = order?.paymentStatus === 'paid';

  if (!isPaid) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        <div className="bg-zinc-950 border border-blue-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-950/20 text-center space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-full bg-blue-500/15 border border-blue-500/40 flex items-center justify-center mx-auto text-blue-400 shadow-lg shadow-blue-500/20">
            <RefreshCw className={`w-8 h-8 ${isVerifying ? 'animate-spin' : ''}`} />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
              <span>Awaiting Gateway Confirmation ({elapsedSeconds}s)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display text-white">
              Confirming Payment with PayFast
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
              We received your return from PayFast. Our server is awaiting the Instant Transaction Notification (ITN) and cryptographic confirmation from PayFast.
            </p>
          </div>

          {/* Visual 4-Step Checkout Stepper */}
          <div className="grid grid-cols-4 gap-2 text-[10px] sm:text-xs max-w-md mx-auto pt-1">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex flex-col items-center text-center">
              <span className="font-bold">1. Order</span>
              <span className="text-[10px] opacity-80">Placed ✓</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex flex-col items-center text-center">
              <span className="font-bold">2. PayFast</span>
              <span className="text-[10px] opacity-80">Processed ✓</span>
            </div>
            <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/40 text-blue-400 flex flex-col items-center text-center animate-pulse">
              <span className="font-bold">3. Verify ITN</span>
              <span className="text-[10px] font-semibold">Active ↻</span>
            </div>
            <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 flex flex-col items-center text-center">
              <span className="font-bold">4. Dispatch</span>
              <span className="text-[10px]">PAXI PEP ○</span>
            </div>
          </div>

          <div className="p-4 bg-zinc-900/80 rounded-2xl border border-zinc-800 text-left space-y-2 text-xs max-w-md mx-auto">
            <div className="flex justify-between text-zinc-400">
              <span>Order Number:</span>
              <strong className="text-white font-mono">#{displayOrderId}</strong>
            </div>
            {order && (
              <>
                <div className="flex justify-between text-zinc-400">
                  <span>Customer Name:</span>
                  <span className="text-white">{order?.customer?.fullName || 'LASS Customer'}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Total Amount:</span>
                  <strong className="text-emerald-400 font-bold">{formatZAR(order?.estimatedTotal || 0)}</strong>
                </div>
              </>
            )}
            <div className="flex justify-between text-zinc-400 pt-2 border-t border-zinc-800">
              <span>Verification Status:</span>
              <span className="text-blue-400 flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Checking gateway (check #{pollCount})...</span>
              </span>
            </div>
          </div>

          {/* Sandbox ITN Helper Button (Only visible in sandbox mode, strictly hidden in production) */}
          {isSandboxEnv && (
            <div className="pt-2 flex flex-col items-center gap-2">
              <button
                onClick={handleSimulateSandboxItn}
                disabled={simulatingItn}
                className="text-xs text-orange-400 hover:text-orange-300 underline font-semibold flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {simulatingItn ? 'Processing signed sandbox ITN...' : 'Fast-Track Sandbox ITN Callback (Test Mode)'}
                </span>
              </button>
              <p className="text-[10px] text-zinc-500">
                Emulates the official PayFast server-to-server webhook callback for test verification.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-zinc-800">
            <button
              onClick={() => fetchOrderStatus()}
              disabled={isVerifying}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>Check Status Now</span>
            </button>
            <button
              onClick={onContinueShopping}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-900 text-zinc-300 font-bold text-xs hover:text-white transition-colors"
            >
              Continue Browsing
            </button>
          </div>

          {renderDiagnosticsCard()}
        </div>
      </div>
    );
  }

  // ==========================================
  // STATE 6: VERIFIED SUCCESSFUL PAYMENT RECEIPT VIEW
  // ==========================================
  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
        <p className="text-zinc-400 text-sm">Loading order details...</p>
      </div>
    );
  }

  const safeCustomer = order.customer || {
    fullName: 'LASS Customer',
    phoneOrWhatsApp: '',
    email: '',
    deliveryMethod: 'collection',
    pepStoreBranch: '',
    deliveryAddress: '',
  };
  const deliveryMethodStr = (safeCustomer.deliveryMethod || 'collection').toUpperCase();

  const orderWhatsAppText = `*LASS BRAND CLOTHES — ONLINE PAYMENT CONFIRMED*\n\n• Order Ref: #${
    order.orderNumber || displayOrderId
  }\n• Customer: ${safeCustomer.fullName}\n• Cell/WhatsApp: ${safeCustomer.phoneOrWhatsApp}\n• PayFast Ref: ${
    order.transactionId || 'PAID'
  }\n• Total Paid: ${formatZAR(order.estimatedTotal || 0)}\n• Delivery: ${deliveryMethodStr}\n• Destination: ${
    safeCustomer.pepStoreBranch || safeCustomer.deliveryAddress || 'N/A'
  }\n${order.paxiTrackingCode ? `• PAXI Tracking: ${order.paxiTrackingCode}\n` : ''}\nThank you! Please prepare parcel for dispatch.`;
  const whatsappUrl = buildWhatsAppLink(brandConfig.ownerWhatsApp, orderWhatsAppText);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="bg-zinc-950 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/20 space-y-6 animate-in fade-in duration-300">
        {/* Verified Badge Header */}
        <div className="text-center space-y-2 border-b border-zinc-800 pb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PayFast Verified Payment Confirmed</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black font-display text-white">
            Thank You For Your Order!
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
            Your payment was securely authenticated by PayFast and verified by our server. Your LASS pieces have been queued for packaging and dispatch.
          </p>
        </div>

        {/* Essential Order Details Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
              Order Reference
            </span>
            <span className="font-mono font-bold text-white text-base">
              #{order.orderNumber || displayOrderId}
            </span>
            <span className="text-[10px] text-emerald-400 block font-semibold">
              Payment Status: PAID
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
              PayFast Transaction ID
            </span>
            <span className="font-mono font-bold text-blue-400 text-sm truncate block">
              {order.transactionId || 'PF-CONFIRMED'}
            </span>
            <span className="text-[10px] text-zinc-500 block">
              ZAR Amount: {formatZAR(order.estimatedTotal)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
              PAXI Dispatch Code
            </span>
            <span className="font-mono font-bold text-orange-400 text-sm block">
              {order.paxiTrackingCode || 'GENERATING...'}
            </span>
            <span className="text-[10px] text-zinc-500 block">
              PEP Counter Pickup
            </span>
          </div>
        </div>

        {/* Customer & Destination Summary */}
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3 text-xs">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-400" />
            <span>Delivery &amp; Customer Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-300">
            <div>
              <span className="text-zinc-500 block text-[11px]">Recipient:</span>
              <strong className="text-white">{safeCustomer.fullName}</strong>
              <div className="text-zinc-400 text-[11px]">{safeCustomer.phoneOrWhatsApp}</div>
              {safeCustomer.email && (
                <div className="text-zinc-400 text-[11px]">{safeCustomer.email}</div>
              )}
            </div>

            <div>
              <span className="text-zinc-500 block text-[11px]">Delivery Option:</span>
              <strong className="text-white">
                {safeCustomer.deliveryMethod === 'paxi-express'
                  ? 'PAXI Express PEP Store (3-5 business days)'
                  : safeCustomer.deliveryMethod === 'collection'
                  ? 'Local Pick-Up / Studio Collection'
                  : 'PAXI Standard PEP Store (5-10 business days)'}
              </strong>
              {safeCustomer.pepStoreBranch && (
                <div className="text-emerald-400 text-[11px] mt-0.5">
                  Point: {safeCustomer.pepStoreBranch}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Summary */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider text-zinc-400">
            Ordered Streetwear Pieces
          </h4>
          <div className="space-y-2 divide-y divide-zinc-800/80">
            {order.items?.map((item, idx) => (
              <div key={idx} className="pt-2 flex justify-between items-center text-zinc-300">
                <div>
                  <strong className="text-white">{item.name}</strong>
                  <div className="text-[11px] text-zinc-400">
                    Size: {item.selectedSize} &bull; Colour: {item.selectedColour} &bull; Qty: {item.quantity}
                  </div>
                </div>
                <div className="font-mono font-bold text-white text-sm">
                  {formatZAR(item.totalPrice)}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-zinc-800 space-y-1 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal:</span>
              <span className="font-mono text-white">{formatZAR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Delivery Fee:</span>
              <span className="font-mono text-white">
                {order.deliveryFee === 0 ? 'FREE' : formatZAR(order.deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-zinc-800/60">
              <span>Total Paid via PayFast:</span>
              <span className="font-mono text-emerald-400 text-base">
                {formatZAR(order.estimatedTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Dispatch Alert</span>
            </a>

            <button
              onClick={handlePrintReceipt}
              className="px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>

          <button
            onClick={onContinueShopping}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/20"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {renderDiagnosticsCard()}
      </div>
    </div>
  );
};
