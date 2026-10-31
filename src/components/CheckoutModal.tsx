import React, { useState } from 'react';
import {
  X,
  Send,
  Check,
  Truck,
  MapPin,
  User,
  Phone,
  FileText,
  Mail,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Building2,
  QrCode,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Sparkles,
  Smartphone,
  Info,
  Clock,
  ChevronRight,
  AlertTriangle,
  ExternalLink,
  Search,
  CheckCheck
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { BrandConfig, OrderCustomerDetails, SubmittedOrder } from '../types';
import { formatZAR, generateOrderReference, generateWhatsAppOrderMessage, buildWhatsAppLink } from '../utils/whatsapp';
import { saveLocalOrder } from '../utils/orderStorage';
import { POPULAR_PAXI_BRANCHES, PaxiBranch } from '../data/paxiBranches';

const SAVED_CUSTOMER_PROFILE_KEY = 'lass_saved_customer_profile_v1';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandConfig: BrandConfig;
  onOrderSaved?: (order: SubmittedOrder) => void;
  onTrackOrder?: (orderRef: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  brandConfig,
  onOrderSaved,
  onTrackOrder,
}) => {
  const { cart, subtotal, clearCart } = useCart();

  // Step: 'details' -> 'payment' -> 'success'
  const [currentStep, setCurrentStep] = useState<'details' | 'payment' | 'success'>('details');

  // Customer details with fast checkout local memory
  const [customer, setCustomer] = useState<OrderCustomerDetails>(() => {
    try {
      const saved = localStorage.getItem(SAVED_CUSTOMER_PROFILE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          fullName: parsed.fullName || '',
          phoneOrWhatsApp: parsed.phoneOrWhatsApp || '',
          email: parsed.email || '',
          deliveryMethod: parsed.deliveryMethod || 'paxi-standard',
          pepStoreBranch: parsed.pepStoreBranch || '',
          deliveryAddress: parsed.deliveryAddress || '',
          customerNote: parsed.customerNote || '',
        };
      }
    } catch {}
    return {
      fullName: '',
      phoneOrWhatsApp: '',
      email: '',
      deliveryMethod: 'paxi-standard',
      pepStoreBranch: '',
      deliveryAddress: '',
      customerNote: '',
    };
  });

  const [hasSavedProfile, setHasSavedProfile] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(SAVED_CUSTOMER_PROFILE_KEY));
    } catch {
      return false;
    }
  });

  // PAXI PEP branch search and quick selector state
  const [paxiFilterQuery, setPaxiFilterQuery] = useState('');
  const [isPaxiPickerOpen, setIsPaxiPickerOpen] = useState(false);

  // Selected checkout method: 'payfast' (primary official gateway) or 'whatsapp' (manual)
  const [selectedMethod, setSelectedMethod] = useState<'payfast' | 'whatsapp'>('payfast');

  // Loading and redirection state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState('');
  const [validationError, setValidationError] = useState('');

  // Order Reference & Result State
  const [orderRef] = useState(() => generateOrderReference());
  const [finalOrder, setFinalOrder] = useState<SubmittedOrder | null>(null);

  if (!isOpen) return null;

  const deliveryFee =
    customer.deliveryMethod === 'paxi-standard'
      ? subtotal >= 800
        ? 0
        : brandConfig.paxiStandardFee
      : customer.deliveryMethod === 'paxi-express'
      ? brandConfig.paxiExpressFee
      : 0;

  const orderTotal = subtotal + deliveryFee;

  // Validation before proceeding to payment
  const handleValidateDetails = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError('');

    const fullName = customer.fullName.trim();
    if (!fullName || fullName.length < 2) {
      setValidationError('Please enter your full name.');
      return;
    }

    const email = (customer.email || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setValidationError('Please enter a valid email address (required for PayFast payment confirmation).');
      return;
    }

    const phone = customer.phoneOrWhatsApp.trim().replace(/\s+/g, '');
    if (!phone || phone.length < 10) {
      setValidationError('Please enter a valid 10-digit South African mobile or WhatsApp number.');
      return;
    }

    if (customer.deliveryMethod.startsWith('paxi') && !customer.pepStoreBranch.trim()) {
      setValidationError('Please specify your nearest PEP Store branch or town for PAXI pickup.');
      return;
    }

    // Persist customer profile to local storage for fast checkout next time
    try {
      localStorage.setItem(SAVED_CUSTOMER_PROFILE_KEY, JSON.stringify(customer));
      setHasSavedProfile(true);
    } catch {}

    setValidationError('');
    setCurrentStep('payment');
  };

  /**
   * Secure PayFast Hosted Checkout Redirection
   * 1. Calls server endpoint /api/payfast/create-checkout
   * 2. Server generates cryptographic signature using merchant credentials and passphrase
   * 3. Server records initial order in database
   * 4. Client builds and posts signed form to PayFast process URL
   */
  const handleProceedPayFast = async () => {
    try {
      setIsSubmitting(true);
      setValidationError('');
      setRedirectMessage('Initializing secure PayFast session...');

      const res = await fetch('/api/payfast/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          items: cart,
          customOrderRef: orderRef,
        }),
      });

      const data: any = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate PayFast checkout session.');
      }

      setRedirectMessage('Redirecting to PayFast Hosted Gateway...');

      // Save pending order to local storage as backup record
      if (data.order) {
        saveLocalOrder(data.order);
        if (onOrderSaved) onOrderSaved(data.order);
      }

      // Dynamically create and submit PayFast form to official gateway
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.payfastUrl;
      form.style.display = 'none';

      for (const [key, value] of Object.entries(data.payfastData)) {
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value).trim();
          form.appendChild(input);
        }
      }

      document.body.appendChild(form);
      form.submit();
    } catch (err: any) {
      console.error('PayFast checkout error:', err);
      setValidationError(err.message || 'Unable to connect to PayFast. Please try again.');
      setIsSubmitting(false);
      setRedirectMessage('');
    }
  };

  /**
   * Manual WhatsApp Order Fallback
   */
  const handleProceedWhatsAppOnly = () => {
    const messageText = generateWhatsAppOrderMessage({
      orderRef,
      customer,
      items: cart,
      subtotal,
      deliveryFee,
      total: orderTotal,
      brandTagline: brandConfig.tagline,
    });

    const whatsappUrl = buildWhatsAppLink(brandConfig.ownerWhatsApp, messageText);

    const pendingOrder: SubmittedOrder = {
      orderNumber: orderRef,
      date: new Date().toISOString(),
      customer,
      items: cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        selectedSize: item.selectedSize,
        selectedColour: item.selectedColour,
        unitPrice: item.product.price,
        quantity: item.quantity,
        totalPrice: item.product.price * item.quantity,
      })),
      subtotal,
      deliveryFee,
      estimatedTotal: orderTotal,
      whatsappMessageText: messageText,
      whatsappUrl,
      status: 'whatsapp_generated',
      statusNotes: `WhatsApp order generated. Customer discussing with brand owner.`,
      paymentMethod: 'whatsapp',
      paymentStatus: 'pending',
    };

    saveLocalOrder(pendingOrder);
    if (onOrderSaved) onOrderSaved(pendingOrder);
    setFinalOrder(pendingOrder);
    clearCart();
    setCurrentStep('success');

    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-black text-base sm:text-lg text-white">
                {currentStep === 'details'
                  ? 'Delivery & Customer Details'
                  : currentStep === 'payment'
                  ? 'PayFast Secure Checkout'
                  : 'Order Confirmation'}
              </h2>
              <p className="text-[11px] text-zinc-400">
                Order <span className="text-orange-400 font-mono font-bold">#{orderRef}</span> &bull; South African Rands (ZAR)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Step Indicator */}
        {currentStep !== 'success' && (
          <div className="px-5 py-2.5 bg-zinc-900/40 border-b border-zinc-800/80 flex items-center justify-between text-xs">
            <button
              onClick={() => setCurrentStep('details')}
              className={`flex items-center gap-1.5 font-bold transition-colors ${
                currentStep === 'details' ? 'text-orange-400' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                currentStep === 'details' ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}>
                1
              </span>
              <span>Details &amp; Delivery</span>
            </button>

            <ChevronRight className="w-4 h-4 text-zinc-600" />

            <button
              onClick={() => {
                if (customer.fullName && customer.phoneOrWhatsApp) {
                  setCurrentStep('payment');
                }
              }}
              className={`flex items-center gap-1.5 font-bold transition-colors ${
                currentStep === 'payment' ? 'text-orange-400' : 'text-zinc-500'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                currentStep === 'payment' ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}>
                2
              </span>
              <span>PayFast Payment</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-zinc-300">
          {validationError && (
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-300 flex items-start gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* STEP 1: CUSTOMER & DELIVERY DETAILS */}
          {currentStep === 'details' && (
            <form onSubmit={handleValidateDetails} className="space-y-4">
              {/* Saved Customer Profile Fast-Checkout Banner */}
              {hasSavedProfile && customer.fullName && (
                <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center justify-between text-xs animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Fast Checkout:</strong> Loaded saved details for <strong>{customer.fullName.split(' ')[0]}</strong>.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        localStorage.removeItem(SAVED_CUSTOMER_PROFILE_KEY);
                      } catch {}
                      setHasSavedProfile(false);
                      setCustomer({
                        fullName: '',
                        phoneOrWhatsApp: '',
                        email: '',
                        deliveryMethod: 'paxi-standard',
                        pepStoreBranch: '',
                        deliveryAddress: '',
                        customerNote: '',
                      });
                    }}
                    className="text-[11px] text-zinc-400 hover:text-rose-400 transition-colors underline shrink-0 ml-2"
                  >
                    Clear Info
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. Sibusiso Khumalo"
                      value={customer.fullName}
                      onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-white mb-1">
                      Email Address (for PayFast Receipt) *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        placeholder="sbu@gmail.com"
                        value={customer.email}
                        onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white mb-1">
                      WhatsApp / Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        placeholder="072 123 4567"
                        value={customer.phoneOrWhatsApp}
                        onChange={(e) => setCustomer({ ...customer, phoneOrWhatsApp: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Options */}
                <div>
                  <label className="block text-xs font-bold text-white mb-1.5 flex items-center justify-between">
                    <span>Delivery Method</span>
                    {subtotal >= 800 && (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                        FREE PAXI Qualified (R800+)
                      </span>
                    )}
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomer({ ...customer, deliveryMethod: 'paxi-standard' })}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        customer.deliveryMethod === 'paxi-standard'
                          ? 'bg-orange-500/15 text-white border-orange-500 shadow-md ring-1 ring-orange-500'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">PAXI Standard</span>
                        <span className="text-xs font-black text-orange-400">
                          {subtotal >= 800 ? 'FREE' : `R${brandConfig.paxiStandardFee}`}
                        </span>
                      </div>
                      <span className="text-[10px] block leading-tight text-zinc-400">
                        PEP Store Pickup (5-10 days)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCustomer({ ...customer, deliveryMethod: 'paxi-express' })}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        customer.deliveryMethod === 'paxi-express'
                          ? 'bg-blue-600/30 text-white border-blue-500 shadow-md ring-1 ring-blue-500'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">PAXI Express</span>
                        <span className="text-xs font-black text-blue-400">R{brandConfig.paxiExpressFee}</span>
                      </div>
                      <span className="text-[10px] block leading-tight text-zinc-400">
                        Fast PEP Pickup (3-5 days)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCustomer({ ...customer, deliveryMethod: 'collection' })}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        customer.deliveryMethod === 'collection'
                          ? 'bg-emerald-600/30 text-white border-emerald-500 shadow-md ring-1 ring-emerald-500'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">Direct Pickup</span>
                        <span className="text-xs font-black text-emerald-400">FREE</span>
                      </div>
                      <span className="text-[10px] block leading-tight text-zinc-400">
                        Gauteng Studio collection
                      </span>
                    </button>
                  </div>
                </div>

                {customer.deliveryMethod.startsWith('paxi') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-white">
                        Nearest PEP Store Branch or PAXI Code *
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsPaxiPickerOpen(!isPaxiPickerOpen)}
                        className="text-[11px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>{isPaxiPickerOpen ? 'Hide Branch List' : 'Search PEP Branches'}</span>
                      </button>
                    </div>

                    <div className="relative">
                      <MapPin className="w-4 h-4 text-orange-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="e.g. PEP Store Soweto Bara Mall / PEP Jhb CBD / P4021"
                        value={customer.pepStoreBranch}
                        onChange={(e) => setCustomer({ ...customer, pepStoreBranch: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>

                    {/* Quick City/Mall Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
                      <span className="text-[10px] text-zinc-500 uppercase font-black shrink-0">Popular:</span>
                      {[
                        { label: 'Soweto Bara Mall', code: 'P4021' },
                        { label: 'Maponya Mall', code: 'P4105' },
                        { label: 'Carlton Centre JHB', code: 'P3012' },
                        { label: 'Menlyn Pretoria', code: 'P2045' },
                        { label: 'Savannah Polokwane', code: 'P7001' },
                        { label: 'Durban Workshop', code: 'P5001' },
                        { label: 'Canal Walk Cape Town', code: 'P1050' },
                      ].map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => {
                            setCustomer({
                              ...customer,
                              pepStoreBranch: `PEP Store ${item.label} (${item.code})`,
                            });
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors border ${
                            customer.pepStoreBranch.includes(item.code)
                              ? 'bg-orange-500/20 text-orange-400 border-orange-500/60'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* Searchable Dropdown List */}
                    {isPaxiPickerOpen && (
                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 space-y-2.5 shadow-xl animate-in fade-in">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            placeholder="Type town or mall (e.g. Pretoria, Tembisa, Soweto)..."
                            value={paxiFilterQuery}
                            onChange={(e) => setPaxiFilterQuery(e.target.value)}
                            className="w-full bg-black border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                          />
                        </div>

                        <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                          {POPULAR_PAXI_BRANCHES.filter((b) => {
                            const q = paxiFilterQuery.toLowerCase().trim();
                            if (!q) return true;
                            return (
                              b.name.toLowerCase().includes(q) ||
                              b.city.toLowerCase().includes(q) ||
                              b.province.toLowerCase().includes(q) ||
                              b.code.toLowerCase().includes(q) ||
                              b.address.toLowerCase().includes(q)
                            );
                          }).slice(0, 8).map((branch) => (
                            <button
                              key={branch.code}
                              type="button"
                              onClick={() => {
                                setCustomer({
                                  ...customer,
                                  pepStoreBranch: `${branch.name} (${branch.code}) - ${branch.city}`,
                                });
                                setIsPaxiPickerOpen(false);
                              }}
                              className="w-full p-2 rounded-xl text-left bg-zinc-950 hover:bg-zinc-800 border border-zinc-800/80 transition-colors flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0">
                                <strong className="text-white block font-bold truncate">{branch.name}</strong>
                                <span className="text-[10px] text-zinc-400 block truncate">{branch.address}</span>
                              </div>
                              <span className="text-[10px] font-mono font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 shrink-0">
                                {branch.code}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">
                    Order Note / Sizing Instructions (Optional)
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. Please ensure relaxed streetwear fit"
                      value={customer.customerNote}
                      onChange={(e) => setCustomer({ ...customer, customerNote: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Items summary */}
              <div className="pt-2 border-t border-zinc-800/80">
                <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-zinc-300">
                    <span>Items Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} pieces)</span>
                    <span className="font-bold text-white font-mono">{formatZAR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>Delivery Fee ({customer.deliveryMethod.toUpperCase()})</span>
                    <span className="font-bold text-blue-300 font-mono">
                      {deliveryFee === 0 ? 'FREE' : formatZAR(deliveryFee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-zinc-800 font-display">
                    <span>Total Due</span>
                    <span className="text-orange-400 text-base font-black font-mono">{formatZAR(orderTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-orange-500/25 transition-transform active:scale-98"
              >
                <span>Proceed to Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: PAYFAST PAYMENT SELECTION & GATEWAY REDIRECT */}
          {currentStep === 'payment' && (
            <div className="space-y-5">
              {/* Top Summary Pill */}
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-400 block text-[11px]">Payee: {customer.fullName}</span>
                  <span className="text-white font-medium">
                    {customer.email} &bull; {customer.pepStoreBranch || 'Gauteng Pickup'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Total in ZAR</span>
                  <span className="text-base font-black text-orange-400 font-mono">{formatZAR(orderTotal)}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <label className="block text-xs font-black uppercase tracking-wider text-white flex items-center justify-between">
                  <span>Select Payment Method</span>
                  <span className="text-[11px] font-normal text-emerald-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    256-bit SSL PayFast Gateway
                  </span>
                </label>

                {/* Primary Option: PayFast Hosted Gateway */}
                <div
                  onClick={() => setSelectedMethod('payfast')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedMethod === 'payfast'
                      ? 'bg-orange-500/10 border-orange-500 shadow-md ring-1 ring-orange-500/50'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-white text-sm">PayFast Hosted Checkout</strong>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                            Recommended
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-300 leading-snug">
                          Pay securely on PayFast’s official South African payment portal.
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-zinc-400">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-medium">Visa &amp; Mastercard</span>
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-medium">Capitec Pay</span>
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-medium">Instant EFT (All SA Banks)</span>
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-medium">SnapScan &amp; Zapper</span>
                        </div>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                      selectedMethod === 'payfast'
                        ? 'border-orange-500 bg-orange-500 text-white'
                        : 'border-zinc-700'
                    }`}>
                      {selectedMethod === 'payfast' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>

                {/* Secondary Option: WhatsApp Assisted Order */}
                <div
                  onClick={() => setSelectedMethod('whatsapp')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedMethod === 'whatsapp'
                      ? 'bg-emerald-500/10 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                        <Send className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <strong className="text-white text-sm">Direct WhatsApp Order</strong>
                        <p className="text-[11px] text-zinc-400 leading-snug">
                          Chat directly with the brand owner to arrange manual EFT or custom delivery.
                        </p>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                      selectedMethod === 'whatsapp'
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-zinc-700'
                    }`}>
                      {selectedMethod === 'whatsapp' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* PayFast Hosted Gateway Notice */}
              {selectedMethod === 'payfast' && (
                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2 text-zinc-400 text-[11px] leading-relaxed">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>How PayFast Hosted Checkout works</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    <li>You will be redirected to PayFast's official SSL encrypted checkout page.</li>
                    <li>Choose your bank or card, authenticate via 3D Secure / OTP or your banking app.</li>
                    <li>PayFast notifies our server via secure Instant Transaction Notification (ITN).</li>
                    <li>You are returned to the verified receipt page once confirmed.</li>
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep('details')}
                  disabled={isSubmitting}
                  className="px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                {selectedMethod === 'payfast' ? (
                  <button
                    type="button"
                    onClick={handleProceedPayFast}
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 px-5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-orange-500/25 transition-transform active:scale-98"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>{redirectMessage || 'Connecting to PayFast...'}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Pay with PayFast ({formatZAR(orderTotal)})</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleProceedWhatsAppOnly}
                    className="flex-1 py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/25 transition-transform active:scale-98"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Order via WhatsApp</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION (for WhatsApp orders or in-modal display) */}
          {currentStep === 'success' && finalOrder && (
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest font-black text-emerald-400">
                  Order Successfully Created
                </span>
                <h3 className="text-xl sm:text-2xl font-black font-display text-white">
                  Order #{finalOrder.orderNumber}
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Your order details have been saved to your account.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-left space-y-2 text-xs">
                <div className="flex justify-between text-zinc-300">
                  <span>Customer:</span>
                  <strong className="text-white">{finalOrder.customer.fullName}</strong>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Mobile/WhatsApp:</span>
                  <span className="text-white font-mono">{finalOrder.customer.phoneOrWhatsApp}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Destination:</span>
                  <span className="text-white">{finalOrder.customer.pepStoreBranch || 'Gauteng Studio'}</span>
                </div>
                <div className="flex justify-between text-zinc-300 pt-1 border-t border-zinc-800">
                  <span>Total Amount:</span>
                  <strong className="text-orange-400 font-mono text-sm">{formatZAR(finalOrder.estimatedTotal)}</strong>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={finalOrder.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Open in WhatsApp</span>
                </a>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs"
                >
                  Close &amp; Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
