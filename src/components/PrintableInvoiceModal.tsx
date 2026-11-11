import React, { useRef } from 'react';
import { X, Printer, Package, Truck, CheckCircle2, ShieldCheck, Copy, Check, FileText } from 'lucide-react';
import { SubmittedOrder, BrandConfig } from '../types';
import { formatZAR } from '../utils/whatsapp';

interface PrintableInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: SubmittedOrder | null;
  brandConfig: BrandConfig;
}

export const PrintableInvoiceModal: React.FC<PrintableInvoiceModalProps> = ({
  isOpen,
  onClose,
  order,
  brandConfig,
}) => {
  const [copied, setCopied] = React.useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySlip = () => {
    const textSlip = [
      `========================================`,
      `       LASS BRAND CLOTHES — TAX INVOICE & SLIP`,
      `          HARVEST KE LASS • EST. 2020`,
      `========================================`,
      `Order Ref: #${order.orderNumber}`,
      `Date: ${new Date(order.date).toLocaleDateString()} ${new Date(order.date).toLocaleTimeString()}`,
      `Payment Status: ${(order.paymentStatus || 'PENDING').toUpperCase()}`,
      `Payment Method: ${(order.paymentMethod || 'MANUAL_EFT').toUpperCase()}`,
      order.transactionId ? `Transaction ID: ${order.transactionId}` : '',
      `----------------------------------------`,
      `CUSTOMER DETAILS`,
      `Name: ${order.customer.fullName}`,
      `Phone/WhatsApp: ${order.customer.phoneOrWhatsApp}`,
      order.customer.email ? `Email: ${order.customer.email}` : '',
      `----------------------------------------`,
      `PAXI PEP STORE DISPATCH`,
      `Method: ${order.customer.deliveryMethod.replace('-', ' ').toUpperCase()}`,
      `PEP Store Branch: ${order.customer.pepStoreBranch || 'Gauteng Studio'}`,
      order.paxiTrackingCode ? `PAXI Bag Barcode: ${order.paxiTrackingCode}` : 'PAXI Bag Barcode: Pending PEP Counter drop-off',
      `----------------------------------------`,
      `ITEMS ORDERED:`,
      ...order.items.map(
        (it) => `• ${it.name} [Size: ${it.selectedSize}, Col: ${it.selectedColour}] x${it.quantity} = ${formatZAR(it.totalPrice)}`
      ),
      `----------------------------------------`,
      `Subtotal: ${formatZAR(order.subtotal || order.estimatedTotal - order.deliveryFee)}`,
      `PAXI Delivery: ${order.deliveryFee === 0 ? 'Direct Collection (R0)' : formatZAR(order.deliveryFee)}`,
      `TOTAL: ${formatZAR(order.estimatedTotal)}`,
      `========================================`,
      `Enquiries: WhatsApp ${brandConfig.displayWhatsApp} | ${brandConfig.email}`,
      `Thank you for rocking authentic LASS Streetwear!`,
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(textSlip).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Modal Container */}
      <div
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Action Bar */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-400" />
            <div>
              <h3 className="font-display font-black text-base text-white">
                Invoice &amp; PEP Dispatch Slip
              </h3>
              <p className="text-xs text-zinc-400">Order #{order.orderNumber} • Print-ready format</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySlip}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition-colors border border-zinc-700"
              title="Copy text summary"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{copied ? 'Copied!' : 'Copy Slip'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-orange-500/20 active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-zinc-900/40 print:bg-white print:p-0 print:m-0">
          <div
            ref={printAreaRef}
            className="w-full bg-white text-zinc-900 rounded-2xl p-6 sm:p-8 shadow-xl border border-zinc-200 print:border-none print:shadow-none print:rounded-none print:p-4 text-xs font-sans leading-relaxed"
          >
            {/* Top Brand Header */}
            <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-2xl tracking-wider text-black uppercase">
                    LASS
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 rounded">
                    Streetwear
                  </span>
                </div>
                <p className="font-bold text-zinc-700 text-[11px] mt-1">
                  HARVEST KE LASS • EST. 2020
                </p>
                <p className="text-zinc-500 text-[10px]">
                  Gauteng, South Africa • WhatsApp: {brandConfig.displayWhatsApp}
                </p>
                <p className="text-zinc-500 text-[10px]">
                  Email: {brandConfig.email}
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded bg-zinc-100 text-zinc-800 font-mono font-black text-sm tracking-wider uppercase border border-zinc-300">
                  #{order.orderNumber}
                </span>
                <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                  {new Date(order.date).toLocaleDateString()} • {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className="mt-1">
                  {order.paymentStatus === 'paid' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 uppercase">
                      ✓ PAID ({order.paymentMethod?.toUpperCase() || 'ONLINE'})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-300 uppercase">
                      • PAYMENT PENDING
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Customer & PAXI Delivery Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-zinc-200">
              {/* Recipient */}
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1">
                  Customer / Recipient
                </span>
                <p className="font-black text-zinc-900 text-sm">{order.customer.fullName}</p>
                <p className="font-mono text-zinc-700 text-xs mt-0.5 font-bold">
                  Cell: {order.customer.phoneOrWhatsApp}
                </p>
                {order.customer.email && (
                  <p className="text-zinc-500 text-[11px]">{order.customer.email}</p>
                )}
                {order.customer.customerNote && (
                  <p className="text-[10px] text-zinc-600 mt-1 italic border-t border-zinc-200 pt-1">
                    Note: "{order.customer.customerNote}"
                  </p>
                )}
              </div>

              {/* PAXI Shipping Destination */}
              <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-800">
                    PAXI PEP Store Drop-off Point
                  </span>
                  <span className="text-[9px] font-bold uppercase bg-blue-600 text-white px-1.5 py-0.5 rounded">
                    {order.customer.deliveryMethod === 'paxi-express' ? 'Express (3-5d)' : 'Standard (7-9d)'}
                  </span>
                </div>
                <p className="font-black text-zinc-900 text-sm">
                  {order.customer.pepStoreBranch || 'Gauteng Studio Collection'}
                </p>
                <p className="text-[10px] text-zinc-600 mt-0.5">
                  Collection via SMS PIN dispatched to customer cellphone upon counter arrival.
                </p>
                {order.paxiTrackingCode ? (
                  <div className="mt-2 pt-1 border-t border-blue-200 font-mono text-[11px]">
                    <span className="text-blue-800 font-bold">PAXI Bag Barcode: </span>
                    <strong className="text-zinc-900 font-black">{order.paxiTrackingCode}</strong>
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                    Tracking: Pending PEP counter drop-off
                  </p>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-2">
                Order Items &amp; Sizing Specs
              </span>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-300 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    <th className="py-1.5">Garment Description</th>
                    <th className="py-1.5 text-center">Size</th>
                    <th className="py-1.5 text-center">Colour</th>
                    <th className="py-1.5 text-center">Qty</th>
                    <th className="py-1.5 text-right">Unit Price</th>
                    <th className="py-1.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-xs">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50">
                      <td className="py-2.5 font-bold text-zinc-900">
                        {item.name}
                        <span className="block text-[10px] font-normal text-zinc-500">
                          180–200gsm Heavyweight Combed Cotton
                        </span>
                      </td>
                      <td className="py-2.5 text-center font-mono font-bold text-zinc-800">
                        {item.selectedSize}
                      </td>
                      <td className="py-2.5 text-center text-zinc-700 text-[11px]">
                        {item.selectedColour}
                      </td>
                      <td className="py-2.5 text-center font-mono font-bold text-zinc-800">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 text-right font-mono text-zinc-700">
                        {formatZAR(item.unitPrice)}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-zinc-900">
                        {formatZAR(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="border-t-2 border-zinc-900 pt-3 flex justify-end">
              <div className="w-64 space-y-1.5 text-right">
                <div className="flex justify-between text-xs text-zinc-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatZAR(order.subtotal || order.estimatedTotal - order.deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-600">
                  <span>PAXI PEP Delivery:</span>
                  <span className="font-mono">
                    {order.deliveryFee === 0 ? 'Direct Collection (R0)' : formatZAR(order.deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-zinc-900 border-t border-zinc-300 pt-1.5">
                  <span>Total Amount:</span>
                  <span className="font-mono text-base">{formatZAR(order.estimatedTotal)}</span>
                </div>
              </div>
            </div>

            {/* Dispatch & Packing Verification Checklist for Brand Owner */}
            <div className="mt-6 p-3.5 bg-zinc-50 rounded-xl border border-dashed border-zinc-400">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-700 block mb-1.5">
                Dispatch &amp; Quality Check (Brand Owner / PEP Counter Drop)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-zinc-600">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" className="rounded text-black" defaultChecked={order.status !== 'pending_payment'} />
                  <span>Garments Inspected</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" className="rounded text-black" defaultChecked={order.paymentStatus === 'paid'} />
                  <span>Payment Confirmed</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" className="rounded text-black" defaultChecked={Boolean(order.paxiTrackingCode)} />
                  <span>Sealed in PAXI Bag</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" className="rounded text-black" defaultChecked={order.status === 'dispatched_paxi'} />
                  <span>Dropped at PEP</span>
                </label>
              </div>
            </div>

            {/* Visual Simulated Barcode */}
            <div className="mt-5 pt-3 border-t border-zinc-200 flex flex-col items-center justify-center">
              <div className="font-mono tracking-widest text-zinc-400 text-[10px] mb-1">
                * {order.orderNumber} *
              </div>
              {/* Clean SVG Barcode pattern */}
              <div className="h-10 w-64 flex items-center justify-center gap-[2px] opacity-75">
                {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 1, 3, 4, 1, 2, 3, 2, 1, 4].map((width, i) => (
                  <div
                    key={i}
                    className="h-full bg-black"
                    style={{ width: `${width}px` }}
                  />
                ))}
              </div>
              <p className="text-[9px] text-zinc-500 mt-1">
                Authentic LASS Streetwear Packaging Slip • Keep for collection verification
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/90 flex items-center justify-between print:hidden">
          <p className="text-xs text-zinc-400">
            For returns or order queries, WhatsApp: <strong className="text-zinc-200">{brandConfig.displayWhatsApp}</strong>
          </p>
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
