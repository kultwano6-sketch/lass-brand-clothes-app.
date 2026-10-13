import React from 'react';
import { X, Trash2, ArrowRight, ShoppingBag, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatZAR } from '../utils/whatsapp';
import { BrandConfig } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
  brandConfig: BrandConfig;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout,
  brandConfig,
}) => {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    totalItems,
    lastRemovedItem,
    undoRemove,
  } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-zinc-950 border-l border-zinc-800 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-400" />
              <h2 className="font-display font-black text-lg text-white">
                Your Shopping Bag ({totalItems})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Undo Banner if an item was recently removed */}
          {lastRemovedItem && (
            <div className="bg-orange-950/60 border-b border-orange-500/30 px-4 py-2 flex items-center justify-between text-xs text-orange-200">
              <span>Removed "{lastRemovedItem.product.name}"</span>
              <button
                onClick={undoRemove}
                className="flex items-center gap-1 font-bold text-orange-400 hover:text-white underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
            </div>
          )}

          {/* PAXI PEP Delivery Prompt */}
          <div className="bg-emerald-950/40 border-b border-emerald-800/40 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>PAXI PEP nationwide courier available at checkout</span>
            </div>
            <span className="font-bold text-orange-400">R60</span>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4 text-zinc-400">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-600">
                  <ShoppingBag className="w-8 h-8 text-orange-400/50" />
                </div>
                <h3 className="font-bold text-white text-base">Your bag is empty</h3>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                  Browse our pocket-size prints, back prints, and 2026 streetwear drops to add pieces.
                </p>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-black text-xs uppercase tracking-wider hover:bg-orange-400 transition-colors shadow-lg shadow-orange-500/20"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedSize}-${item.selectedColour}`}
                  className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex gap-3.5 items-center relative"
                >
                  {/* Thumbnail */}
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-18 h-20 rounded-xl object-cover bg-black border border-zinc-800 shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-bold text-sm text-white truncate">
                      {item.product.name}
                    </h4>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                      <span className="bg-black/80 px-2 py-0.5 rounded text-[11px] font-bold text-orange-400 border border-zinc-800">
                        Size: {item.selectedSize}
                      </span>
                      <span className="bg-black/80 px-2 py-0.5 rounded text-[11px] font-medium text-blue-300 border border-zinc-800">
                        {item.selectedColour}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="font-black text-white text-sm font-display">
                        {formatZAR(item.product.price * item.quantity)}
                      </span>

                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-zinc-800 rounded-lg bg-black overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-bold"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-1 text-xs font-bold text-white min-w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-bold"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800/80 rounded-lg transition-colors ml-1"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Subtotal & Checkout Button */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-900/80 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Bag Subtotal</span>
                  <span className="font-bold text-white text-sm">{formatZAR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Est. PAXI Delivery</span>
                  <span className="text-blue-300 font-semibold">Calculated next step (from R60)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex justify-between items-baseline">
                <span className="font-display font-black text-sm text-white uppercase tracking-wider">
                  Estimated Total
                </span>
                <span className="font-display font-black text-xl text-white">
                  {formatZAR(subtotal)}
                </span>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-orange-500/25 transition-transform active:scale-95"
              >
                <span>Proceed to Checkout &amp; Pay</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={clearCart}
                  className="text-[11px] text-zinc-500 hover:text-zinc-400 transition-colors underline"
                >
                  Clear Bag
                </button>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Pay In-App • Card &amp; Capitec Pay</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
