import React, { useState, useEffect } from 'react';
import { Flame, Plus, Calendar, Clock, Edit2, Trash2, CheckCircle, Sparkles, X, AlertCircle } from 'lucide-react';
import { LassDrop, Product } from '../types';

interface AdminDropsViewProps {
  allProducts: Product[];
  onNotify: (msg: string) => void;
}

export const AdminDropsView: React.FC<AdminDropsViewProps> = ({ allProducts, onNotify }) => {
  const [drops, setDrops] = useState<LassDrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'scheduled' | 'draft' | 'ended'>('all');
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingDrop, setEditingDrop] = useState<Partial<LassDrop> | null>(null);

  const fetchDrops = () => {
    fetch('/api/drops')
      .then((res) => res.json())
      .then((data: any) => {
        if (data.success && Array.isArray(data.drops)) {
          setDrops(data.drops);
        }
      })
      .catch((err) => console.error('Failed to load drops:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDrops();
  }, []);

  const handleOpenCreate = () => {
    setEditingDrop({
      title: '',
      subtitle: '',
      slug: '',
      description: '',
      bannerImage: '/clothes/site_bw_pocket_01_front.jpg',
      productIds: allProducts.slice(0, 3).map((p) => p.id),
      launchDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
      status: 'scheduled',
      isLimitedEdition: true,
      totalPieces: 150,
      remainingPieces: 150,
    });
    setIsEditingModalOpen(true);
  };

  const handleOpenEdit = (drop: LassDrop) => {
    setEditingDrop({
      ...drop,
      launchDate: drop.launchDate.slice(0, 16),
    });
    setIsEditingModalOpen(true);
  };

  const handleSaveDrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDrop?.title) return;

    try {
      const payload = {
        ...editingDrop,
        id: editingDrop.id || `drop-${Date.now()}`,
        slug: editingDrop.slug || editingDrop.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        launchDate: new Date(editingDrop.launchDate || Date.now()).toISOString(),
        createdAt: editingDrop.createdAt || new Date().toISOString(),
      };

      const res = await fetch('/api/admin/drops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as any;
      if (data.success) {
        onNotify(`Drop "${payload.title}" saved successfully.`);
        setIsEditingModalOpen(false);
        setEditingDrop(null);
        fetchDrops();
      } else {
        alert(data.error || 'Failed to save drop');
      }
    } catch (err: any) {
      alert(`Error saving drop: ${err.message}`);
    }
  };

  const handleDeleteDrop = async (id: string, title: string) => {
    if (!window.confirm(`Delete drop "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/drops/${id}`, { method: 'DELETE' });
      const data = (await res.json()) as any;
      if (data.success) {
        onNotify(`Drop "${title}" deleted.`);
        fetchDrops();
      }
    } catch {
      alert('Failed to delete drop');
    }
  };

  const handleQuickStatusChange = async (drop: LassDrop, newStatus: LassDrop['status']) => {
    try {
      const res = await fetch('/api/admin/drops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...drop, status: newStatus }),
      });
      if (res.ok) {
        onNotify(`Drop status changed to ${newStatus.toUpperCase()}`);
        fetchDrops();
      }
    } catch {
      alert('Failed to update status');
    }
  };

  const filtered = drops.filter((d) => (filter === 'all' ? true : d.status === filter));

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Banner & Action */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <h3 className="font-display font-black text-lg text-white uppercase tracking-tight">
              LASS Drops &amp; Exclusive Releases
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Schedule limited-quantity streetwear batches with countdown timers, lookbook artwork, and auto-activation.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Drop</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto text-xs font-bold">
        {(
          [
            { id: 'all', label: 'All Collections' },
            { id: 'active', label: 'Active Now' },
            { id: 'scheduled', label: 'Scheduled' },
            { id: 'draft', label: 'Drafts' },
            { id: 'ended', label: 'Archived' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              filter === t.id
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Drops Grid */}
      {loading ? (
        <div className="p-8 text-center text-xs text-zinc-500">Loading drops catalog...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <Flame className="w-8 h-8 text-zinc-600 mx-auto" />
          <h4 className="font-bold text-white text-sm">No drops in this filter</h4>
          <p className="text-xs text-zinc-400">Create a drop to schedule a limited release.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((drop) => {
            const launchDateObj = new Date(drop.launchDate);
            const isLive = drop.status === 'active';
            const isUpcoming = drop.status === 'scheduled';

            return (
              <div
                key={drop.id}
                className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border ${
                            isLive
                              ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                              : isUpcoming
                              ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          {drop.status}
                        </span>
                        {drop.isLimitedEdition && (
                          <span className="text-[10px] text-amber-400 font-bold">Limited Edition</span>
                        )}
                      </div>
                      <h4 className="font-bold text-white text-base leading-snug">{drop.title}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">{drop.subtitle}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(drop)}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        title="Edit Drop"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDrop(drop.id, drop.title)}
                        className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        title="Delete Drop"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 mt-2 line-clamp-2 leading-relaxed">
                    {drop.description}
                  </p>
                </div>

                {/* Metrics & Timing */}
                <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Launch: {launchDateObj.toLocaleDateString()} {launchDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Quick Status Toggles */}
                  <div className="flex items-center gap-1.5">
                    {drop.status !== 'active' && (
                      <button
                        onClick={() => handleQuickStatusChange(drop, 'active')}
                        className="px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/30 text-[11px] font-bold transition-all cursor-pointer"
                      >
                        Go Live Now
                      </button>
                    )}
                    {drop.status === 'active' && (
                      <button
                        onClick={() => handleQuickStatusChange(drop, 'ended')}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-[11px] font-bold transition-all cursor-pointer"
                      >
                        Archive Drop
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Drop Modal */}
      {isEditingModalOpen && editingDrop && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-display font-black text-lg text-white">
                {editingDrop.id ? 'Edit LASS Drop' : 'Create New LASS Drop'}
              </h3>
              <button
                onClick={() => setIsEditingModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDrop} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Collection Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Winter Warmth &amp; Heavyweight Fleeces"
                  value={editingDrop.title || ''}
                  onChange={(e) => setEditingDrop({ ...editingDrop, title: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Subtitle / Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. 150 Heavyweight 280gsm pieces"
                  value={editingDrop.subtitle || ''}
                  onChange={(e) => setEditingDrop({ ...editingDrop, subtitle: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingDrop.description || ''}
                  onChange={(e) => setEditingDrop({ ...editingDrop, description: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Launch Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={editingDrop.launchDate || ''}
                    onChange={(e) => setEditingDrop({ ...editingDrop, launchDate: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Status</label>
                  <select
                    value={editingDrop.status || 'scheduled'}
                    onChange={(e) => setEditingDrop({ ...editingDrop, status: e.target.value as any })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-orange-500"
                  >
                    <option value="draft">Draft (Hidden)</option>
                    <option value="scheduled">Scheduled (Countdown)</option>
                    <option value="active">Active (Live Now)</option>
                    <option value="ended">Ended (Archived)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold shadow-lg shadow-orange-500/20"
                >
                  Save Drop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
