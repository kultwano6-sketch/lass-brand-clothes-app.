import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, Flag, Check, ThumbsUp, Camera, Plus, AlertCircle, X } from 'lucide-react';
import { ProductReview, Product } from '../types';

interface ProductReviewsSectionProps {
  product: Product;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({ product }) => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());

  // Review Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch reviews for this product
  const loadReviews = () => {
    fetch(`/api/reviews?productId=${encodeURIComponent(product.id)}`)
      .then((res) => res.json())
      .then((data: any) => {
        if (data.success && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
        }
      })
      .catch((err) => console.error('Failed to load reviews:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews();
  }, [product.id]);

  const handleReport = async (reviewId: string) => {
    if (reportedIds.has(reviewId)) return;
    try {
      await fetch(`/api/reviews/${reviewId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Reported by customer for moderation' }),
      });
      setReportedIds((prev) => new Set(prev).add(reviewId));
    } catch {
      // Ignore
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!customerName.trim() || !comment.trim()) {
      setSubmitError('Please provide your name and your review feedback.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          orderNumber: orderNumber.trim() || undefined,
          customerName: customerName.trim(),
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
        }),
      });
      const data: any = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setIsWriteModalOpen(false);
        setSubmitSuccess(false);
        setCustomerName('');
        setOrderNumber('');
        setTitle('');
        setComment('');
        loadReviews();
      }, 1200);
    } catch (err: any) {
      setSubmitError(err.message || 'Error submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  // Compute metrics
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : '5.0';

  const verifiedCount = reviews.filter((r) => r.isVerifiedPurchase).length;

  return (
    <div className="mt-8 pt-8 border-t border-zinc-800 space-y-6">
      {/* Header & Score Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 font-mono">
              Streetwear Authenticity
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-[10px] font-bold text-emerald-400 font-mono">
              {verifiedCount} Verified Orders
            </span>
          </div>
          <h3 className="text-lg font-black font-display text-white uppercase tracking-tight mt-0.5">
            Customer Reviews ({totalReviews})
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
            <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
            <span className="font-mono text-sm font-black text-white">{averageRating}</span>
            <span className="text-zinc-500 text-xs">/ 5.0</span>
          </div>

          <button
            type="button"
            onClick={() => setIsWriteModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Write a Review</span>
          </button>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="py-8 text-center text-xs text-zinc-500 font-mono">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center space-y-2">
          <p className="text-xs text-zinc-400">Be the first to review this {product.fit} piece!</p>
          <button
            type="button"
            onClick={() => setIsWriteModalOpen(true)}
            className="text-xs font-bold text-orange-400 underline underline-offset-2 hover:text-orange-300"
          >
            Share fit &amp; fabric feedback
          </button>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1 scrollbar-thin">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 space-y-2.5 transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= rev.rating ? 'fill-orange-400 text-orange-400' : 'text-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-white">{rev.customerName}</span>
                  {rev.isVerifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                      <ShieldCheck className="w-3 h-3" />
                      Verified Buyer
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleReport(rev.id)}
                    title="Report inappropriate content"
                    disabled={reportedIds.has(rev.id)}
                    className="text-zinc-600 hover:text-zinc-400 transition-colors p-1"
                  >
                    <Flag className={`w-3 h-3 ${reportedIds.has(rev.id) ? 'text-amber-500' : ''}`} />
                  </button>
                </div>
              </div>

              {rev.title && (
                <h4 className="text-xs font-black text-white">{rev.title}</h4>
              )}

              <p className="text-xs text-zinc-300 leading-relaxed">{rev.comment}</p>

              {rev.images && rev.images.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  {rev.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt="Customer review photo"
                      className="w-14 h-14 rounded-xl object-cover border border-zinc-800"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Submission Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div
            className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsWriteModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-full bg-zinc-900 border border-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 font-mono">
                Customer Feedback
              </span>
              <h3 className="text-xl font-black font-display text-white uppercase tracking-tight">
                Review {product.name}
              </h3>
            </div>

            {submitSuccess ? (
              <div className="p-6 text-center space-y-2 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-emerald-300">
                <Check className="w-8 h-8 mx-auto text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Thank you for your review!</h4>
                <p className="text-xs">Your fit feedback helps other Kasi streetwear lovers choose their size.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {submitError && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Star rating picker */}
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                    Rating (1 to 5 Stars):
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-zinc-700 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= (hoverRating || rating)
                              ? 'fill-orange-400 text-orange-400'
                              : 'text-zinc-700'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-mono font-bold text-zinc-400 ml-2">
                      {hoverRating || rating} / 5 Stars
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sbusiso M."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Order Number (For Verified Badge)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. LASS-1042"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">
                    Headline (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Heavyweight cotton, perfect boxy fit"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">
                    Detailed Feedback *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Tell us about the fabric weight, fit, stitching, and PAXI collection experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-orange-500 hover:bg-orange-400 text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Submitting Review...' : 'Publish Customer Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
