import React, { useState } from 'react';
import { X, Heart, ShoppingBag, MessageSquare, Truck, ShieldCheck, Ruler, Sparkles, Check, Info } from 'lucide-react';
import { Product, BrandConfig } from '../types';
import { formatZAR, buildWhatsAppLink, generateOrderReference } from '../utils/whatsapp';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  brandConfig: BrandConfig;
  onOpenSizeGuide: () => void;
  onOpenPaxiInfo: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  brandConfig,
  onOpenSizeGuide,
  onOpenPaxiInfo,
}) => {
  if (!product) return null;

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>(product.availableSizes[0] || 'L');
  const [selectedColour, setSelectedColour] = useState<string>(product.availableColours[0] || 'Classic Black');
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const wishlisted = isInWishlist(product.id);

  const handleAddBag = () => {
    addToCart(product, selectedSize, selectedColour, quantity);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 600);
  };

  const handleQuickWhatsApp = () => {
    const orderRef = generateOrderReference();
    const lineTotal = product.price * quantity;
    const msg = [
      `🛍️ *QUICK ENQUIRY — LASS BRAND CLOTHES*`,
      `Item: *${product.name}*`,
      `SKU: ${product.sku}`,
      `Size: ${selectedSize}`,
      `Colour: ${selectedColour}`,
      `Quantity: ${quantity}`,
      `Estimated Price: ${formatZAR(lineTotal)}`,
      `Ref: #${orderRef}`,
      `───────────────`,
      `Hi LASS, I want to confirm stock availability and arrange PAXI delivery for this piece!`,
    ].join('\n');

    const url = buildWhatsAppLink(brandConfig.ownerWhatsApp, msg);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/80 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors border border-zinc-700"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Product Gallery */}
        <div className="md:w-1/2 bg-black p-4 sm:p-6 flex flex-col justify-between">
          <div className="relative aspect-square sm:aspect-[4/5] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
            <img
              src={product.images[selectedImageIndex] || product.images[0]}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
              {product.isNewDrop && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-black tracking-wider uppercase bg-orange-500 text-white shadow-lg">
                  <Sparkles className="w-3.5 h-3.5" />
                  2026 Drop
                </span>
              )}
              {product.isAuditedOriginal && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-600 text-white shadow-md">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Audited Google Sites Price
                </span>
              )}
            </div>

            {/* Wishlist toggle on image */}
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-colors ${
                wishlisted
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-black/70 text-white hover:text-orange-400'
              }`}
            >
              <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Thumbnails row if multiple images exist */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors shrink-0 ${
                    selectedImageIndex === idx
                      ? 'border-orange-500 opacity-100 ring-2 ring-orange-500/30'
                      : 'border-zinc-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumbnail" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Photo Note for transparency */}
          {product.isPlaceholderPhoto && (
            <div className="mt-3 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
              <span>
                <strong>Lookbook Note:</strong> Studio mockup visualization. Authentic physical garments feature original screen print tags and branding.
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Product Details & Variant Selectors */}
        <div className="md:w-1/2 p-6 sm:p-7 flex flex-col justify-between max-h-[85vh] overflow-y-auto bg-zinc-950">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span className="uppercase tracking-widest font-black text-blue-400">{product.printType}</span>
              <span className="font-mono text-zinc-500">{product.sku}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black font-display text-white">
              {product.name}
            </h2>

            {/* Pricing Section */}
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-black text-white font-display">
                {formatZAR(product.price)}
              </span>
              {product.compareAtPrice && (
                <span className="text-sm text-zinc-500 line-through">
                  {formatZAR(product.compareAtPrice)}
                </span>
              )}
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-0.5 rounded-md">
                Available to Order
              </span>
            </div>

            {/* Brand Manifesto Quote */}
            {product.storyQuote && (
              <blockquote className="mt-3.5 p-3 rounded-xl bg-zinc-900 border-l-2 border-orange-500 text-xs italic text-zinc-200">
                "{product.storyQuote}"
              </blockquote>
            )}

            {/* Description */}
            <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
              {product.description}
            </p>

            {/* Fabric & Fit specs */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-300 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
              <div>
                <span className="text-emerald-400 block text-[10px] uppercase font-black">Fit</span>
                <span className="text-white font-bold">{product.fit}</span>
              </div>
              <div>
                <span className="text-blue-400 block text-[10px] uppercase font-black">Fabric</span>
                <span className="text-white font-bold">{product.fabricDetails}</span>
              </div>
            </div>

            {/* Size Selector */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-white">
                  Select Size
                </label>
                <button
                  onClick={onOpenSizeGuide}
                  className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 font-bold underline underline-offset-2"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  SA Size Guide
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {product.availableSizes.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-12 px-3 py-2 rounded-xl text-xs font-black transition-all border ${
                        isSelected
                          ? 'bg-orange-500 text-white border-orange-400 shadow-md scale-105'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colour Selector */}
            <div className="mt-4">
              <label className="text-xs font-black uppercase tracking-wider text-white block mb-2">
                Select Colour: <span className="text-orange-400">{selectedColour}</span>
              </label>

              <div className="flex flex-wrap gap-2">
                {product.availableColours.map((col) => {
                  const isSelected = selectedColour === col;
                  return (
                    <button
                      key={col}
                      onClick={() => setSelectedColour(col)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full border ${
                          col.toLowerCase().includes('white')
                            ? 'bg-white border-zinc-400'
                            : col.toLowerCase().includes('charcoal')
                            ? 'bg-zinc-700 border-zinc-500'
                            : 'bg-black border-zinc-600'
                        }`}
                      />
                      <span>{col}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mt-4 flex items-center gap-3">
              <label className="text-xs font-black uppercase tracking-wider text-zinc-400">
                Quantity:
              </label>
              <div className="flex items-center border border-zinc-800 rounded-xl bg-zinc-900 overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors font-bold text-sm"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="px-3 py-1.5 text-sm font-black text-white min-w-8 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  className="px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors font-bold text-sm"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <span className="text-xs text-zinc-400">
                Subtotal: <strong className="text-white">{formatZAR(product.price * quantity)}</strong>
              </span>
            </div>
          </div>

          {/* Action CTAs in Green, White, Blue, Orange */}
          <div className="mt-6 pt-5 border-t border-zinc-800 space-y-2.5">
            <button
              onClick={handleAddBag}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl ${
                addedAnimation
                  ? 'bg-emerald-600 text-white scale-[0.98]'
                  : 'bg-orange-500 hover:bg-orange-400 text-white shadow-orange-500/25 active:scale-95'
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-5 h-5 text-white" />
                  <span>Added to Bag!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  <span>Add to Bag • {formatZAR(product.price * quantity)}</span>
                </>
              )}
            </button>

            <button
              onClick={handleQuickWhatsApp}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-950/40"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Direct WhatsApp Enquiry</span>
            </button>

            {/* PAXI Notice */}
            <div
              onClick={onOpenPaxiInfo}
              className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between text-xs text-blue-200 cursor-pointer hover:bg-blue-950/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>PAXI PEP Store delivery from <strong>R60</strong></span>
              </div>
              <span className="text-[10px] font-bold underline">Details</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
