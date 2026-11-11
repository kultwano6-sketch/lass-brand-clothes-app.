import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, Flag, Check, X, MessageSquare, ThumbsUp, AlertTriangle } from 'lucide-react';
import { ProductReview, Product } from '../types';

interface AdminReviewsViewProps {
  allProducts: Product[];
  onNotify: (msg: string) => void;
}

export const AdminReviewsView: React.FC<AdminReviewsViewProps> = ({ allProducts, onNotify }) => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'reported' | 'rejected'>('all');

  const fetchReviews = () => {
    fetch('/api/admin/reviews')
      .then((res) => res.json())
      .then((data: any) => {
        if (data.success && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
        }
      })
      .catch((err) => console.error('Failed to load admin reviews:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleModerate = async (id: string, status: ProductReview['status']) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = (await res.json()) as any;
      if (data.success) {
        onNotify(`Review status updated to ${status.toUpperCase()}`);
        fetchReviews();
      }
    } catch {
      alert('Failed to update review status');
    }
  };

  const filtered = reviews.filter((r) => (filter === 'all' ? true : r.status === filter));
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : '5.0';

  const getProductName = (productId: string) => {
    const p = allProducts.find((item) => item.id === productId);
    return p ? p.name : productId;
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Total Reviews</span>
          <span className="font-display font-black text-2xl text-white mt-1 block tabular-nums">{reviews.length}</span>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Average Rating</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="font-display font-black text-2xl text-amber-400 tabular-nums">{avgRating}</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Verified Buyers</span>
          <span className="font-display font-black text-2xl text-emerald-400 mt-1 block tabular-nums">
            {reviews.filter((r) => r.verifiedPurchase).length}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Needs Moderation</span>
          <span className="font-display font-black text-2xl text-orange-400 mt-1 block tabular-nums">
            {reviews.filter((r) => r.status === 'pending' || r.status === 'reported').length}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto text-xs font-bold">
        {(
          [
            { id: 'all', label: `All (${reviews.length})` },
            { id: 'approved', label: 'Approved & Live' },
            { id: 'pending', label: 'Pending Review' },
            { id: 'reported', label: 'Reported / Flagged' },
            { id: 'rejected', label: 'Rejected / Spam' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              filter === t.id ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="p-8 text-center text-xs text-zinc-500">Loading reviews...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto" />
          <h4 className="font-bold text-white text-sm">No reviews in this category</h4>
          <p className="text-xs text-zinc-400">Customer feedback will appear here as orders are fulfilled.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((rev) => (
            <div
              key={rev.id}
              className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{rev.customerName}</span>
                    {rev.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3" />
                        Verified Purchase
                      </span>
                    )}
                    {rev.orderNumber && (
                      <span className="font-mono text-[10px] text-zinc-500">#{rev.orderNumber}</span>
                    )}
                  </div>
                  <span className="text-xs text-orange-400 font-semibold block mt-0.5">
                    For: {getProductName(rev.productId)}
                  </span>
                </div>

                {/* Rating Stars & Status */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border ${
                      rev.status === 'approved'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : rev.status === 'reported'
                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {rev.status}
                  </span>
                </div>
              </div>

              {/* Review Title & Comment */}
              <div>
                {rev.title && <h5 className="font-bold text-white text-xs mb-0.5">{rev.title}</h5>}
                <p className="text-xs text-zinc-300 leading-relaxed">{rev.comment}</p>
              </div>

              {/* Photos */}
              {rev.images && rev.images.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  {rev.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt="Customer review"
                      className="w-14 h-14 rounded-xl object-cover bg-black border border-zinc-800"
                    />
                  ))}
                </div>
              )}

              {/* Moderation Controls */}
              <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-[10px] text-zinc-500 font-mono">
                  Submitted {new Date(rev.createdAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  {rev.status !== 'approved' && (
                    <button
                      onClick={() => handleModerate(rev.id, 'approved')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve &amp; Publish</span>
                    </button>
                  )}
                  {rev.status !== 'rejected' && (
                    <button
                      onClick={() => handleModerate(rev.id, 'rejected')}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-rose-950/80 border border-zinc-700 hover:border-rose-500/40 text-zinc-300 hover:text-rose-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
