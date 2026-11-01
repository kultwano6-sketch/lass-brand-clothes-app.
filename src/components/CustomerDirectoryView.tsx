import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  MessageSquare,
  Award,
  ShoppingBag,
  TrendingUp,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  Phone,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { SubmittedOrder, BrandConfig } from '../types';
import { formatZAR, normalizeWhatsAppNumber, buildWhatsAppLink } from '../utils/whatsapp';

interface CustomerDirectoryViewProps {
  orders: SubmittedOrder[];
  brandConfig: BrandConfig;
}

interface CustomerAggregate {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  preferredSizes: string[];
  primaryPepStore: string;
  isVip: boolean;
  orders: SubmittedOrder[];
}

export const CustomerDirectoryView: React.FC<CustomerDirectoryViewProps> = ({
  orders,
  brandConfig,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'vip' | 'recent'>('all');
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

  // Group orders into unique customer records
  const customers = useMemo(() => {
    const map = new Map<string, CustomerAggregate>();

    orders.forEach((ord) => {
      // Normalize key by phone digits or fallback to lowercased trimmed name
      const phoneDigits = ord.customer.phoneOrWhatsApp.replace(/\D/g, '');
      const key = phoneDigits.length >= 7 ? phoneDigits : ord.customer.fullName.trim().toLowerCase();

      const existing = map.get(key);
      const orderSizes = ord.items.map((it) => it.selectedSize).filter(Boolean);

      if (!existing) {
        map.set(key, {
          id: key,
          fullName: ord.customer.fullName,
          phone: ord.customer.phoneOrWhatsApp,
          email: ord.customer.email,
          orderCount: 1,
          totalSpent: ord.estimatedTotal || 0,
          lastOrderDate: ord.date,
          preferredSizes: Array.from(new Set(orderSizes)),
          primaryPepStore: ord.customer.pepStoreBranch || 'Gauteng Collection',
          isVip: false, // will re-evaluate below
          orders: [ord],
        });
      } else {
        existing.orderCount += 1;
        existing.totalSpent += ord.estimatedTotal || 0;
        if (new Date(ord.date) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = ord.date;
          existing.primaryPepStore = ord.customer.pepStoreBranch || existing.primaryPepStore;
        }
        orderSizes.forEach((sz) => {
          if (!existing.preferredSizes.includes(sz)) {
            existing.preferredSizes.push(sz);
          }
        });
        existing.orders.push(ord);
      }
    });

    const list = Array.from(map.values()).map((c) => ({
      ...c,
      isVip: c.orderCount >= 2 || c.totalSpent >= 600,
    }));

    // Sort by total spent descending
    return list.sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalCustomers = customers.length;
    const vipCount = customers.filter((c) => c.isVip).length;
    const totalRevenue = customers.reduce((acc, c) => acc + c.totalSpent, 0);
    const avgLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    const repeatCount = customers.filter((c) => c.orderCount > 1).length;
    const repeatRate = totalCustomers > 0 ? (repeatCount / totalCustomers) * 100 : 0;

    return {
      totalCustomers,
      vipCount,
      avgLifetimeValue,
      repeatRate,
    };
  }, [customers]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.fullName.toLowerCase().includes(q) ||
        c.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        c.primaryPepStore.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filterType === 'vip') return c.isVip;
      if (filterType === 'recent') {
        const daysAgo = (Date.now() - new Date(c.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= 30;
      }
      return true;
    });
  }, [customers, searchQuery, filterType]);

  const handleExportCSV = () => {
    const headers = [
      'Customer Name',
      'Cellphone / WhatsApp',
      'Email',
      'Total Orders',
      'Lifetime Spend ZAR',
      'VIP Status',
      'Preferred Sizes',
      'Primary PEP Store',
      'Last Order Date',
    ];

    const rows = customers.map((c) => [
      `"${c.fullName.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      c.email ? `"${c.email}"` : '',
      c.orderCount,
      c.totalSpent,
      c.isVip ? 'VIP' : 'Standard',
      `"${c.preferredSizes.join(', ')}"`,
      `"${(c.primaryPepStore || '').replace(/"/g, '""')}"`,
      `"${new Date(c.lastOrderDate).toLocaleDateString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LASS_Customer_Directory_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider">Total Shoppers</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-2xl font-black font-display text-white">
            {metrics.totalCustomers}
          </span>
          <span className="text-[10px] text-zinc-500 block mt-0.5">Unique buyers in database</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-orange-500/30 shadow-md">
          <div className="flex items-center justify-between text-orange-400 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider">VIP Supporters</span>
            <Award className="w-4 h-4 text-orange-400" />
          </div>
          <span className="text-2xl font-black font-display text-orange-400">
            {metrics.vipCount}
          </span>
          <span className="text-[10px] text-zinc-500 block mt-0.5">&gt;R600 spend or 2+ drops</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-emerald-500/30 shadow-md">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider">Avg Customer LTV</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-black font-display text-white">
            {formatZAR(metrics.avgLifetimeValue)}
          </span>
          <span className="text-[10px] text-zinc-500 block mt-0.5">Average revenue per buyer</span>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider">Repeat Rate</span>
            <ShoppingBag className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-2xl font-black font-display text-white">
            {metrics.repeatRate.toFixed(1)}%
          </span>
          <span className="text-[10px] text-zinc-500 block mt-0.5">Returning Kasi streetwear fans</span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by customer name, phone, PEP branch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 font-sans"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-black p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                filterType === 'all'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All ({customers.length})
            </button>
            <button
              onClick={() => setFilterType('vip')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                filterType === 'vip'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-orange-400 hover:text-white'
              }`}
            >
              <Award className="w-3 h-3" />
              <span>VIP ({metrics.vipCount})</span>
            </button>
            <button
              onClick={() => setFilterType('recent')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                filterType === 'recent'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Recent 30d
            </button>
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition-colors border border-zinc-700 shrink-0"
            title="Download Customer Database CSV"
          >
            <Download className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Customers List Table / Cards */}
      <div className="space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900 rounded-2xl border border-zinc-800 text-zinc-500 text-xs">
            No customers match your filter or search criteria.
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const isExpanded = expandedCustomerId === cust.id;
            const waPhone = normalizeWhatsAppNumber(cust.phone);
            const waGreetingUrl = buildWhatsAppLink(
              waPhone,
              `👋 Hi ${cust.fullName}! This is LASS Brand Clothes (Harvest ke LASS).\n\nThank you for supporting authentic local streetwear! We wanted to check in on how your fits are feeling and let you know you're one of our top valued supporters.`
            );

            return (
              <div
                key={cust.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  cust.isVip
                    ? 'bg-zinc-900/90 border-orange-500/40 shadow-sm'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Main Customer Summary Row */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black font-display text-sm shrink-0 shadow-md ${
                        cust.isVip
                          ? 'bg-orange-500 text-white'
                          : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      }`}
                    >
                      {cust.fullName.slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white">{cust.fullName}</span>
                        {cust.isVip && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/40">
                            <Sparkles className="w-3 h-3" />
                            VIP Supporter
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-800 text-zinc-300">
                          {cust.orderCount} {cust.orderCount === 1 ? 'Order' : 'Orders'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
                        <span className="font-mono text-zinc-300 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          {cust.phone}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                          <MapPin className="w-3 h-3 text-blue-400" />
                          {cust.primaryPepStore}
                        </span>
                        {cust.preferredSizes.length > 0 && (
                          <span className="text-[11px] text-zinc-500 font-mono">
                            Sizes: <strong className="text-zinc-300">{cust.preferredSizes.join(', ')}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                        Lifetime Spend
                      </span>
                      <span className="font-display font-black text-base text-white">
                        {formatZAR(cust.totalSpent)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={waGreetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-colors shadow-sm"
                        title="Chat to customer on WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </a>

                      <button
                        onClick={() => setExpandedCustomerId(isExpanded ? null : cust.id)}
                        className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                        title={isExpanded ? 'Collapse order history' : 'Expand order history'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Customer Order Breakdown */}
                {isExpanded && (
                  <div className="p-4 bg-black/60 border-t border-zinc-800 space-y-3 animate-in fade-in duration-150">
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                      Purchase History ({cust.orders.length} transactions)
                    </h5>

                    <div className="space-y-2">
                      {cust.orders.map((ord) => (
                        <div
                          key={ord.orderNumber}
                          className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-orange-400">
                                #{ord.orderNumber}
                              </span>
                              <span className="text-zinc-500 font-mono text-[11px]">
                                {new Date(ord.date).toLocaleDateString()}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  ord.paymentStatus === 'paid'
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                                    : 'bg-zinc-800 text-zinc-400'
                                }`}
                              >
                                {ord.paymentStatus || ord.status}
                              </span>
                            </div>
                            <div className="text-zinc-300 text-[11px] mt-1">
                              {ord.items.map((it) => `${it.name} (${it.selectedSize}) x${it.quantity}`).join(' • ')}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-bold text-white text-sm">
                              {formatZAR(ord.estimatedTotal)}
                            </span>
                            {ord.paxiTrackingCode && (
                              <span className="block text-[10px] text-blue-400 font-mono">
                                PAXI: {ord.paxiTrackingCode}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
