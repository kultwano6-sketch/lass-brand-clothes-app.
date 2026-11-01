import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  Truck,
  ArrowUpRight,
  Sparkles,
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  Filter
} from 'lucide-react';
import { SubmittedOrder, Product, BrandConfig } from '../types';
import { formatZAR } from '../utils/whatsapp';

interface SalesAnalyticsViewProps {
  orders: SubmittedOrder[];
  products: Product[];
  brandConfig: BrandConfig;
}

type Timeframe = '7d' | '30d' | 'all';

export const SalesAnalyticsView: React.FC<SalesAnalyticsViewProps> = ({
  orders,
  products,
  brandConfig,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Filter orders by timeframe
  const filteredOrders = useMemo(() => {
    if (timeframe === 'all') return orders;

    const now = Date.now();
    const days = timeframe === '7d' ? 7 : 30;
    const cutoffTime = now - days * 24 * 60 * 60 * 1000;

    return orders.filter((o) => {
      const orderTimestamp = new Date(o.date).getTime();
      return !isNaN(orderTimestamp) && orderTimestamp >= cutoffTime;
    });
  }, [orders, timeframe]);

  // Aggregate Key Financial Metrics
  const metrics = useMemo(() => {
    let totalGrossRevenue = 0;
    let paidRevenue = 0;
    let pendingRevenue = 0;
    let totalUnitsSold = 0;

    const statusCounts: Record<string, number> = {
      completed: 0,
      processing: 0,
      pending: 0,
      dispatched: 0,
    };

    const deliveryCounts: Record<string, number> = {
      'paxi-standard': 0,
      'paxi-express': 0,
      'collection': 0,
    };

    const destinationCounts: Record<string, { count: number; name: string }> = {};

    filteredOrders.forEach((order) => {
      const total = order.estimatedTotal || 0;
      totalGrossRevenue += total;

      if (order.status === 'completed' || (order as any).paymentStatus === 'COMPLETE') {
        paidRevenue += total;
      } else {
        pendingRevenue += total;
      }

      // Count order statuses
      const s = order.status || 'pending';
      statusCounts[s] = (statusCounts[s] || 0) + 1;

      // Count units
      (order.items || []).forEach((item) => {
        totalUnitsSold += item.quantity || 1;
      });

      // Delivery method
      const method = order.customer.deliveryMethod || 'paxi-standard';
      deliveryCounts[method] = (deliveryCounts[method] || 0) + 1;

      // Extract destination town/city from pepStoreBranch or address
      const branch = (order.customer.pepStoreBranch || 'Gauteng Studio').trim();
      let hub = 'Gauteng Studio Collection';

      if (branch.toLowerCase().includes('soweto') || branch.toLowerCase().includes('bara') || branch.toLowerCase().includes('maponya') || branch.toLowerCase().includes('jabulani')) {
        hub = 'Soweto (Gauteng)';
      } else if (branch.toLowerCase().includes('pretoria') || branch.toLowerCase().includes('menlyn') || branch.toLowerCase().includes('mamelodi') || branch.toLowerCase().includes('soshanguve')) {
        hub = 'Pretoria (Gauteng)';
      } else if (branch.toLowerCase().includes('johannesburg') || branch.toLowerCase().includes('carlton') || branch.toLowerCase().includes('braamfontein') || branch.toLowerCase().includes('tembisa')) {
        hub = 'Johannesburg East / Central';
      } else if (branch.toLowerCase().includes('durban') || branch.toLowerCase().includes('workshop') || branch.toLowerCase().includes('gateway') || branch.toLowerCase().includes('umlazi')) {
        hub = 'Durban / KZN Coast';
      } else if (branch.toLowerCase().includes('polokwane') || branch.toLowerCase().includes('savannah') || branch.toLowerCase().includes('thohoyandou') || branch.toLowerCase().includes('tzaneen')) {
        hub = 'Polokwane / Limpopo';
      } else if (branch.toLowerCase().includes('cape town') || branch.toLowerCase().includes('canal walk') || branch.toLowerCase().includes('mitchells plain') || branch.toLowerCase().includes('golden acre')) {
        hub = 'Cape Town (Western Cape)';
      } else if (branch !== 'Gauteng Studio') {
        hub = branch.slice(0, 24);
      }

      if (!destinationCounts[hub]) {
        destinationCounts[hub] = { count: 0, name: hub };
      }
      destinationCounts[hub].count += 1;
    });

    const averageOrderValue = filteredOrders.length > 0 ? totalGrossRevenue / filteredOrders.length : 0;
    const fulfillmentRate =
      filteredOrders.length > 0
        ? Math.round(((statusCounts.completed + (statusCounts.dispatched || 0)) / filteredOrders.length) * 100)
        : 100;

    return {
      totalGrossRevenue,
      paidRevenue,
      pendingRevenue,
      totalUnitsSold,
      averageOrderValue,
      fulfillmentRate,
      statusCounts,
      deliveryCounts,
      topDestinations: Object.values(destinationCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    };
  }, [filteredOrders]);

  // Compute Product Bestseller Performance
  const bestsellers = useMemo(() => {
    const itemSales: Record<
      string,
      {
        product: Product;
        unitsSold: number;
        revenue: number;
        ordersCount: number;
      }
    > = {};

    // Initialize with all current products
    products.forEach((p) => {
      itemSales[p.id] = {
        product: p,
        unitsSold: 0,
        revenue: 0,
        ordersCount: 0,
      };
    });

    // Populate from orders
    filteredOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const pId = item.productId || item.name;
        const matchedProduct: Product = products.find((p) => p.id === pId || p.name === item.name) || {
          id: pId,
          name: item.name,
          sku: `LASS-${pId.slice(-4)}`,
          price: item.unitPrice,
          category: 't-shirts',
          printType: 'Pocket Print',
          description: '',
          images: ['/clothes/site_bw_pocket_01_front.jpg'],
          availableSizes: ['S', 'M', 'L', 'XL'],
          availableColours: ['Classic Black'],
          fit: 'True to Size',
          fabricDetails: '100% Cotton',
          isNewDrop: false,
          isFeatured: false,
          isAuditedOriginal: true,
          stockQuantity: 10,
          status: 'published',
          isPlaceholderPhoto: false,
        };

        if (!itemSales[pId]) {
          itemSales[pId] = {
            product: matchedProduct,
            unitsSold: 0,
            revenue: 0,
            ordersCount: 0,
          };
        }
        itemSales[pId].unitsSold += item.quantity || 1;
        itemSales[pId].revenue += item.totalPrice || ((item.unitPrice || matchedProduct.price) * (item.quantity || 1));
        itemSales[pId].ordersCount += 1;
      });
    });

    return Object.values(itemSales).sort((a, b) => b.unitsSold - a.unitsSold);
  }, [filteredOrders, products]);

  // Generate Chronological Daily Data for the Revenue Trend Chart
  const chartPoints = useMemo(() => {
    const dayMap: Record<string, { date: string; revenue: number; orders: number }> = {};

    filteredOrders.forEach((order) => {
      // Normalise date label (e.g. "28 Oct" or "2026-10-28")
      let dateKey = order.date || 'Recent';
      try {
        const d = new Date(order.date);
        if (!isNaN(d.getTime())) {
          dateKey = d.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
        }
      } catch {}

      if (!dayMap[dateKey]) {
        dayMap[dateKey] = { date: dateKey, revenue: 0, orders: 0 };
      }
      dayMap[dateKey].revenue += order.estimatedTotal || 0;
      dayMap[dateKey].orders += 1;
    });

    const points = Object.values(dayMap);
    if (points.length < 2) {
      // Add baseline anchor if single day or empty
      return [
        { date: 'Start', revenue: 0, orders: 0 },
        ...points,
      ];
    }
    return points;
  }, [filteredOrders]);

  const maxRevenue = useMemo(() => {
    return Math.max(...chartPoints.map((p) => p.revenue), 1000);
  }, [chartPoints]);

  // Export Analytics CSV Summary
  const handleExportAnalyticsCSV = () => {
    const lines = [
      'LASS BRAND CLOTHES — SALES ANALYTICS REPORT',
      `Generated: ${new Date().toLocaleString('en-ZA')}`,
      `Timeframe: ${timeframe.toUpperCase()}`,
      '',
      '--- FINANCIAL SUMMARY ---',
      `Total Gross Revenue (ZAR),${metrics.totalGrossRevenue.toFixed(2)}`,
      `Average Order Value (ZAR),${metrics.averageOrderValue.toFixed(2)}`,
      `Total Orders,${filteredOrders.length}`,
      `Total Units Sold,${metrics.totalUnitsSold}`,
      `Fulfillment Rate,${metrics.fulfillmentRate}%`,
      '',
      '--- BESTSELLER PRODUCT PERFORMANCE ---',
      'Rank,Product Name,SKU,Category,Units Sold,Revenue ZAR,Stock Left',
      ...bestsellers.map((b, idx) =>
        [
          idx + 1,
          `"${b.product.name.replace(/"/g, '""')}"`,
          b.product.sku,
          b.product.category,
          b.unitsSold,
          b.revenue.toFixed(2),
          b.product.stockQuantity,
        ].join(',')
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lass-sales-analytics-${timeframe}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Controls: Timeframe Filter and CSV Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
            <TrendingUp className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h3 className="font-display font-black text-sm text-white">
              Executive Sales Performance
            </h3>
            <p className="text-[11px] text-zinc-400">
              Live revenue velocity, order volumes, and bestsellers metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Timeframe Filter Buttons */}
          <div className="p-1 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-1 text-xs">
            {(
              [
                { id: '7d', label: 'Last 7 Days' },
                { id: '30d', label: 'Last 30 Days' },
                { id: 'all', label: 'All-Time' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeframe(t.id)}
                className={`px-3 py-1 rounded-lg font-bold transition-all text-xs ${
                  timeframe === t.id
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Export Report */}
          <button
            onClick={handleExportAnalyticsCSV}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 border border-zinc-700 shrink-0"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5 text-zinc-300" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS (4 Column Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Gross Revenue */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-medium">Total Gross Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display font-black text-2xl text-white tracking-tight font-mono tabular-nums">
              {formatZAR(metrics.totalGrossRevenue)}
            </div>
            <div className="flex items-center gap-2 text-[11px] pt-1">
              <span className="text-emerald-400 font-bold">
                {formatZAR(metrics.paidRevenue)} paid
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-orange-400">
                {formatZAR(metrics.pendingRevenue)} pending
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Average Order Value */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-medium">Average Order Value (AOV)</span>
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display font-black text-2xl text-white tracking-tight font-mono tabular-nums">
              {formatZAR(metrics.averageOrderValue)}
            </div>
            <div className="text-[11px] text-zinc-400 pt-1">
              Across <strong className="text-white">{filteredOrders.length}</strong> total customer orders
            </div>
          </div>
        </div>

        {/* Card 3: Total Units Sold */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-medium">Total Streetwear Units</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display font-black text-2xl text-white tracking-tight font-mono tabular-nums">
              {metrics.totalUnitsSold} <span className="text-xs font-normal text-zinc-400 font-sans">pieces</span>
            </div>
            <div className="text-[11px] text-zinc-400 pt-1">
              ~{(metrics.totalUnitsSold / Math.max(1, filteredOrders.length)).toFixed(1)} pieces per basket
            </div>
          </div>
        </div>

        {/* Card 4: Fulfillment Velocity */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-medium">Fulfillment Rate</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display font-black text-2xl text-emerald-400 tracking-tight font-mono tabular-nums">
              {metrics.fulfillmentRate}%
            </div>
            <div className="text-[11px] text-zinc-400 pt-1 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-blue-400" />
              <span>{metrics.deliveryCounts['paxi-standard'] + metrics.deliveryCounts['paxi-express']} via PAXI PEP</span>
            </div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE SALES REVENUE TRAJECTORY CHART */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-display font-bold text-sm text-white flex items-center gap-2">
              <span>Revenue Trajectory &amp; Velocity</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                Live Data
              </span>
            </h4>
            <p className="text-[11px] text-zinc-400">
              Daily revenue volume in South African Rand (ZAR)
            </p>
          </div>

          {hoveredPointIndex !== null && chartPoints[hoveredPointIndex] && (
            <div className="text-right animate-in fade-in">
              <span className="text-xs text-zinc-400 block">
                {chartPoints[hoveredPointIndex].date}
              </span>
              <strong className="text-sm font-black text-orange-400 font-mono">
                {formatZAR(chartPoints[hoveredPointIndex].revenue)}
              </strong>
            </div>
          )}
        </div>

        {/* SVG Responsive Chart */}
        <div className="relative h-44 sm:h-52 w-full pt-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 500 160" preserveAspectRatio="none">
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid horizontal lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
              <line
                key={i}
                x1="0"
                y1={pct * 140 + 10}
                x2="500"
                y2={pct * 140 + 10}
                stroke="#27272a"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            ))}

            {/* SVG Bars & Area Points */}
            {chartPoints.map((pt, idx) => {
              const x = (idx / Math.max(1, chartPoints.length - 1)) * 460 + 20;
              const barHeight = Math.max(8, (pt.revenue / maxRevenue) * 125);
              const y = 145 - barHeight;
              const isHovered = hoveredPointIndex === idx;

              return (
                <g
                  key={idx}
                  onMouseEnter={() => setHoveredPointIndex(idx)}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                  className="cursor-pointer"
                >
                  {/* Vertical bar highlight on hover */}
                  {isHovered && (
                    <rect
                      x={x - 16}
                      y="10"
                      width="32"
                      height="135"
                      fill="#f97316"
                      opacity="0.1"
                      rx="4"
                    />
                  )}

                  {/* Bar */}
                  <rect
                    x={x - 8}
                    y={y}
                    width="16"
                    height={barHeight}
                    rx="4"
                    className={`transition-all ${
                      isHovered ? 'fill-orange-400' : 'fill-orange-500/80 hover:fill-orange-400'
                    }`}
                  />

                  {/* Dot on top */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 4.5 : 3}
                    className={`transition-all ${isHovered ? 'fill-white stroke-orange-500 stroke-2' : 'fill-orange-400'}`}
                  />

                  {/* Date label */}
                  <text
                    x={x}
                    y="158"
                    fontSize="9"
                    fill={isHovered ? '#ffffff' : '#71717a'}
                    textAnchor="middle"
                    fontWeight={isHovered ? 'bold' : 'normal'}
                  >
                    {pt.date}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* TWO COLUMN GRID: BESTSELLERS & REGIONAL PAXI DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Bestsellers Leaderboard */}
        <div className="lg:col-span-2 p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-display font-bold text-sm text-white flex items-center gap-2">
                <span>Bestsellers &amp; Garment Performance</span>
                <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                  Ranked by Units
                </span>
              </h4>
              <p className="text-[11px] text-zinc-400">
                Top-performing streetwear pieces and stock levels
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
                  <th className="pb-3 pr-2 w-10">Rank</th>
                  <th className="pb-3 px-3">Product</th>
                  <th className="pb-3 px-3 text-right">Units Sold</th>
                  <th className="pb-3 px-3 text-right">Revenue (ZAR)</th>
                  <th className="pb-3 pl-3 text-right">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {bestsellers.slice(0, 6).map((item, index) => {
                  const shareOfTotal =
                    metrics.totalUnitsSold > 0
                      ? Math.round((item.unitsSold / metrics.totalUnitsSold) * 100)
                      : 0;

                  return (
                    <tr key={item.product.id} className="hover:bg-zinc-800/40 transition-colors">
                      {/* Rank */}
                      <td className="py-3 pr-2 font-mono font-black text-sm">
                        {index === 0 ? (
                          <span className="text-amber-400">🥇 #1</span>
                        ) : index === 1 ? (
                          <span className="text-zinc-300">🥈 #2</span>
                        ) : index === 2 ? (
                          <span className="text-amber-600">🥉 #3</span>
                        ) : (
                          <span className="text-zinc-500">#{index + 1}</span>
                        )}
                      </td>

                      {/* Product Thumbnail & Name */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-9 h-9 rounded-lg object-cover bg-black border border-zinc-800 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate text-xs">
                              {item.product.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              SKU: {item.product.sku}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Units Sold with mini share bar */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-mono font-bold text-white tabular-nums">
                          {item.unitsSold} pcs
                        </div>
                        <div className="w-16 h-1 rounded-full bg-zinc-800 overflow-hidden ml-auto mt-1">
                          <div
                            className="h-full bg-orange-500 rounded-full"
                            style={{ width: `${Math.min(100, shareOfTotal)}%` }}
                          />
                        </div>
                      </td>

                      {/* Revenue */}
                      <td className="py-3 px-3 text-right font-mono font-black text-orange-400 tabular-nums">
                        {formatZAR(item.revenue)}
                      </td>

                      {/* Stock Health */}
                      <td className="py-3 pl-3 text-right">
                        {item.product.stockQuantity <= 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-950/60 text-rose-400 border border-rose-500/30">
                            Sold Out
                          </span>
                        ) : item.product.stockQuantity <= 5 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-500/30">
                            {item.product.stockQuantity} Left
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                            {item.product.stockQuantity} In Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Top PAXI Destination Hubs */}
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <div>
            <h4 className="font-display font-bold text-sm text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-400" />
              <span>Top Delivery Hubs</span>
            </h4>
            <p className="text-[11px] text-zinc-400">
              Regional demand hotspots across South Africa
            </p>
          </div>

          <div className="space-y-3">
            {metrics.topDestinations.map((dest, i) => {
              const pct =
                filteredOrders.length > 0
                  ? Math.round((dest.count / filteredOrders.length) * 100)
                  : 0;

              return (
                <div key={i} className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white truncate max-w-[170px]">
                      {dest.name}
                    </span>
                    <span className="font-mono text-zinc-400 font-bold">
                      {dest.count} orders ({pct}%)
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>PAXI Standard (R60): <strong>{metrics.deliveryCounts['paxi-standard']}</strong></span>
            <span>Express (R100): <strong>{metrics.deliveryCounts['paxi-express']}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
