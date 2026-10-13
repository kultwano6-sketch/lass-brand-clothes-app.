import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { SubmittedOrder, BrandConfig } from '../types';
import { formatZAR, buildWhatsAppLink } from '../utils/whatsapp';
import { getLocalOrders, findOrderByReference } from '../utils/orderStorage';

interface OrderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandConfig: BrandConfig;
  initialOrderRef?: string;
}

export const OrderStatusModal: React.FC<OrderStatusModalProps> = ({
  isOpen,
  onClose,
  brandConfig,
  initialOrderRef = '',
}) => {
  const [searchInput, setSearchInput] = useState(initialOrderRef);
  const [currentOrder, setCurrentOrder] = useState<SubmittedOrder | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentOrders, setRecentOrders] = useState<SubmittedOrder[]>([]);

  useEffect(() => {
    if (isOpen) {
      const orders = getLocalOrders();
      setRecentOrders(orders);
      if (initialOrderRef) {
        setSearchInput(initialOrderRef);
        const found = findOrderByReference(initialOrderRef);
        setCurrentOrder(found);
        setHasSearched(true);
      } else if (orders.length > 0 && !currentOrder) {
        setCurrentOrder(orders[0]);
        setSearchInput(orders[0].orderNumber);
        setHasSearched(true);
      }
    }
  }, [isOpen, initialOrderRef]);

  if (!isOpen) return null;

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchInput.trim()) return;

    setHasSearched(true);
    const found = findOrderByReference(searchInput);
    setCurrentOrder(found);
  };

  const handleSelectRecent = (order: SubmittedOrder) => {
    setSearchInput(order.orderNumber);
    setCurrentOrder(order);
    setHasSearched(true);
  };

  // Status mapping and steps
  const getStatusStepIndex = (status: SubmittedOrder['status']) => {
    switch (status) {
      case 'whatsapp_generated':
        return 0;
      case 'pending_verification':
        return 1;
      case 'payment_confirmed':
        return 2;
      case 'dispatched_paxi':
        return 3;
      case 'ready_for_collection':
      case 'completed':
        return 4;
      default:
        return 0;
    }
  };

  const statusSteps = [
    {
      title: 'WhatsApp Order Sent',
      desc: 'Order details generated and messaged to brand owner',
    },
    {
      title: 'Stock & Fit Verified',
      desc: 'Owner checks physical inventory and sizing availability',
    },
    {
      title: 'Payment Arranged',
      desc: 'Manual EFT or Cash transfer confirmed with brand owner',
    },
    {
      title: 'Dispatched via PAXI',
      desc: 'Bagged and dropped at PEP counter with tracking code',
    },
    {
      title: 'Ready at PEP Store',
      desc: 'SMS collection PIN sent to your phone for counter pickup',
    },
  ];

  const currentStep = currentOrder ? getStatusStepIndex(currentOrder.status) : 0;

  // Build inquiry WhatsApp link
  const followUpWhatsAppUrl = currentOrder
    ? buildWhatsAppLink(
        brandConfig.ownerWhatsApp,
        `👋 *ORDER STATUS QUERY — LASS BRAND CLOTHES*\nRef: *#${currentOrder.orderNumber}*\nCustomer: ${currentOrder.customer.fullName}\n\nHi LASS, I would like to check on my manual order status for this reference!`
      )
    : buildWhatsAppLink(
        brandConfig.ownerWhatsApp,
        `👋 *ORDER STATUS QUERY — LASS BRAND CLOTHES*\nRef: *#${searchInput.trim() || 'NEW'}*\n\nHi LASS, I would like to check on my manual order status!`
      );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header in Royal Blue & Black */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-blue-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg text-white">
                Track Manual WhatsApp Order
              </h2>
              <p className="text-xs text-blue-200">
                Check verification, payment &amp; PAXI PEP delivery status
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Search Box */}
          <div>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Enter Order Reference (e.g. LASS-1234)..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 font-mono uppercase"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-xs uppercase tracking-wider transition-colors shrink-0 shadow-md shadow-orange-500/20"
              >
                Lookup
              </button>
            </form>

            {/* Quick-Pick Recent Orders Chips */}
            {recentOrders.length > 0 && (
              <div className="mt-3 flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-zinc-400 text-[11px]">Recent Orders:</span>
                {recentOrders.slice(0, 4).map((ord) => (
                  <button
                    key={ord.orderNumber}
                    onClick={() => handleSelectRecent(ord)}
                    className={`px-2.5 py-0.5 rounded-lg font-mono text-[11px] font-bold border transition-colors ${
                      currentOrder?.orderNumber === ord.orderNumber
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/50'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    #{ord.orderNumber}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Results Display */}
          {currentOrder ? (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Order Status Banner */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-lg text-orange-400">
                      #{currentOrder.orderNumber}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                        currentOrder.status === 'dispatched_paxi' || currentOrder.status === 'ready_for_collection'
                          ? 'bg-blue-600 text-white border-blue-400'
                          : currentOrder.status === 'payment_confirmed'
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-zinc-800 text-zinc-200 border-zinc-700'
                      }`}
                    >
                      {currentOrder.status.replace(/_/g, ' ')}
                    </span>
                    {currentOrder.paymentStatus === 'paid' && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">
                        ✓ PAID IN-APP ({currentOrder.paymentMethod?.toUpperCase() || 'ONLINE'})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Created: {new Date(currentOrder.date).toLocaleDateString()}
                    {currentOrder.transactionId && (
                      <span className="font-mono text-zinc-400 ml-2">
                        • TXN: <strong className="text-zinc-200">{currentOrder.transactionId}</strong>
                      </span>
                    )}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-zinc-400 block font-semibold">Total Value</span>
                  <span className="font-display font-black text-xl text-white">
                    {formatZAR(currentOrder.estimatedTotal)}
                  </span>
                </div>
              </div>

              {/* Status Stepper Timeline */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  Order Progression Timeline
                </h4>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
                  {statusSteps.map((step, idx) => {
                    const isDone = idx <= currentStep;
                    const isCurrent = idx === currentStep;

                    return (
                      <div key={idx} className="relative group">
                        {/* Status Dot */}
                        <div
                          className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                            isDone
                              ? 'bg-emerald-500 text-white ring-4 ring-zinc-950 font-black'
                              : 'bg-zinc-800 text-zinc-500 ring-4 ring-zinc-950'
                          }`}
                        >
                          {isDone ? '✓' : idx + 1}
                        </div>

                        <div>
                          <h5
                            className={`text-xs font-bold ${
                              isCurrent
                                ? 'text-orange-400 font-black'
                                : isDone
                                ? 'text-white'
                                : 'text-zinc-500'
                            }`}
                          >
                            {step.title}
                          </h5>
                          <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Specific PAXI Tracking Code if dispatched */}
                {currentOrder.paxiTrackingCode && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/40 text-xs text-blue-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-400" />
                      <div>
                        <span className="font-bold text-blue-300 block">PAXI Tracking Bag Number:</span>
                        <span className="font-mono text-white font-bold">{currentOrder.paxiTrackingCode}</span>
                      </div>
                    </div>
                    <a
                      href={`https://www.paxi.co.za/track?tracking_number=${currentOrder.paxiTrackingCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shrink-0 shadow-sm"
                    >
                      <span>PAXI Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Status Notes from Owner if present */}
                {currentOrder.statusNotes && (
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                      Owner Dispatch Note:
                    </span>
                    <p className="text-zinc-200 mt-0.5">{currentOrder.statusNotes}</p>
                  </div>
                )}
              </div>

              {/* Order Item Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  Items In This Order
                </h4>

                <div className="space-y-2">
                  {currentOrder.items.map((it, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-white block">{it.name}</span>
                        <span className="text-zinc-400 text-[11px]">
                          Size: <strong className="text-orange-400">{it.selectedSize}</strong> • {it.selectedColour} • Qty: {it.quantity}
                        </span>
                      </div>
                      <span className="font-mono text-white font-bold text-sm">
                        {formatZAR(it.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Delivery & Customer Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-zinc-300 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800">
                  <div>
                    <span className="text-[10px] uppercase font-black text-emerald-400 block">Customer</span>
                    <span className="text-white font-bold">{currentOrder.customer.fullName}</span>
                    <span className="text-zinc-400 block text-[11px]">{currentOrder.customer.phoneOrWhatsApp}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black text-blue-400 block">Destination</span>
                    <span className="text-white font-bold">
                      {currentOrder.customer.pepStoreBranch || 'Gauteng Collection'}
                    </span>
                    <span className="text-zinc-400 block text-[10px]">
                      Method: {currentOrder.customer.deliveryMethod.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Follow-up on WhatsApp button */}
              <div className="pt-2">
                <a
                  href={followUpWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-transform active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat to Brand Owner on WhatsApp ({brandConfig.displayWhatsApp})</span>
                </a>
              </div>
            </div>
          ) : hasSearched ? (
            /* Order Not Found State */
            <div className="p-8 text-center rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="w-12 h-12 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="font-bold text-white text-base">
                Order #{searchInput} Not Found In Local Storage
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                For the prototype, orders are stored on the browser where they were placed. You can chat with the owner directly to verify any order reference.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center max-w-md mx-auto">
                <a
                  href={followUpWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Ask Owner on WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500 text-xs">
              Enter an order reference above to review your order progression.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-400">
          <span>Manual WhatsApp Fulfilment</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
