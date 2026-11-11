import React, { useState } from 'react';
import { Heart, Check, ShoppingBag, X } from 'lucide-react';
import { Product } from '../types';
import { formatZAR } from '../utils/whatsapp';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const wishlisted = isInWishlist(product.id);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [justAddedSize, setJustAddedSize] = useState<string | null>(null);

  const hasMultipleImages = product.images && product.images.length > 1;

  const handleQuickAdd = (size: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultColour = product.availableColours?.[0] || 'Classic Black';
    addToCart(product, size, defaultColour, 1);
    setJustAddedSize(size);
    setTimeout(() => {
      setJustAddedSize(null);
      setQuickAddOpen(false);
    }, 900);
  };

  return (
    <div
      onClick={() => onSelect(product)}
      onMouseEnter={() => {
        if (hasMultipleImages) setActiveImageIndex(1);
      }}
      onMouseLeave={() => {
        setActiveImageIndex(0);
        setQuickAddOpen(false);
      }}
      className="group relative bg-zinc-900 rounded-2xl border border-zinc-800/80 hover:border-zinc-700 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer shadow-md hover:shadow-xl hover:shadow-black/50"
    >
      {/* Visual Canvas: 100% Unobstructed Streetwear Imagery */}
      <div className="relative aspect-[4/5] bg-zinc-950 overflow-hidden">
        <img
          src={product.images[activeImageIndex] || product.images[0]}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
          decoding="async"
        />

        {/* Subtle, delicate gradient scrim only at the very bottom of the photo */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        {/* Top-Left Release Indicator (Quiet, subtle text tag) */}
        {product.isNewDrop && (
          <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
            <span className="text-[9px] font-black uppercase tracking-wider text-orange-400 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded border border-orange-500/30">
              2026 Drop
            </span>
          </div>
        )}

        {/* Quick Size Selector Slide-up Overlay (Only when opened) */}
        {quickAddOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-2 bottom-2 z-20 bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-xl p-2.5 shadow-2xl animate-in slide-in-from-bottom-2 duration-150"
          >
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Select Size
              </span>
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                className="text-zinc-500 hover:text-white p-0.5"
                aria-label="Close size selector"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {product.availableSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={(e) => handleQuickAdd(size, e)}
                  className={`py-1 text-xs font-bold rounded-lg border transition-all active:scale-95 cursor-pointer ${
                    justAddedSize === size
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                      : 'bg-zinc-900 hover:bg-orange-500 border-zinc-800 hover:border-orange-500 text-zinc-200 hover:text-white'
                  }`}
                >
                  {justAddedSize === size ? <Check className="w-3 h-3 mx-auto" /> : size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Details Section: Clean, proportional typography */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between bg-zinc-900/90">
        <div>
          {/* Fit & SKU: Single line with truncate protection */}
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1 gap-2">
            <span className="text-emerald-400 font-medium truncate">
              {product.fit || 'Streetwear Fit'}
            </span>
            <span className="font-mono text-[10px] text-zinc-500 shrink-0">
              {product.sku}
            </span>
          </div>

          {/* Product Title: 2-line natural display so full name shows clearly */}
          <h3 className="font-bold text-white text-xs sm:text-sm leading-snug line-clamp-2 min-h-[2rem] sm:min-h-[2.4rem] group-hover:text-orange-400 transition-colors">
            {product.name}
          </h3>

          {/* Description: 2-line legible prose */}
          <p className="mt-1 text-[11px] sm:text-xs text-zinc-400 line-clamp-2 leading-relaxed min-h-[1.8rem] sm:min-h-[2rem]">
            {product.description}
          </p>
        </div>

        {/* Pricing & Actions Row */}
        <div className="mt-2.5 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between gap-2">
          {/* Price & Wishlist Heart */}
          <div className="flex items-center gap-2 min-w-0">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm sm:text-base font-black text-white font-display tabular-nums">
                  {formatZAR(product.price)}
                </span>
                {product.compareAtPrice && (
                  <span className="text-[10px] sm:text-xs text-zinc-500 line-through tabular-nums">
                    {formatZAR(product.compareAtPrice)}
                  </span>
                )}
              </div>
              <span className="text-[9px] sm:text-[10px] text-blue-400 font-medium block">
                PAXI Ready (R60)
              </span>
            </div>

            {/* Wishlist Heart Icon: Discreetly positioned beside price */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(product.id);
              }}
              className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                wishlisted
                  ? 'text-orange-500 bg-orange-500/10 hover:bg-orange-500/20'
                  : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
              }`}
              title={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            >
              <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Quick-Add Bag Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setQuickAddOpen((prev) => !prev);
            }}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
            aria-label="Select size & add to bag"
            title="Select size & add to bag"
          >
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};
