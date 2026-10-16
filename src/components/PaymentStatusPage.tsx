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
  Info
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
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [simulatingItn, setSimulatingItn] = useState(false);
  const hasClearedCartRef = useRef(false);

  const fetchOrderStatus = async () => {
    try {
      setIsVerifying(true);
      const res = await fetch(`/api/payfast/order-status/${encodeURIComponent(orderId)}`);
      if (!res.ok) {
        if (res.status === 404) {
          setErrorMsg(`Order #${orderId} could not be located on the server.`);
        } else {
          setErrorMsg('Unable to retrieve payment verification status.');
        }
        setLoading(false);
        setIsVerifying(false);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setOrder(data);
        setErrorMsg('');

        // Never mark an order paid based only on a browser redirect!
        // ONLY clear cart and show verified state if the server confirmed paymentStatus === 'paid'
        if (data.paymentStatus === 'paid' && !hasClearedCartRef.current) {
          hasClearedCartRef.current = true;
          clearCart();
          saveLocalOrder(data as SubmittedOrder);
        }
      }
    } catch (err: any) {
      console.error('Failed to poll order status:', err);
    } finally {
      setLoading(false);
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (!orderId) {
      setErrorMsg('No order reference provided.');
      setLoading(false);
      return;
    }

    fetchOrderStatus();

    // If returning from PayFast, poll for ITN confirmation up to 15 times (every 2.5s)
    let interval: any = null;
    if (mode === 'return') {
      interval = setInterval(() => {
        setPollCount((prev) => {
          if (prev >= 15) {
            clearInterval(interval);
            return prev;
          }
          fetchOrderStatus();
          return prev + 1;
        });
      }, 2500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [orderId, mode]);

  // Developer / Sandbox Helper: Simulate ITN if in local testing
  const handleSimulateSandboxItn = async () => {
    try {
      setSimulatingItn(true);
      const res = await fetch('/api/payfast/simulate-sandbox-itn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: orderId }),
      });
      const data = await res.json();
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

  // 1. CANCEL VIEW
  if (mode === 'cancel') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-full bg-orange-500/15 border border-orange-500/40 flex items-center justify-center mx-auto text-orange-400">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest font-black text-orange-400">
              Transaction Cancelled
            </span>
            <h1 className="text-2xl sm:text-3xl font-black font-display text-white">
              PayFast Checkout Was Cancelled
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
              You cancelled the transaction on PayFast. No funds were debited from your bank account or card. Your shopping bag items have been preserved.
            </p>
          </div>

          {orderId && (
            <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-xs text-zinc-400 inline-block">
              Order Reference: <strong className="text-white font-mono">{orderId}</strong>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-zinc-800">
            <button
              onClick={onContinueShopping}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs sm:text-sm transition-colors shadow-lg shadow-orange-500/20"
            >
              Return to Bag &amp; Retry Checkout
            </button>
            <a
              href={`https://wa.me/27${brandConfig.ownerWhatsApp.replace(/^0/, '')}?text=${encodeURIComponent(
                `Hi ${brandConfig.brandName}, I was checking out order #${orderId} on PayFast and had an issue.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs sm:text-sm border border-zinc-800 transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Brand Support</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 2. ERROR VIEW
  if (errorMsg && !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-rose-500/15 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white font-display">Order Verification Notice</h2>
          <p className="text-xs text-zinc-400">{errorMsg}</p>
          <button
            onClick={fetchOrderStatus}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 text-white font-bold text-xs hover:bg-zinc-700"
          >
            Retry Verification
          </button>
        </div>
      </div>
    );
  }

  // 3. PENDING ITN VERIFICATION VIEW
  const isPaid = order?.paymentStatus === 'paid';

  if (!isPaid) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-full bg-blue-500/15 border border-blue-500/40 flex items-center justify-center mx-auto text-blue-400">
            <RefreshCw className={`w-8 h-8 ${isVerifying ? 'animate-spin' : ''}`} />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] uppercase tracking-widest font-black text-blue-400">
              Gateway Verification in Progress
            </span>
            <h1 className="text-2xl sm:text-3xl font-black font-display text-white">
              Confirming Payment with PayFast
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
              We received your redirect from PayFast. For security, our server is verifying the Instant Transaction Notification (ITN) and cryptographic signature to confirm receipt of funds.
            </p>
          </div>

          <div className="p-4 bg-zinc-900/80 rounded-2xl border border-zinc-800 text-left space-y-2 text-xs max-w-md mx-auto">
            <div className="flex justify-between text-zinc-400">
              <span>Order Number:</span>
              <strong className="text-white font-mono">#{orderId}</strong>
            </div>
            {order && (
              <>
                <div className="flex justify-between text-zinc-400">
                  <span>Customer Name:</span>
                  <span className="text-white">{order.customer.fullName}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Total Due:</span>
                  <strong className="text-emerald-400 font-bold">{formatZAR(order.estimatedTotal)}</strong>
                </div>
              </>
            )}
            <div className="flex justify-between text-zinc-400 pt-1 border-t border-zinc-800">
              <span>Server ITN Check:</span>
              <span className="text-orange-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Polling gateway (attempt {pollCount}/15)...</span>
              </span>
            </div>
          </div>

          {/* Sandbox ITN Helper Button (Visible for testing sandbox orders) */}
          <div className="pt-2 flex flex-col items-center gap-2">
            <button
              onClick={handleSimulateSandboxItn}
              disabled={simulatingItn}
              className="text-xs text-orange-400 hover:text-orange-300 underline font-semibold flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {simulatingItn
                  ? 'Processing signed sandbox ITN...'
                  : 'Fast-Track Sandbox ITN Callback (Test Mode)'}
              </span>
            </button>
            <p className="text-[10px] text-zinc-500">
              Emulates the official PayFast server-to-server webhook callback for test verification.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-zinc-800">
            <button
              onClick={fetchOrderStatus}
              disabled={isVerifying}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>Check Status Now</span>
            </button>
            <button
              onClick={onContinueShopping}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 text-zinc-300 font-bold text-xs hover:text-white"
            >
              Continue Browsing
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. VERIFIED SUCCESSFUL PAYMENT RECEIPT VIEW
  const orderWhatsAppText = `*LASS BRAND CLOTHES — ONLINE PAYMENT CONFIRMED*\n\n• Order Ref: #${order.orderNumber}\n• Customer: ${order.customer.fullName}\n• Cell/WhatsApp: ${order.customer.phoneOrWhatsApp}\n• PayFast Ref: ${order.transactionId || 'PAID'}\n• Total Paid: ${formatZAR(order.estimatedTotal)}\n• Delivery: ${order.customer.deliveryMethod.toUpperCase()}\n• Destination: ${order.customer.pepStoreBranch || order.customer.deliveryAddress}\n${order.paxiTrackingCode ? `• PAXI Tracking: ${order.paxiTrackingCode}\n` : ''}\nThank you! Please prepare parcel for dispatch.`;
  const whatsappUrl = buildWhatsAppLink(brandConfig.ownerWhatsApp, orderWhatsAppText);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="bg-zinc-950 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in duration-300">
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
              #{order.orderNumber}
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
              <strong className="text-white">{order.customer.fullName}</strong>
              <div className="text-zinc-400 text-[11px]">{order.customer.phoneOrWhatsApp}</div>
              {order.customer.email && (
                <div className="text-zinc-400 text-[11px]">{order.customer.email}</div>
              )}
            </div>

            <div>
              <span className="text-zinc-500 block text-[11px]">Delivery Option:</span>
              <strong className="text-white">
                {order.customer.deliveryMethod === 'paxi-express'
                  ? 'PAXI Express PEP Store (3-5 business days)'
                  : order.customer.deliveryMethod === 'collection'
                  ? 'Local Pick-Up / Studio Collection'
                  : 'PAXI Standard PEP Store (5-10 business days)'}
              </strong>
              {order.customer.pepStoreBranch && (
                <div className="text-emerald-400 text-[11px] mt-0.5">
                  Point: {order.customer.pepStoreBranch}
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
      </div>
    </div>
  );
};
