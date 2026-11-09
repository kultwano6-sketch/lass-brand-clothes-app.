import React, { useState } from 'react';
import {
  CheckCircle2,
  Package,
  Truck,
  Store,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  MapPin,
  Calendar,
  AlertCircle,
  Clock,
  ShieldCheck,
  Info
} from 'lucide-react';
import { SubmittedOrder, BrandConfig } from '../types';
import { formatZAR } from '../utils/whatsapp';

interface ShipmentProgressIndicatorProps {
  order: SubmittedOrder;
  brandConfig: BrandConfig;
  compact?: boolean;
  className?: string;
}

export interface ShipmentStage {
  id: string;
  name: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const ShipmentProgressIndicator: React.FC<ShipmentProgressIndicatorProps> = ({
  order,
  brandConfig,
  compact = false,
  className = '',
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  // Define the 5 canonical customer shipment stages
  const stages: ShipmentStage[] = [
    {
      id: 'confirmed',
      name: 'Order Confirmed',
      shortLabel: 'Confirmed',
      description:
        order.paymentStatus === 'paid'
          ? 'Payment authenticated via PayFast and verified by server'
          : 'Order logged & awaiting payment or WhatsApp verification',
      icon: CheckCircle2,
    },
    {
      id: 'processing',
      name: 'Processing & Packing',
      shortLabel: 'Processing',
      description:
        'Garments pulled from inventory, print quality inspected & sealed in official LASS packaging',
      icon: Package,
    },
    {
      id: 'with_paxi',
      name: 'With PAXI Courier',
      shortLabel: 'With PAXI',
      description: order.paxiTrackingCode
        ? `Bagged and registered into the PAXI / PEP logistics network (Bag #${order.paxiTrackingCode})`
        : 'Parcel handed over to courier for cross-provincial transit',
      icon: Truck,
    },
    {
      id: 'ready_for_collection',
      name: 'Ready for Collection',
      shortLabel: 'Ready at PEP',
      description: `Parcel has arrived at ${order.customer.pepStoreBranch || 'your destination PEP store counter'}. Counter pickup is open!`,
      icon: Store,
    },
    {
      id: 'completed',
      name: 'Collected & Completed',
      shortLabel: 'Delivered',
      description: 'Customer collected parcel from PEP store counter with SMS OTP PIN',
      icon: Sparkles,
    },
  ];

  // Map internal order status to stage index and percentage across the 10-status lifecycle
  const getStageInfo = (status: SubmittedOrder['status']) => {
    switch (status) {
      case 'cancelled':
        return { index: -1, percent: 0, label: 'Cancelled', isCancelled: true, isRefund: false };
      case 'refund_pending':
        return { index: -1, percent: 0, label: 'Refund Pending', isCancelled: false, isRefund: true };
      case 'refunded':
        return { index: -1, percent: 0, label: 'Refund Completed', isCancelled: false, isRefund: true };
      case 'awaiting_payment':
      case 'pending_payment':
      case 'whatsapp_generated':
        return { index: 0, percent: 15, label: 'Awaiting Payment', isCancelled: false, isRefund: false };
      case 'payment_confirmed':
        return { index: 0, percent: 25, label: 'Payment Confirmed', isCancelled: false, isRefund: false };
      case 'processing':
      case 'pending_verification':
        return { index: 1, percent: 45, label: 'Processing & Quality Check', isCancelled: false, isRefund: false };
      case 'ready_for_dispatch':
        return { index: 1, percent: 55, label: 'Packed & Ready for Dispatch', isCancelled: false, isRefund: false };
      case 'dispatched':
      case 'dispatched_paxi':
        return { index: 2, percent: 70, label: 'Dispatched (With PAXI / Courier)', isCancelled: false, isRefund: false };
      case 'out_for_delivery':
      case 'ready_for_collection':
        return { index: 3, percent: 90, label: 'Ready for Collection at PEP Counter', isCancelled: false, isRefund: false };
      case 'delivered':
      case 'completed':
        return { index: 4, percent: 100, label: 'Collected / Delivered', isCancelled: false, isRefund: false };
      default:
        return { index: 0, percent: 15, label: 'Order Registered', isCancelled: false, isRefund: false };
    }
  };

  const { index: currentStageIndex, percent: progressPercent, label: currentStatusLabel, isCancelled, isRefund } =
    getStageInfo(order.status);

  const handleCopyTrackingCode = () => {
    if (!order.paxiTrackingCode) return;
    navigator.clipboard.writeText(order.paxiTrackingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Determine delivery timeframe estimate based on deliveryMethod
  const deliveryEstimate =
    order.customer.deliveryMethod === 'paxi-express'
      ? '3-5 Business Days (PAXI Express)'
      : order.customer.deliveryMethod === 'collection'
      ? 'Same Day / Next Day Pick-up'
      : `${brandConfig.paxiLeadDays || '5-10 business days'} (PAXI Standard)`;

  // If order was cancelled, render warning indicator
  if (isCancelled) {
    return (
      <div
        className={`p-5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 space-y-3 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-black text-white text-base">Shipment Cancelled</h4>
            <p className="text-xs text-rose-300">
              This order was marked as cancelled. Any pending shipment has been halted.
            </p>
          </div>
        </div>
        {order.statusNotes && (
          <div className="p-3 rounded-xl bg-rose-900/30 border border-rose-800/40 text-xs text-rose-200">
            <span className="font-bold block text-[10px] uppercase tracking-wider text-rose-400">
              Cancellation Note:
            </span>
            <p className="mt-0.5">{order.statusNotes}</p>
          </div>
        )}
      </div>
    );
  }

  // If order is refund_pending or refunded
  if (isRefund) {
    const isCompleted = order.status === 'refunded';
    return (
      <div
        className={`p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 space-y-3 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-black text-white text-base">
              {isCompleted ? 'Refund Processed & Closed' : 'Refund In Review'}
            </h4>
            <p className="text-xs text-amber-300">
              {isCompleted
                ? `ZAR ${order.estimatedTotal.toFixed(2)} refunded to original payment method.`
                : 'Customer service has logged a refund request. Funds return within 2-4 business days.'}
            </p>
          </div>
        </div>
        {order.statusNotes && (
          <div className="p-3 rounded-xl bg-amber-900/30 border border-amber-800/40 text-xs text-amber-200">
            <span className="font-bold block text-[10px] uppercase tracking-wider text-amber-400">
              Refund Note:
            </span>
            <p className="mt-0.5">{order.statusNotes}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl bg-zinc-900/90 border border-zinc-800 p-4 sm:p-5 space-y-5 shadow-lg ${className}`}
      aria-label="Shipment Progress"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-zinc-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase font-black tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2.5 py-0.5 rounded-full">
              Live Shipment Tracking
            </span>
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                currentStageIndex >= 3
                  ? 'bg-blue-600 text-white'
                  : currentStageIndex >= 1
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              Stage {currentStageIndex + 1} of 5 &bull; {currentStatusLabel}
            </span>
          </div>
          <h3 className="font-display font-black text-base sm:text-lg text-white">
            {stages[currentStageIndex]?.name || 'Shipment In Progress'}
          </h3>
        </div>

        {/* ETA Badge */}
        <div className="flex items-center gap-2 self-start sm:self-center px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300">
          <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase font-bold">Estimated Delivery</span>
            <span className="font-bold text-white text-[11px] sm:text-xs">{deliveryEstimate}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar with glowing active fill */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[11px] text-zinc-400 font-medium">
          <span>Overall Shipment Completion</span>
          <span className="font-mono font-bold text-emerald-400">{progressPercent}%</span>
        </div>
        <div
          className="relative h-2.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-orange-500 rounded-full transition-all duration-700 ease-out relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Visual Stepper Nodes: Desktop Horizontal & Mobile Connected Stepper */}
      {!compact && (
        <div className="relative pt-2">
          {/* Desktop / Tablet Stepper (5 columns) */}
          <div className="hidden md:grid md:grid-cols-5 gap-2 relative">
            {/* Connecting baseline behind nodes */}
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-zinc-800 -z-0" />

            {stages.map((stg, i) => {
              const isDone = i < currentStageIndex;
              const isCurrent = i === currentStageIndex;
              const isFuture = i > currentStageIndex;
              const IconComp = stg.icon;

              return (
                <div key={stg.id} className="relative z-10 flex flex-col items-center text-center group">
                  {/* Circle Badge */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-orange-500 text-white ring-4 ring-orange-500/30 shadow-lg shadow-orange-500/30 scale-110'
                        : isDone
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <IconComp className={`w-4 h-4 ${isCurrent ? 'animate-pulse' : ''}`} />
                    )}
                  </div>

                  {/* Stage Name */}
                  <span
                    className={`mt-2.5 text-xs font-bold leading-tight ${
                      isCurrent
                        ? 'text-orange-400 font-black'
                        : isDone
                        ? 'text-white'
                        : 'text-zinc-500'
                    }`}
                  >
                    {stg.shortLabel}
                  </span>

                  {/* Subtitle status badge */}
                  <span
                    className={`text-[10px] mt-0.5 uppercase tracking-wider font-semibold ${
                      isCurrent
                        ? 'text-orange-300'
                        : isDone
                        ? 'text-emerald-400'
                        : 'text-zinc-600'
                    }`}
                  >
                    {isCurrent ? 'Current' : isDone ? 'Done ✓' : `Step ${i + 1}`}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Mobile Stepper (Stacked with vertical connected line) */}
          <div className="md:hidden space-y-3 relative pl-6 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-800">
            {stages.map((stg, i) => {
              const isDone = i < currentStageIndex;
              const isCurrent = i === currentStageIndex;
              const IconComp = stg.icon;

              return (
                <div key={stg.id} className="relative group">
                  {/* Status Dot */}
                  <div
                    className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                      isCurrent
                        ? 'bg-orange-500 text-white ring-4 ring-orange-500/30 shadow-md font-black scale-105'
                        : isDone
                        ? 'bg-emerald-500 text-white ring-4 ring-zinc-950 font-bold'
                        : 'bg-zinc-800 text-zinc-500 ring-4 ring-zinc-950 border border-zinc-700'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <IconComp className="w-3 h-3" />}
                  </div>

                  {/* Details */}
                  <div
                    className={`p-2.5 rounded-xl transition-colors ${
                      isCurrent
                        ? 'bg-orange-500/10 border border-orange-500/30'
                        : isDone
                        ? 'bg-zinc-950/40 border border-zinc-800/60'
                        : 'opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h5
                        className={`text-xs font-bold ${
                          isCurrent
                            ? 'text-orange-400 font-black'
                            : isDone
                            ? 'text-white'
                            : 'text-zinc-400'
                        }`}
                      >
                        {stg.name}
                      </h5>
                      <span
                        className={`text-[9px] uppercase tracking-wider font-mono font-bold px-1.5 py-0.5 rounded ${
                          isCurrent
                            ? 'bg-orange-500 text-white'
                            : isDone
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                            : 'text-zinc-500'
                        }`}
                      >
                        {isCurrent ? 'IN PROGRESS' : isDone ? 'COMPLETED' : `STEP ${i + 1}`}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                      {stg.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PAXI Tracking & Destination Information Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Destination PEP Branch */}
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-bold uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Delivery Destination</span>
          </div>
          <div className="text-white font-bold text-xs sm:text-sm">
            {order.customer.pepStoreBranch || 'Gauteng Studio / Counter Pickup'}
          </div>
          <p className="text-[11px] text-zinc-400">
            Recipient: <strong className="text-zinc-200">{order.customer.fullName}</strong> &bull;{' '}
            {order.customer.phoneOrWhatsApp}
          </p>
        </div>

        {/* Live PAXI Tracking Number & 1-Click Track Button */}
        <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-blue-300 font-bold uppercase tracking-wider text-[11px]">
              <Truck className="w-3.5 h-3.5 text-blue-400" />
              <span>PAXI Bag Barcode</span>
            </span>
            {order.paxiTrackingCode && (
              <button
                onClick={handleCopyTrackingCode}
                className="flex items-center gap-1 text-[10px] text-blue-300 hover:text-white px-2 py-0.5 rounded bg-blue-900/40 hover:bg-blue-800/60 border border-blue-700/50 transition-colors"
                title="Copy tracking number"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          {order.paxiTrackingCode ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-mono font-black text-sm text-white tracking-wider">
                {order.paxiTrackingCode}
              </span>
              <a
                href={`https://www.paxi.co.za/track?tracking_number=${order.paxiTrackingCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all shrink-0 active:scale-95"
              >
                <span>Track on PAXI.co.za</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-xs text-zinc-400 italic">
                {currentStageIndex < 2
                  ? 'PAXI tracking bag number will be registered once garments are packed and dropped at PEP.'
                  : 'PAXI tracking code is being uploaded by dispatch...'}
              </div>
              <span className="text-[10px] text-blue-400 block font-mono">
                Status: {currentStatusLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Special Security Advisory for PEP Store Pickup */}
      {currentStageIndex >= 2 && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-200">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="text-white block font-semibold">PEP Store Collection Checklist:</strong>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              When PAXI delivers your parcel to{' '}
              <strong className="text-white">{order.customer.pepStoreBranch || 'the PEP store'}</strong>, you will
              receive an SMS containing a <strong>4-digit collection PIN</strong>. Please present this PIN along with
              your South African ID or Passport at the counter to collect.
            </p>
          </div>
        </div>
      )}

      {/* Owner Dispatch Note (if provided by admin) */}
      {order.statusNotes && (
        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[10px] uppercase tracking-wider text-emerald-400 block">
              Official Dispatch &amp; Fulfilment Note:
            </span>
            <p className="text-zinc-200 mt-0.5">{order.statusNotes}</p>
          </div>
        </div>
      )}
    </div>
  );
};
