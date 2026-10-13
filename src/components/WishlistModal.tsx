import React from 'react';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { Product } from '../types';
import { formatZAR } from '../utils/whatsapp';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (p: Product) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
}) => {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (!isOpen) return null;

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header in Blue & Black */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-orange-500 fill-current" />
            <h2 className="font-display font-black text-lg text-white">
              Saved Pieces ({wishlistedProducts.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {wishlistedProducts.length === 0 ? (
            <div className="text-center py-10 space-y-3 text-zinc-400">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-600">
                <Heart className="w-6 h-6 text-orange-400/50" />
              </div>
              <h3 className="font-bold text-white text-base">No pieces saved yet</h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Tap the heart icon on any t-shirt or drop to save it to your local wishlist.
              </p>
            </div>
          ) : (
            wishlistedProducts.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
              >
                <div
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  onClick={() => {
                    onClose();
                    onSelectProduct(p);
                  }}
                >
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="w-14 h-16 rounded-xl object-cover bg-black shrink-0 border border-zinc-800"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-white truncate hover:text-orange-400 transition-colors">
                      {p.name}
                    </h4>
                    <span className="text-xs text-orange-400 font-black font-display block">
                      {formatZAR(p.price)}
                    </span>
                    <span className="text-[10px] text-emerald-400 block font-semibold">{p.fit}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      addToCart(p, p.availableSizes[0] || 'L', p.availableColours[0] || 'Classic Black', 1);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs flex items-center gap-1 shadow-md"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Bag</span>
                  </button>
                  <button
                    onClick={() => toggleWishlist(p.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
