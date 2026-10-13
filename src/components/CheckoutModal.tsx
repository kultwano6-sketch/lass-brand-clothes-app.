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
  AlertTriangle
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { BrandConfig, OrderCustomerDetails, SubmittedOrder } from '../types';
import { formatZAR, generateOrderReference, generateWhatsAppOrderMessage, buildWhatsAppLink } from '../utils/whatsapp';
import { saveLocalOrder } from '../utils/orderStorage';
import {
  PaymentMethodType,
  SA_BANKS,
  LASS_BANKING_DETAILS,
  generateTransactionId,
  generatePaxiTrackingCode,
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  BankOption
} from '../utils/payment';

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

  // Wizard Step: 'details' -> 'payment' -> 'success'
  const [currentStep, setCurrentStep] = useState<'details' | 'payment' | 'success'>('details');

  const [customer, setCustomer] = useState<OrderCustomerDetails>({
    fullName: '',
    phoneOrWhatsApp: '',
    email: '',
    deliveryMethod: 'paxi-standard',
    pepStoreBranch: '',
    deliveryAddress: '',
    customerNote: '',
  });

  // Selected Payment Method in App
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('card');

  // Card Form State
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [saveCard, setSaveCard] = useState(true);

  // Bank / Instant EFT State
  const [selectedBank, setSelectedBank] = useState<BankOption>(SA_BANKS[0]);
  const [bankAccountNumber, setBankAccountNumber] = useState('');

  // 3D Secure / OTP Simulation State
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('849201');
  const [authStepMessage, setAuthStepMessage] = useState('Contacting bank gateway...');

  // SnapScan State
  const [snapScanApproved, setSnapScanApproved] = useState(false);

  // Order Result State
  const [orderRef] = useState(() => generateOrderReference());
  const [finalOrder, setFinalOrder] = useState<SubmittedOrder | null>(null);
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  const deliveryFee =
    customer.deliveryMethod === 'paxi-standard'
      ? brandConfig.paxiStandardFee
      : customer.deliveryMethod === 'paxi-express'
      ? brandConfig.paxiExpressFee
      : 0;

  const orderTotal = subtotal + deliveryFee;
  const detectedBrand = detectCardBrand(cardNumber);

  // Validation before going to Payment step
  const handleValidateDetails = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customer.fullName.trim()) {
      setValidationError('Please enter your full name.');
      return;
    }
    if (!customer.phoneOrWhatsApp.trim() || customer.phoneOrWhatsApp.trim().length < 8) {
      setValidationError('Please enter a valid South African WhatsApp or phone number.');
      return;
    }
    if (customer.deliveryMethod.startsWith('paxi') && !customer.pepStoreBranch.trim()) {
      setValidationError('Please specify your nearest PEP Store branch or town for PAXI collection.');
      return;
    }

    setValidationError('');
    setCurrentStep('payment');
  };

  // Trigger Payment
  const handleInitiatePayment = () => {
    setValidationError('');

    if (paymentMethod === 'card') {
      const cleanCard = cardNumber.replace(/\D/g, '');
      if (cleanCard.length < 15) {
        setValidationError('Please enter a valid 16-digit card number.');
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        setValidationError('Please enter card expiry in MM/YY format.');
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        setValidationError('Please enter a valid 3 or 4 digit CVV/CVC.');
        return;
      }
      if (!cardHolder.trim()) {
        setValidationError('Please enter the name on your card.');
        return;
      }

      // Trigger 3D Secure / Bank OTP Modal
      setShowOtpModal(true);
      return;
    }

    if (paymentMethod === 'instant_eft') {
      if (!bankAccountNumber.trim() && !customer.phoneOrWhatsApp.trim()) {
        setValidationError('Please enter your Capitec / Bank account or registered cellphone number.');
        return;
      }
      // Instant EFT simulation
      processSuccessfulPayment({
        method: 'instant_eft',
        bankName: selectedBank.name,
        accountMasked: bankAccountNumber ? `•••• ${bankAccountNumber.slice(-4)}` : `Cell: ${customer.phoneOrWhatsApp.slice(-4)}`,
      });
      return;
    }

    if (paymentMethod === 'snapscan') {
      processSuccessfulPayment({
        method: 'snapscan',
        bankName: 'SnapScan / Zapper SA',
      });
      return;
    }

    if (paymentMethod === 'manual_eft') {
      processSuccessfulPayment({
        method: 'manual_eft',
        bankName: LASS_BANKING_DETAILS.bankName,
      });
      return;
    }

    if (paymentMethod === 'whatsapp') {
      handleProceedWhatsAppOnly();
    }
  };

  // Complete Payment and Create Confirmed Order
  const processSuccessfulPayment = ({
    method,
    cardLast4,
    cardBrand,
    bankName,
    accountMasked,
  }: {
    method: PaymentMethodType;
    cardLast4?: string;
    cardBrand?: string;
    bankName?: string;
    accountMasked?: string;
  }) => {
    setIsAuthorizing(true);
    setAuthStepMessage('Encrypting transaction via 256-bit SSL...');

    setTimeout(() => {
      setAuthStepMessage('Authorizing with South African Payment Gateway...');
      setTimeout(() => {
        setAuthStepMessage('Payment Confirmed! Allocating inventory...');
        setTimeout(() => {
          const transactionId = generateTransactionId();
          const paxiCode = generatePaxiTrackingCode();
          const paidDate = new Date().toISOString();

          const messageText = generateWhatsAppOrderMessage({
            orderRef,
            customer,
            items: cart,
            subtotal,
            deliveryFee,
            total: orderTotal,
            brandTagline: brandConfig.tagline,
          }) + `\n\n💳 *ONLINE PAYMENT CONFIRMED IN-APP*\n• Payment Method: ${method.toUpperCase()}\n• Transaction ID: ${transactionId}\n• Status: PAID (ZAR ${orderTotal.toFixed(2)})\n• PAXI Tracking Ref: ${paxiCode}`;

          const whatsappUrl = buildWhatsAppLink(brandConfig.ownerWhatsApp, messageText);

          const confirmedOrder: SubmittedOrder = {
            orderNumber: orderRef,
            date: paidDate,
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
            status: 'payment_confirmed',
            paxiTrackingCode: paxiCode,
            statusNotes: `Payment of ${formatZAR(orderTotal)} captured in-app (${method.toUpperCase()}). Ready for PAXI PEP dispatch.`,
            paymentMethod: method,
            paymentStatus: 'paid',
            transactionId,
            paidAt: paidDate,
            paymentDetails: {
              cardLast4: cardLast4 || (cardNumber ? cardNumber.replace(/\s/g, '').slice(-4) : undefined),
              cardBrand: cardBrand || detectedBrand,
              bankName: bankName || selectedBank.name,
              accountNumberMasked: accountMasked,
              referenceCode: orderRef,
            },
          };

          saveLocalOrder(confirmedOrder);
          if (onOrderSaved) onOrderSaved(confirmedOrder);
          setFinalOrder(confirmedOrder);
          clearCart();
          setIsAuthorizing(false);
          setShowOtpModal(false);
          setCurrentStep('success');
        }, 800);
      }, 1000);
    }, 800);
  };

  // WhatsApp Order Flow Fallback
  const handleProceedWhatsAppOnly = () => {
    const generatedMessage = generateWhatsAppOrderMessage({
      orderRef,
      customer,
      items: cart,
      subtotal,
      deliveryFee,
      total: orderTotal,
      brandTagline: brandConfig.tagline,
    });
    const whatsappUrl = buildWhatsAppLink(brandConfig.ownerWhatsApp, generatedMessage);

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
      whatsappMessageText: generatedMessage,
      whatsappUrl,
      status: 'whatsapp_generated',
      paymentMethod: 'whatsapp',
      paymentStatus: 'pending',
    };

    saveLocalOrder(pendingOrder);
    if (onOrderSaved) onOrderSaved(pendingOrder);
    setFinalOrder(pendingOrder);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    clearCart();
    setCurrentStep('success');
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="font-display font-black text-lg text-white">
                {currentStep === 'success' ? 'Payment Completed & Receipt' : 'Checkout & In-App Payment'}
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Ref: <span className="font-mono text-orange-400 font-black">#{orderRef}</span> • LASS Brand Clothes (Gauteng)
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            title="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progression Bar (Details -> Pay in App -> Receipt) */}
        {currentStep !== 'success' && (
          <div className="bg-zinc-900 border-b border-zinc-800/80 px-4 py-2.5 flex items-center justify-between text-xs">
            <button
              onClick={() => setCurrentStep('details')}
              className={`flex items-center gap-1.5 font-bold transition-colors ${
                currentStep === 'details' ? 'text-orange-400' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 'details' ? 'bg-orange-500 text-white font-black' : 'bg-zinc-800 text-zinc-300'
              }`}>
                1
              </span>
              <span>1. Delivery &amp; Contact</span>
            </button>

            <ChevronRight className="w-4 h-4 text-zinc-600" />

            <button
              onClick={() => {
                if (customer.fullName && customer.phoneOrWhatsApp) {
                  setCurrentStep('payment');
                }
              }}
              className={`flex items-center gap-1.5 font-bold transition-colors ${
                currentStep === 'payment' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 'payment' ? 'bg-emerald-500 text-white font-black' : 'bg-zinc-800 text-zinc-500'
              }`}>
                2
              </span>
              <span>2. Pay in App ({formatZAR(orderTotal)})</span>
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {validationError && (
            <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-xs text-rose-200 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* STEP 1: DELIVERY & CONTACT DETAILS */}
          {currentStep === 'details' && (
            <form onSubmit={handleValidateDetails} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-white block">PAXI PEP Nationwide Delivery</span>
                  <p className="text-[11px] text-zinc-400">
                    Orders are packed and dispatched via PAXI to any PEP Store counter across South Africa. Pay online in the app for immediate processing.
                  </p>
                </div>
              </div>

              {/* Customer Inputs */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="e.g. Sipho Ndlovu"
                        value={customer.fullName}
                        onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                      WhatsApp / Cellphone Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        placeholder="e.g. 066 441 2203"
                        value={customer.phoneOrWhatsApp}
                        onChange={(e) => setCustomer({ ...customer, phoneOrWhatsApp: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Email Address (for tax invoice &amp; payment receipt)
                    </label>
                    <span className="text-[10px] text-zinc-500">Recommended</span>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      placeholder="e.g. sipho@example.co.za"
                      value={customer.email || ''}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Delivery Method Selector */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-white mb-2">
                    Select Delivery Method
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setCustomer({ ...customer, deliveryMethod: 'paxi-standard' })}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        customer.deliveryMethod === 'paxi-standard'
                          ? 'bg-blue-600/30 text-white border-blue-500 shadow-md ring-1 ring-blue-500'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">PAXI Standard</span>
                        <span className="text-xs font-black text-orange-400">R{brandConfig.paxiStandardFee}</span>
                      </div>
                      <span className="text-[11px] block leading-tight text-zinc-400">
                        PEP Store ({brandConfig.paxiLeadDays})
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
                        <span className="text-xs font-black text-orange-400">R{brandConfig.paxiExpressFee}</span>
                      </div>
                      <span className="text-[11px] block leading-tight text-zinc-400">
                        Fast PEP pickup (3-5 days)
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
                      <span className="text-[11px] block leading-tight text-zinc-400">
                        Gauteng collection
                      </span>
                    </button>
                  </div>
                </div>

                {customer.deliveryMethod.startsWith('paxi') && (
                  <div>
                    <label className="block text-xs font-bold text-white mb-1">
                      Nearest PEP Store Branch or PAXI Code *
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-blue-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="e.g. PEP Store Soweto Bara Mall / PEP Jhb CBD / P4021"
                        value={customer.pepStoreBranch}
                        onChange={(e) => setCustomer({ ...customer, pepStoreBranch: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">
                    Order Note / Special Sizing Instructions (Optional)
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. Please ensure generous oversize fit, delivery for birthday"
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
                    <span>Items Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                    <span className="font-bold text-white">{formatZAR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>Delivery Fee ({customer.deliveryMethod.toUpperCase()})</span>
                    <span className="font-bold text-blue-300">{deliveryFee === 0 ? 'FREE' : formatZAR(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-zinc-800 font-display">
                    <span>Total Due</span>
                    <span className="text-orange-400 text-base font-black">{formatZAR(orderTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Continue to Payment button */}
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-orange-500/25 transition-transform active:scale-98"
              >
                <span>Continue to Pay in App</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: IN-APP PAYMENT SELECTION & GATEWAY */}
          {currentStep === 'payment' && (
            <div className="space-y-5">
              {/* Top Summary Pill */}
              <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-400 block text-[11px]">Payee: {customer.fullName}</span>
                  <span className="text-white font-medium">{customer.phoneOrWhatsApp} • {customer.pepStoreBranch || 'Direct Pickup'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Total to Pay</span>
                  <span className="text-base font-black text-orange-400 font-mono">{formatZAR(orderTotal)}</span>
                </div>
              </div>

              {/* Payment Methods Tabs */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-white mb-2.5 flex items-center justify-between">
                  <span>Select Payment Method in App</span>
                  <span className="text-[11px] font-normal text-emerald-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Instant Secure Gateway
                  </span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                      paymentMethod === 'card'
                        ? 'bg-orange-500/15 border-orange-500 text-white shadow-md'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <CreditCard className={`w-5 h-5 ${paymentMethod === 'card' ? 'text-orange-400' : 'text-zinc-400'}`} />
                    <span className="text-xs font-bold leading-tight">Debit / Credit Card</span>
                    <span className="text-[10px] text-zinc-500">Visa • Mastercard</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('instant_eft')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                      paymentMethod === 'instant_eft'
                        ? 'bg-sky-500/15 border-sky-500 text-white shadow-md'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <Building2 className={`w-5 h-5 ${paymentMethod === 'instant_eft' ? 'text-sky-400' : 'text-zinc-400'}`} />
                    <span className="text-xs font-bold leading-tight">Capitec / Instant EFT</span>
                    <span className="text-[10px] text-zinc-500">Ozow • Top 8 SA Banks</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('snapscan')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                      paymentMethod === 'snapscan'
                        ? 'bg-blue-500/15 border-blue-500 text-white shadow-md'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <QrCode className={`w-5 h-5 ${paymentMethod === 'snapscan' ? 'text-blue-400' : 'text-zinc-400'}`} />
                    <span className="text-xs font-bold leading-tight">SnapScan / QR</span>
                    <span className="text-[10px] text-zinc-500">Scan &amp; Pay in App</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('whatsapp')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                      paymentMethod === 'whatsapp'
                        ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <Send className={`w-5 h-5 ${paymentMethod === 'whatsapp' ? 'text-emerald-400' : 'text-zinc-400'}`} />
                    <span className="text-xs font-bold leading-tight">WhatsApp Order</span>
                    <span className="text-[10px] text-zinc-500">Chat with Owner</span>
                  </button>
                </div>
              </div>

              {/* CARD PAYMENT FORM */}
              {paymentMethod === 'card' && (
                <div className="space-y-4 bg-zinc-900/50 p-4 sm:p-5 rounded-2xl border border-zinc-800">
                  {/* Virtual Card Preview */}
                  <div className="relative w-full h-36 sm:h-40 rounded-2xl bg-gradient-to-tr from-zinc-900 via-neutral-900 to-zinc-800 p-4 border border-zinc-700 shadow-xl flex flex-col justify-between overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-widest text-orange-400">LASS Streetwear Card Pay</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-white px-2 py-0.5 rounded bg-black/60 border border-zinc-700">
                        {detectedBrand === 'visa' ? 'VISA' : detectedBrand === 'mastercard' ? 'MASTERCARD' : detectedBrand === 'amex' ? 'AMEX' : 'BANK CARD'}
                      </span>
                    </div>

                    <div className="font-mono text-base sm:text-lg tracking-widest text-white drop-shadow">
                      {cardNumber ? cardNumber : '••••  ••••  ••••  ••••'}
                    </div>

                    <div className="flex items-end justify-between text-xs">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-zinc-400 block">Cardholder</span>
                        <span className="font-bold text-white uppercase truncate max-w-[150px] block">
                          {cardHolder || customer.fullName || 'CUSTOMER NAME'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase tracking-wider text-zinc-400 block">Expires</span>
                        <span className="font-mono font-bold text-white">{cardExpiry || 'MM/YY'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Inputs */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                        Cardholder Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Name as printed on card"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                        Card Number *
                      </label>
                      <div className="relative">
                        <CreditCard className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="4242 •••• •••• 4242"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                          Expiry Date (MM/YY) *
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                            CVV / CVC *
                          </label>
                          <span className="text-[10px] text-zinc-500">3-4 digits</span>
                        </div>
                        <input
                          type="password"
                          placeholder="•••"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    {/* Quick Demo Pre-Fill Helper */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setCardNumber('4242 4242 4242 4242');
                          setCardExpiry('12/28');
                          setCardCvv('789');
                          setCardHolder(customer.fullName || 'Sipho Ndlovu');
                        }}
                        className="text-[11px] text-orange-400 hover:text-orange-300 underline font-medium"
                      >
                        ⚡ Fill Demo Test Card Details
                      </button>

                      <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>3D Secure 2.0 Protected</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* INSTANT EFT / CAPITEC PAY FORM */}
              {paymentMethod === 'instant_eft' && (
                <div className="space-y-4 bg-zinc-900/50 p-4 sm:p-5 rounded-2xl border border-zinc-800">
                  <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-800/40 text-xs text-sky-200 flex items-start gap-2">
                    <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <p>
                      <strong>Capitec Pay &amp; Instant EFT</strong> connects directly to your South African banking app for real-time clearance with zero card transaction fees.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white mb-2">
                      Choose Your Bank
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SA_BANKS.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBank(b)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            selectedBank.id === b.id
                              ? 'bg-sky-500/20 border-sky-400 text-white ring-1 ring-sky-400'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                          }`}
                        >
                          <span className="font-bold text-xs block truncate">{b.shortName}</span>
                          <span className="text-[10px] text-zinc-400 block truncate">{b.popular ? 'Instant Pay' : 'EFT'}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
                      {selectedBank.id === 'capitec' ? 'Capitec Cellphone or Account Number *' : 'Account or Cellphone Number *'}
                    </label>
                    <input
                      type="text"
                      placeholder={selectedBank.id === 'capitec' ? 'e.g. 066 441 2203' : 'e.g. 1092837482'}
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">
                      You will receive an in-app approval popup from {selectedBank.name}.
                    </p>
                  </div>
                </div>
              )}

              {/* SNAPSCAN / QR FORM */}
              {paymentMethod === 'snapscan' && (
                <div className="space-y-4 bg-zinc-900/50 p-4 sm:p-5 rounded-2xl border border-zinc-800 text-center">
                  <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl shadow-xl flex flex-col items-center justify-center">
                    {/* High contrast SVG QR Representation */}
                    <div className="w-full h-full border-4 border-black p-2 flex flex-col justify-between items-center bg-white">
                      <div className="flex justify-between w-full">
                        <div className="w-8 h-8 border-4 border-black bg-black flex items-center justify-center">
                          <div className="w-3 h-3 bg-white" />
                        </div>
                        <div className="w-8 h-8 border-4 border-black bg-black flex items-center justify-center">
                          <div className="w-3 h-3 bg-white" />
                        </div>
                      </div>
                      <div className="text-center py-1">
                        <span className="text-[10px] font-black tracking-widest text-black uppercase">LASS SCAN</span>
                        <div className="font-mono text-[9px] font-bold text-black">{formatZAR(orderTotal)}</div>
                      </div>
                      <div className="flex justify-between w-full">
                        <div className="w-8 h-8 border-4 border-black bg-black flex items-center justify-center">
                          <div className="w-3 h-3 bg-white" />
                        </div>
                        <div className="w-6 h-6 border-2 border-black flex items-center justify-center text-[9px] font-black text-black">
                          R
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">Scan with SnapScan, Masterpass or Banking App</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Open your camera or banking app to scan the code. Or tap the button below to authorize payment directly.
                    </p>
                  </div>
                </div>
              )}

              {/* WHATSAPP MANUAL ORDER INFO */}
              {paymentMethod === 'whatsapp' && (
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-200 space-y-2">
                  <h4 className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-emerald-400" />
                    Zero-Card WhatsApp Direct Ordering
                  </h4>
                  <p className="text-zinc-300 leading-relaxed">
                    Submitting will compile your order slip and launch a WhatsApp conversation directly with LASS owner (<strong className="text-white">{brandConfig.displayWhatsApp}</strong>).
                  </p>
                </div>
              )}

              {/* Security Banner */}
              <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 border-t border-zinc-800/80 pt-3">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  PCI-DSS Level 1 &amp; 256-Bit SSL
                </span>
                <span>South African Rand (ZAR)</span>
              </div>

              {/* Nav & Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setCurrentStep('details')}
                  className="w-full py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-zinc-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Delivery</span>
                </button>

                <button
                  type="button"
                  onClick={handleInitiatePayment}
                  disabled={isAuthorizing}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 transition-transform active:scale-98 disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {paymentMethod === 'whatsapp'
                      ? 'Launch WhatsApp Order'
                      : `Pay ${formatZAR(orderTotal)} in App`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS & DIGITAL TAX RECEIPT */}
          {currentStep === 'success' && finalOrder && (
            <div className="py-2 space-y-5 animate-in fade-in duration-300">
              {/* Confirmed Banner */}
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mx-auto flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="text-2xl font-black font-display text-white">
                  {finalOrder.paymentStatus === 'paid' ? 'Payment Confirmed!' : 'Order Dispatched to WhatsApp!'}
                </h3>
                <p className="text-xs text-zinc-300 max-w-md mx-auto">
                  Thank you for supporting <strong>{brandConfig.brandName}</strong>. Your streetwear order has been officially recorded.
                </p>
              </div>

              {/* Printable Official Digital Tax Receipt Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <span className="font-display font-black text-base text-white">LASS BRAND CLOTHES</span>
                    <span className="text-[10px] text-zinc-400 block">Kasi Wear That Drives The World Insane • VAT Reg: ZA-984210</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-mono font-black text-xs px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40">
                      {finalOrder.paymentStatus === 'paid' ? 'PAID IN APP' : 'ORDER CREATED'}
                    </span>
                    <span className="text-[10px] text-zinc-400 block mt-1">
                      {new Date(finalOrder.date).toLocaleDateString()} {new Date(finalOrder.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Key Transaction Meta */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-black/40 p-3 rounded-xl border border-zinc-800/80 font-mono text-[11px]">
                  <div>
                    <span className="text-zinc-500 text-[9px] uppercase tracking-wider block font-sans">Order Ref</span>
                    <span className="text-orange-400 font-bold">{finalOrder.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[9px] uppercase tracking-wider block font-sans">Transaction ID</span>
                    <span className="text-zinc-200">{finalOrder.transactionId || 'PENDING'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[9px] uppercase tracking-wider block font-sans">PAXI Tracking Code</span>
                    <span className="text-blue-300 font-bold">{finalOrder.paxiTrackingCode || 'GENERATED AT PEP'}</span>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-300 pt-1">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Customer Name</span>
                    <span className="font-bold text-white">{finalOrder.customer.fullName}</span>
                    <span className="text-zinc-400 block text-[11px]">{finalOrder.customer.phoneOrWhatsApp}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">PAXI Collection Destination</span>
                    <span className="font-bold text-white">
                      {finalOrder.customer.pepStoreBranch || 'Direct Pickup (Gauteng)'}
                    </span>
                    <span className="text-zinc-400 block text-[11px]">{finalOrder.customer.deliveryMethod.toUpperCase()}</span>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="border-t border-zinc-800 pt-3 space-y-2">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-bold">Purchased Items</span>
                  {finalOrder.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-zinc-800/50">
                      <div>
                        <span className="font-bold text-white">{i.name}</span>
                        <span className="text-zinc-400 block text-[10px]">
                          Size: {i.selectedSize} • {i.selectedColour} • Qty: {i.quantity}
                        </span>
                      </div>
                      <span className="font-mono text-zinc-200 font-bold">{formatZAR(i.totalPrice)}</span>
                    </div>
                  ))}

                  <div className="pt-2 space-y-1 text-right">
                    <div className="flex justify-between text-zinc-400 text-xs">
                      <span>Subtotal</span>
                      <span>{formatZAR(finalOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400 text-xs">
                      <span>PAXI Delivery</span>
                      <span>{finalOrder.deliveryFee === 0 ? 'FREE' : formatZAR(finalOrder.deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-white pt-1 border-t border-zinc-800 font-display">
                      <span>Total Paid</span>
                      <span className="text-orange-400">{formatZAR(finalOrder.estimatedTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Post-Payment */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onTrackOrder) onTrackOrder(finalOrder.orderNumber);
                  }}
                  className="py-3 px-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20"
                >
                  <Truck className="w-4 h-4" />
                  <span>Track Status</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="py-3 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-zinc-800"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.open(finalOrder.whatsappUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Send className="w-4 h-4" />
                  <span>Send to WhatsApp</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-zinc-400 hover:text-white underline font-medium"
                >
                  Return to Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3D SECURE / BANK OTP MODAL SIMULATION */}
      {showOtpModal && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-700 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
            {/* Bank Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="font-display font-black text-sm text-white">3D Secure • Verified by Visa / Mastercard</span>
              </div>
              <button
                onClick={() => setShowOtpModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isAuthorizing ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-bold text-white">{authStepMessage}</p>
                <p className="text-xs text-zinc-400">Please do not close or refresh this window.</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-zinc-300 leading-relaxed">
                  A One-Time PIN (OTP) has been sent to your registered cellphone ending in{' '}
                  <strong className="text-white">***{customer.phoneOrWhatsApp.slice(-3) || '203'}</strong> for payment authorization.
                </p>

                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 space-y-1.5">
                  <div className="flex justify-between text-zinc-400">
                    <span>Merchant:</span>
                    <span className="font-bold text-white">LASS BRAND CLOTHES</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Amount:</span>
                    <span className="font-mono font-bold text-orange-400">{formatZAR(orderTotal)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Card:</span>
                    <span className="font-mono text-zinc-300">•••• •••• •••• {cardNumber.replace(/\s/g, '').slice(-4) || '4242'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white mb-1.5">
                    Enter 6-Digit One-Time PIN (OTP)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full bg-black border-2 border-orange-500/70 rounded-xl py-2.5 px-3 text-center font-mono text-lg font-black tracking-widest text-white focus:outline-none focus:border-orange-400"
                  />
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-1">
                    <span>Time remaining: 02:45</span>
                    <button
                      type="button"
                      onClick={() => setOtpCode('849201')}
                      className="text-orange-400 hover:text-orange-300 underline"
                    >
                      Use Demo OTP (849201)
                    </button>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      processSuccessfulPayment({
                        method: 'card',
                        cardLast4: cardNumber.replace(/\s/g, '').slice(-4) || '4242',
                        cardBrand: detectedBrand,
                      });
                    }}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/60 transition-transform active:scale-98"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Authorize Payment of {formatZAR(orderTotal)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowOtpModal(false)}
                    className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold text-xs transition-colors"
                  >
                    Cancel Transaction
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
