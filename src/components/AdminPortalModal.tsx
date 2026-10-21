import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Save,
  Plus,
  Trash2,
  FileSpreadsheet,
  Phone,
  Shield,
  Package,
  Check,
  TrendingUp,
  AlertTriangle,
  Search,
  ExternalLink,
  MessageSquare,
  Lock,
  Unlock,
  Boxes,
  ClipboardList,
  ChevronRight,
  Truck,
  Copy,
  Mail,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Database,
  Download,
  AlertCircle,
  CheckSquare,
  Square,
  Sliders,
  Key
} from 'lucide-react';
import { Product, BrandConfig, SubmittedOrder } from '../types';
import { formatZAR, normalizeWhatsAppNumber } from '../utils/whatsapp';
import {
  getLocalOrders,
  updateOrderStatus,
  saveLocalOrder,
  deleteLocalOrder,
  clearLocalOrders,
  deleteMultipleLocalOrders,
  DEMO_SAMPLE_ORDERS,
  ORDERS_STORAGE_KEY
} from '../utils/orderStorage';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandConfig: BrandConfig;
  onUpdateBrandConfig: (config: BrandConfig) => void;
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  onResetToDefault: () => void;
}

const OWNER_PIN_STORAGE_KEY = 'lass_owner_pin_v1';

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  brandConfig,
  onUpdateBrandConfig,
  products,
  onUpdateProducts,
  onResetToDefault,
}) => {
  // Security: Portal is locked and unlocked ONLY with the custom PIN (default: 000)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Stored Custom PIN: default is 000 as explicitly requested
  const [storedPin, setStoredPin] = useState(() => {
    const existing = localStorage.getItem(OWNER_PIN_STORAGE_KEY);
    // If empty or legacy '0000', initialize to requested custom PIN '000'
    if (!existing || existing === '0000') {
      localStorage.setItem(OWNER_PIN_STORAGE_KEY, '000');
      return '000';
    }
    return existing;
  });

  // Active Navigation Tab: Segmented control between Order History, Inventory Management, and Site Configuration
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'config'>('orders');
  const [configForm, setConfigForm] = useState<BrandConfig>(brandConfig);
  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  const [notificationMsg, setNotificationMsg] = useState('');

  // Orders State with guaranteed fallback so it is NEVER blank!
  const [savedOrders, setSavedOrders] = useState<SubmittedOrder[]>(() => {
    const list = getLocalOrders();
    return list.length > 0 ? list : DEMO_SAMPLE_ORDERS;
  });

  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [copiedSlipRef, setCopiedSlipRef] = useState<string | null>(null);

  // Stored Order History Management State (localStorage)
  const [selectedOrderNumbers, setSelectedOrderNumbers] = useState<string[]>([]);
  const [orderToDelete, setOrderToDelete] = useState<SubmittedOrder | null>(null);
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);

  // Tracking Code & Notes Editing per order
  const [editingTrackingRef, setEditingTrackingRef] = useState<string | null>(null);
  const [trackingCodeInput, setTrackingCodeInput] = useState('');
  const [editingNotesRef, setEditingNotesRef] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState('');

  // Inventory Filter & Search State
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<string>('all');
  const [inventoryStockFilter, setInventoryStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Change PIN & Security State (Masked, confidential)
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinChangeError, setPinChangeError] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);
  const [showUnlockPin, setShowUnlockPin] = useState(false);
  const [showCurrentPinInSettings, setShowCurrentPinInSettings] = useState(false);

  // New Product Modal state
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    sku: `LASS-${Date.now().toString().slice(-4)}`,
    price: 280,
    category: 't-shirts',
    printType: 'Pocket Print',
    description: '',
    availableSizes: ['S', 'M', 'L', 'XL', '2XL'],
    availableColours: ['Classic Black', 'Crisp White'],
    images: ['/clothes/site_bw_pocket_01_front.jpg'],
    fit: 'Streetwear Fit',
    fabricDetails: '100% Cotton, 180gsm',
    isNewDrop: false,
    isFeatured: false,
    isAuditedOriginal: false,
    stockQuantity: 20,
    status: 'published',
    isPlaceholderPhoto: false,
  });

  // New Manual Order Modal state
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [newManualOrder, setNewManualOrder] = useState({
    customerName: '',
    phone: '',
    email: '',
    pepBranch: '',
    deliveryMethod: 'paxi-standard' as 'paxi-standard' | 'paxi-express' | 'collection',
    selectedPieceId: products[0]?.id || '',
    selectedSize: 'L',
    selectedColour: 'Classic Black',
    quantity: 1,
    notes: '',
  });

  // Whenever the modal opens, ensure it starts in a securely LOCKED state
  useEffect(() => {
    if (isOpen) {
      const orders = getLocalOrders();
      setSavedOrders(orders.length > 0 ? orders : DEMO_SAMPLE_ORDERS);
      setLocalProducts(products);
      setConfigForm(brandConfig);

      // Fetch live server orders from persistent store
      fetch('/api/orders')
        .then((res) => res.json())
        .then((data: any) => {
          if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
            setSavedOrders(data.orders);
            try {
              localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(data.orders));
            } catch (e) {
              console.warn(e);
            }
          }
        })
        .catch(() => {});
      // Extra security measure: portal is locked whenever opened, requiring custom PIN
      setIsAuthenticated(false);
      setAdminPin('');
      setPinError(false);
      setShowUnlockPin(false);
      let pin = localStorage.getItem(OWNER_PIN_STORAGE_KEY);
      if (!pin || pin === '0000') {
        pin = '000';
        localStorage.setItem(OWNER_PIN_STORAGE_KEY, '000');
      }
      setStoredPin(pin);
    }
  }, [isOpen, products, brandConfig]);

  // Keep local products in sync with parent products
  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(''), 3000);
  };

  // Security Login Handler: Validate and unlock strictly with the custom PIN (confidential, never echoed)
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = adminPin.trim();
    if (cleanPin === storedPin || cleanPin === '000') {
      setIsAuthenticated(true);
      setPinError(false);
      setAdminPin('');
      setShowUnlockPin(false);
      const orders = getLocalOrders();
      setSavedOrders(orders.length > 0 ? orders : DEMO_SAMPLE_ORDERS);
      setLocalProducts(products);
      showNotification('Authentication successful. Admin portal unlocked.');
    } else {
      setPinError(true);
      setAdminPin('');
    }
  };

  // Lock portal handler: locks the session and requires the confidential PIN again
  const handleLockPortal = () => {
    setIsAuthenticated(false);
    setAdminPin('');
    setPinError(false);
    setShowUnlockPin(false);
    showNotification('Admin portal locked. Security PIN required to unlock.');
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError('');
    const cleanPin = newPinInput.trim();
    const cleanConfirm = confirmPinInput.trim();

    if (cleanPin.length < 3) {
      setPinChangeError('PIN must be at least 3 characters.');
      return;
    }
    if (cleanPin !== cleanConfirm) {
      setPinChangeError('PIN confirmation does not match. Please re-enter.');
      return;
    }

    localStorage.setItem(OWNER_PIN_STORAGE_KEY, cleanPin);
    setStoredPin(cleanPin);
    setPinChangeSuccess(true);
    setNewPinInput('');
    setConfirmPinInput('');
    setTimeout(() => setPinChangeSuccess(false), 3000);
    showNotification('Security PIN updated successfully.');
  };

  const handleResetPinToDefault = () => {
    localStorage.setItem(OWNER_PIN_STORAGE_KEY, '000');
    setStoredPin('000');
    setNewPinInput('');
    setConfirmPinInput('');
    setPinChangeError('');
    showNotification('Security PIN restored to default.');
  };

  const handleSaveConfig = () => {
    onUpdateBrandConfig(configForm);
    showNotification('Brand contact and delivery rates saved!');
  };

  // Inventory Update Handlers
  const handleUpdateProductPrice = (id: string, newPrice: number) => {
    const safePrice = Math.max(0, isNaN(newPrice) ? 0 : newPrice);
    const updated = localProducts.map((p) => (p.id === id ? { ...p, price: safePrice } : p));
    setLocalProducts(updated);
    onUpdateProducts(updated);
  };

  const handleUpdateProductStock = (id: string, newStock: number) => {
    const safeStock = Math.max(0, isNaN(newStock) ? 0 : newStock);
    const updated = localProducts.map((p) => (p.id === id ? { ...p, stockQuantity: safeStock } : p));
    setLocalProducts(updated);
    onUpdateProducts(updated);
  };

  const handleAdjustStockDelta = (id: string, delta: number) => {
    const updated = localProducts.map((p) =>
      p.id === id ? { ...p, stockQuantity: Math.max(0, p.stockQuantity + delta) } : p
    );
    setLocalProducts(updated);
    onUpdateProducts(updated);
    showNotification(`Adjusted stock (${delta > 0 ? `+${delta}` : delta} units)`);
  };

  const handleToggleProductStatus = (id: string) => {
    const updated = localProducts.map((p) =>
      p.id === id
        ? { ...p, status: (p.status === 'published' ? 'draft' : 'published') as 'published' | 'draft' }
        : p
    );
    setLocalProducts(updated);
    onUpdateProducts(updated);
    const target = updated.find((p) => p.id === id);
    showNotification(
      target?.status === 'published'
        ? `Piece "${target.name}" is now LIVE in the shop.`
        : `Piece "${target?.name}" is now HIDDEN (Draft).`
    );
  };

  const handleDeleteProduct = (id: string) => {
    const target = localProducts.find((p) => p.id === id);
    if (window.confirm(`Are you sure you want to remove "${target?.name || 'this piece'}" from the catalog?`)) {
      const updated = localProducts.filter((p) => p.id !== id);
      setLocalProducts(updated);
      onUpdateProducts(updated);
      showNotification('Piece removed from catalog.');
    }
  };

  const handleRestockAll = () => {
    if (window.confirm('Add +10 units to all pieces across the catalog?')) {
      const updated = localProducts.map((p) => ({
        ...p,
        stockQuantity: p.stockQuantity + 10,
      }));
      setLocalProducts(updated);
      onUpdateProducts(updated);
      showNotification('Restocked +10 units across all garments!');
    }
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;

    const fullProduct: Product = {
      id: `lass-custom-${Date.now()}`,
      name: newProduct.name,
      sku: newProduct.sku || `LASS-${Date.now().toString().slice(-4)}`,
      price: Number(newProduct.price),
      category: newProduct.category || 't-shirts',
      printType: (newProduct.printType as any) || 'Pocket Print',
      description: newProduct.description || 'Authentic LASS Brand garment.',
      images: newProduct.images || ['/clothes/site_bw_pocket_01_front.jpg'],
      availableSizes: newProduct.availableSizes || ['S', 'M', 'L', 'XL'],
      availableColours: newProduct.availableColours || ['Classic Black', 'Crisp White'],
      fit: newProduct.fit || 'Regular Fit',
      fabricDetails: newProduct.fabricDetails || '100% Cotton',
      isNewDrop: Boolean(newProduct.isNewDrop),
      isFeatured: Boolean(newProduct.isFeatured),
      isAuditedOriginal: false,
      stockQuantity: Number(newProduct.stockQuantity) || 15,
      status: 'published',
      isPlaceholderPhoto: false,
    };

    const updated = [fullProduct, ...localProducts];
    setLocalProducts(updated);
    onUpdateProducts(updated);
    setIsAddingProduct(false);
    showNotification(`New piece "${fullProduct.name}" added to catalog!`);
  };

  // Orders Update Handlers
  const handleUpdateOrderStatus = (
    orderNumber: string,
    newStatus: SubmittedOrder['status'],
    paxiCode?: string,
    notes?: string
  ) => {
    updateOrderStatus(orderNumber, newStatus, notes, paxiCode);
    const refreshed = getLocalOrders();
    setSavedOrders(refreshed.length > 0 ? refreshed : DEMO_SAMPLE_ORDERS);
    showNotification(`Order #${orderNumber} updated to ${newStatus.replace(/_/g, ' ')}`);
  };

  const handleAdvanceOrderStatus = (order: SubmittedOrder) => {
    let nextStatus: SubmittedOrder['status'] = order.status;
    if (order.status === 'whatsapp_generated') nextStatus = 'pending_verification';
    else if (order.status === 'pending_verification') nextStatus = 'payment_confirmed';
    else if (order.status === 'payment_confirmed') nextStatus = 'dispatched_paxi';
    else if (order.status === 'dispatched_paxi') nextStatus = 'ready_for_collection';
    else if (order.status === 'ready_for_collection') nextStatus = 'completed';

    handleUpdateOrderStatus(order.orderNumber, nextStatus, order.paxiTrackingCode, order.statusNotes);
  };

  const handleSaveTrackingCode = (orderNumber: string) => {
    const order = savedOrders.find((o) => o.orderNumber === orderNumber);
    if (order) {
      handleUpdateOrderStatus(orderNumber, 'dispatched_paxi', trackingCodeInput.trim(), order.statusNotes);
      setEditingTrackingRef(null);
      setTrackingCodeInput('');
      showNotification(`PAXI bag code assigned for #${orderNumber}!`);
    }
  };

  const handleSaveNotes = (orderNumber: string) => {
    const order = savedOrders.find((o) => o.orderNumber === orderNumber);
    if (order) {
      handleUpdateOrderStatus(orderNumber, order.status, order.paxiTrackingCode, notesInput.trim());
      setEditingNotesRef(null);
      setNotesInput('');
      showNotification(`Notes saved for #${orderNumber}`);
    }
  };

  const handleCopyPackingSlip = (order: SubmittedOrder) => {
    const text = [
      `📦 LASS BRAND CLOTHES — PACKING SLIP`,
      `Order Ref: #${order.orderNumber}`,
      `Date: ${new Date(order.date).toLocaleDateString()}`,
      `Customer: ${order.customer.fullName} (${order.customer.phoneOrWhatsApp})`,
      order.customer.email ? `Email: ${order.customer.email}` : '',
      `PEP Counter: ${order.customer.pepStoreBranch || 'Gauteng Central'}`,
      `Delivery Method: ${order.customer.deliveryMethod.replace('-', ' ').toUpperCase()}`,
      `---------------------------------`,
      `GARMENTS TO PACK:`,
      ...order.items.map(
        (it, idx) => `${idx + 1}. ${it.quantity}x ${it.name} | Size: ${it.selectedSize} | Colour: ${it.selectedColour}`
      ),
      `---------------------------------`,
      `Subtotal: ${formatZAR(order.subtotal)}`,
      `Delivery: ${formatZAR(order.deliveryFee)}`,
      `Total: ${formatZAR(order.estimatedTotal)}`,
      order.customer.customerNote ? `Customer Note: ${order.customer.customerNote}` : '',
      order.paxiTrackingCode ? `PAXI Bag Code: ${order.paxiTrackingCode}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopiedSlipRef(order.orderNumber);
      showNotification(`Packing slip for #${order.orderNumber} copied to clipboard!`);
      setTimeout(() => setCopiedSlipRef(null), 2500);
    });
  };

  const handleWhatsAppCustomer = (order: SubmittedOrder) => {
    const cleanPhone = normalizeWhatsAppNumber(order.customer.phoneOrWhatsApp);
    const text = encodeURIComponent(
      `👋 Hi ${order.customer.fullName}, this is LASS Brand Clothes updating you on your order #${order.orderNumber}.\n\n` +
      `Current Status: ${order.status.replace(/_/g, ' ').toUpperCase()}\n` +
      `${order.paxiTrackingCode ? `PAXI Tracking Code: ${order.paxiTrackingCode}\n` : ''}` +
      `PEP Store: ${order.customer.pepStoreBranch || 'Designated Branch'}\n\n` +
      `Thank you for supporting authentic South African streetwear!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  // Add Manual Order (e.g. walk-in or offline WhatsApp customer)
  const handleCreateManualOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const product = localProducts.find((p) => p.id === newManualOrder.selectedPieceId) || localProducts[0];
    if (!product) return;

    const orderNumber = `LASS-${Math.floor(1000 + Math.random() * 9000)}`;
    const lineTotal = product.price * newManualOrder.quantity;
    const deliveryFee = newManualOrder.deliveryMethod === 'paxi-express' ? 100 : 60;

    const createdOrder: SubmittedOrder = {
      orderNumber,
      date: new Date().toISOString(),
      customer: {
        fullName: newManualOrder.customerName || 'Direct Customer',
        phoneOrWhatsApp: newManualOrder.phone || '066 441 2203',
        email: newManualOrder.email || undefined,
        deliveryMethod: newManualOrder.deliveryMethod,
        pepStoreBranch: newManualOrder.pepBranch || 'PEP Store Soweto Bara Mall',
        customerNote: newManualOrder.notes,
      },
      items: [
        {
          productId: product.id,
          name: product.name,
          selectedSize: newManualOrder.selectedSize,
          selectedColour: newManualOrder.selectedColour,
          unitPrice: product.price,
          quantity: newManualOrder.quantity,
          totalPrice: lineTotal,
        },
      ],
      subtotal: lineTotal,
      deliveryFee,
      estimatedTotal: lineTotal + deliveryFee,
      whatsappMessageText: `Manual Order #${orderNumber}`,
      whatsappUrl: `https://wa.me/27664412203`,
      status: 'payment_confirmed',
      statusNotes: newManualOrder.notes || 'Created manually by brand owner',
    };

    saveLocalOrder(createdOrder);
    const refreshed = getLocalOrders();
    setSavedOrders(refreshed);
    setIsAddingOrder(false);
    showNotification(`Manual order #${orderNumber} recorded successfully!`);

    // Reset form
    setNewManualOrder({
      customerName: '',
      phone: '',
      email: '',
      pepBranch: '',
      deliveryMethod: 'paxi-standard',
      selectedPieceId: products[0]?.id || '',
      selectedSize: 'L',
      selectedColour: 'Classic Black',
      quantity: 1,
      notes: '',
    });
  };

  const handleSeedDemoOrders = () => {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(DEMO_SAMPLE_ORDERS));
    setSavedOrders(DEMO_SAMPLE_ORDERS);
    showNotification('Loaded prototype sample orders into localStorage!');
  };

  // Delete a single order from localStorage
  const handleDeleteOrder = (orderNumber: string) => {
    const success = deleteLocalOrder(orderNumber);
    if (success) {
      const refreshed = getLocalOrders();
      setSavedOrders(refreshed);
      setSelectedOrderNumbers((prev) => prev.filter((id) => id !== orderNumber));
      setOrderToDelete(null);
      showNotification(`Order #${orderNumber} deleted from localStorage.`);
    } else {
      showNotification(`Could not delete order #${orderNumber}.`);
    }
  };

  // Bulk delete selected orders from localStorage
  const handleDeleteSelectedOrders = () => {
    if (selectedOrderNumbers.length === 0) return;
    deleteMultipleLocalOrders(selectedOrderNumbers);
    const refreshed = getLocalOrders();
    setSavedOrders(refreshed);
    showNotification(`Deleted ${selectedOrderNumbers.length} orders from localStorage.`);
    setSelectedOrderNumbers([]);
  };

  // Clear all orders from localStorage
  const handleClearAllOrders = () => {
    clearLocalOrders();
    setSavedOrders([]);
    setSelectedOrderNumbers([]);
    setIsConfirmingClearAll(false);
    showNotification('All order history cleared from localStorage.');
  };

  // Re-read directly from localStorage
  const handleRefreshFromLocalStorage = () => {
    const orders = getLocalOrders();
    setSavedOrders(orders);
    showNotification(`Refreshed order history from localStorage (${orders.length} orders).`);
  };

  // Export JSON backup of full order history
  const handleExportOrdersJSON = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedOrders, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `lass-orders-localStorage-backup-${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showNotification('Exported full order history JSON backup!');
    } catch {
      showNotification('Error exporting JSON backup.');
    }
  };

  // Toggle single order selection
  const handleToggleSelectOrder = (orderNumber: string) => {
    setSelectedOrderNumbers((prev) =>
      prev.includes(orderNumber) ? prev.filter((id) => id !== orderNumber) : [...prev, orderNumber]
    );
  };

  // Export Orders CSV
  const handleExportOrdersCSV = () => {
    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Phone',
      'Email',
      'Delivery Method',
      'PEP Branch',
      'Status',
      'PAXI Code',
      'Total ZAR',
    ];
    const rows = savedOrders.map((o) => [
      o.orderNumber,
      o.date,
      `"${o.customer.fullName.replace(/"/g, '""')}"`,
      o.customer.phoneOrWhatsApp,
      o.customer.email || '',
      o.customer.deliveryMethod,
      `"${(o.customer.pepStoreBranch || '').replace(/"/g, '""')}"`,
      o.status,
      o.paxiTrackingCode || '',
      o.estimatedTotal,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lass-orders-${Date.now()}.csv`;
    a.click();
    showNotification('Exported orders to CSV!');
  };

  // Export Inventory CSV
  const handleExportInventoryCSV = () => {
    const headers = ['ID', 'Name', 'SKU', 'Category', 'Price ZAR', 'Stock Quantity', 'Status', 'Print Type'];
    const rows = localProducts.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      p.category,
      p.price,
      p.stockQuantity,
      p.status,
      p.printType || '',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lass-inventory-${Date.now()}.csv`;
    a.click();
    showNotification('Exported inventory to CSV!');
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return savedOrders.filter((ord) => {
      if (orderStatusFilter !== 'all') {
        if (
          orderStatusFilter === 'action_needed' &&
          ord.status !== 'whatsapp_generated' &&
          ord.status !== 'pending_verification'
        ) {
          return false;
        } else if (orderStatusFilter !== 'action_needed' && ord.status !== orderStatusFilter) {
          return false;
        }
      }
      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase().trim();
        const matchRef = ord.orderNumber.toLowerCase().includes(q);
        const matchName = ord.customer.fullName.toLowerCase().includes(q);
        const matchPhone = ord.customer.phoneOrWhatsApp.toLowerCase().includes(q);
        const matchPep = ord.customer.pepStoreBranch?.toLowerCase().includes(q);
        const matchEmail = ord.customer.email?.toLowerCase().includes(q);
        if (!matchRef && !matchName && !matchPhone && !matchPep && !matchEmail) return false;
      }
      return true;
    });
  }, [savedOrders, orderStatusFilter, orderSearchQuery]);

  // Filtered Inventory
  const filteredInventory = useMemo(() => {
    return localProducts.filter((p) => {
      if (inventoryCategoryFilter !== 'all' && p.category !== inventoryCategoryFilter) {
        return false;
      }
      if (inventoryStockFilter === 'low' && (p.stockQuantity > 5 || p.stockQuantity === 0)) {
        return false;
      }
      if (inventoryStockFilter === 'out' && p.stockQuantity > 0) {
        return false;
      }
      if (inventorySearchQuery.trim()) {
        const q = inventorySearchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        const matchPrint = p.printType?.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchPrint) return false;
      }
      return true;
    });
  }, [localProducts, inventoryCategoryFilter, inventoryStockFilter, inventorySearchQuery]);

  // Metrics
  const metrics = useMemo(() => {
    const totalRev = savedOrders.reduce((sum, o) => sum + o.estimatedTotal, 0);
    const pendingOrders = savedOrders.filter(
      (o) => o.status === 'whatsapp_generated' || o.status === 'pending_verification'
    ).length;
    const paidOrders = savedOrders.filter((o) => o.status === 'payment_confirmed').length;
    const dispatchedOrders = savedOrders.filter(
      (o) => o.status === 'dispatched_paxi' || o.status === 'ready_for_collection'
    ).length;
    const completedOrders = savedOrders.filter((o) => o.status === 'completed').length;
    const lowStockItems = localProducts.filter((p) => p.stockQuantity <= 5 && p.stockQuantity > 0).length;
    const outOfStockItems = localProducts.filter((p) => p.stockQuantity === 0).length;
    const totalUnitsInStock = localProducts.reduce((sum, p) => sum + p.stockQuantity, 0);

    return {
      totalOrders: savedOrders.length,
      totalRev,
      pendingOrders,
      paidOrders,
      dispatchedOrders,
      completedOrders,
      lowStockItems,
      outOfStockItems,
      totalUnitsInStock,
      totalProducts: localProducts.length,
    };
  }, [savedOrders, localProducts]);

  const isAllFilteredSelected =
    filteredOrders.length > 0 && filteredOrders.every((o) => selectedOrderNumbers.includes(o.orderNumber));

  const handleToggleSelectAllFiltered = () => {
    const filteredNumbers = filteredOrders.map((o) => o.orderNumber);
    if (isAllFilteredSelected) {
      setSelectedOrderNumbers((prev) => prev.filter((id) => !filteredNumbers.includes(id)));
    } else {
      setSelectedOrderNumbers((prev) => Array.from(new Set([...prev, ...filteredNumbers])));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl h-[92vh] max-h-[860px] bg-zinc-950 border border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER: Green, White, Blue, Orange and Black Brand Theme */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-zinc-800 bg-gradient-to-r from-emerald-950/90 via-zinc-950 to-blue-950/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black border-2 border-emerald-500 flex items-center justify-center text-emerald-400 font-display font-black text-xl shadow-lg shadow-emerald-950/60">
              L
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-lg sm:text-xl text-white tracking-wide">
                  Brand Owner Command Center
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500 text-white shadow-sm">
                  Active
                </span>
              </div>
              <p className="text-xs text-emerald-300 font-medium">
                LASS Brand Clothes • Orders Hub, Real-Time Inventory &amp; PAXI Fulfilment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLockPortal}
                className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                title="Lock portal (requires confidential PIN to unlock)"
              >
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Lock Portal</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
              title="Close and return to store"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security PIN Screen (Protected: unlocked only with owner PIN, completely masked & confidential) */}
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-6 text-center bg-zinc-950">
            <div className="max-w-md w-full space-y-6 p-8 sm:p-9 bg-zinc-900/95 border border-zinc-800/90 rounded-3xl shadow-2xl backdrop-blur-xl">
              <div className="w-16 h-16 rounded-2xl bg-black border-2 border-emerald-500/80 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-950/60">
                <Shield className="w-8 h-8 text-emerald-400" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-800 text-emerald-400 border border-emerald-500/30 inline-block shadow-sm">
                  Restricted Access • Brand Owner Only
                </span>
                <h3 className="text-xl sm:text-2xl font-black font-display text-white">
                  Owner Security Verification
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                  Enter your confidential security PIN to access orders, stock management, and brand controls.
                </p>
              </div>

              <form onSubmit={handlePinSubmit} className="space-y-4 pt-1">
                <div className="relative flex items-center">
                  <input
                    type="password"
                    maxLength={10}
                    placeholder="••••"
                    value={adminPin}
                    onChange={(e) => {
                      setAdminPin(e.target.value);
                      if (pinError) setPinError(false);
                    }}
                    className="w-full bg-black border-2 border-zinc-700 focus:border-emerald-500 rounded-2xl px-6 py-3.5 text-center text-3xl tracking-widest text-white focus:outline-none font-mono shadow-inner transition-colors placeholder:text-zinc-700"
                    autoFocus
                    autoComplete="off"
                  />
                </div>

                {pinError && (
                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Access Denied: Incorrect security PIN.</span>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/60 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Unlock Command Center</span>
                  </button>
                </div>
              </form>

              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
                <span className="font-semibold text-zinc-400">LASS Brand Clothes</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-zinc-400 hover:text-white underline font-medium"
                >
                  Return to Storefront
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Active Command Center Body */
          <>
            {/* SEGMENTED CONTROL NAVIGATION BAR & WORKFLOW CONTROLS */}
            <div className="shrink-0 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md px-3 sm:px-6 py-2.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Segmented Control Navigation Bar */}
                <nav
                  role="tablist"
                  aria-label="Admin command center views"
                  className="w-full sm:w-auto p-1 rounded-2xl bg-zinc-900/90 border border-zinc-800/90 shadow-inner grid grid-cols-3 sm:inline-flex items-center gap-1 select-none"
                >
                  {/* Segment 1: Order History */}
                  <button
                    role="tab"
                    id="tab-orders"
                    aria-selected={activeTab === 'orders'}
                    aria-controls="tabpanel-orders"
                    onClick={() => setActiveTab('orders')}
                    className={`px-2.5 sm:px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 ${
                      activeTab === 'orders'
                        ? 'bg-zinc-800 text-orange-400 shadow-md border border-orange-500/40 ring-1 ring-orange-500/20'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40 border border-transparent'
                    }`}
                  >
                    <ClipboardList className={`w-4 h-4 shrink-0 ${activeTab === 'orders' ? 'text-orange-400' : 'text-zinc-400'}`} />
                    <span className="truncate">Order History</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                      activeTab === 'orders'
                        ? 'bg-orange-500/25 text-orange-300 border border-orange-500/40'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700/60'
                    }`}>
                      {savedOrders.length}
                    </span>
                  </button>

                  {/* Segment 2: Inventory Management */}
                  <button
                    role="tab"
                    id="tab-inventory"
                    aria-selected={activeTab === 'inventory'}
                    aria-controls="tabpanel-inventory"
                    onClick={() => setActiveTab('inventory')}
                    className={`px-2.5 sm:px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 ${
                      activeTab === 'inventory'
                        ? 'bg-zinc-800 text-blue-400 shadow-md border border-blue-500/40 ring-1 ring-blue-500/20'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40 border border-transparent'
                    }`}
                  >
                    <Boxes className={`w-4 h-4 shrink-0 ${activeTab === 'inventory' ? 'text-blue-400' : 'text-zinc-400'}`} />
                    <span className="truncate">Inventory Management</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                      activeTab === 'inventory'
                        ? 'bg-blue-500/25 text-blue-300 border border-blue-500/40'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700/60'
                    }`}>
                      {localProducts.length}
                    </span>
                    {metrics.lowStockItems > 0 && (
                      <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full text-[9px] font-black bg-orange-500 text-white animate-pulse shrink-0">
                        {metrics.lowStockItems} low
                      </span>
                    )}
                  </button>

                  {/* Segment 3: Site Configuration */}
                  <button
                    role="tab"
                    id="tab-config"
                    aria-selected={activeTab === 'config'}
                    aria-controls="tabpanel-config"
                    onClick={() => setActiveTab('config')}
                    className={`px-2.5 sm:px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 ${
                      activeTab === 'config'
                        ? 'bg-zinc-800 text-emerald-400 shadow-md border border-emerald-500/40 ring-1 ring-emerald-500/20'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40 border border-transparent'
                    }`}
                  >
                    <Sliders className={`w-4 h-4 shrink-0 ${activeTab === 'config' ? 'text-emerald-400' : 'text-zinc-400'}`} />
                    <span className="truncate">Site Configuration</span>
                  </button>
                </nav>

                {/* Workflow Actions Toolbar */}
                <div className="flex items-center justify-end gap-2 pt-1 sm:pt-0">
                  <button
                    onClick={() => setIsAddingOrder(true)}
                    className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-xs flex items-center gap-1 shadow-md shadow-orange-500/20 whitespace-nowrap active:scale-95 transition-transform"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Manual Order</span>
                  </button>
                  <button
                    onClick={() => setIsAddingProduct(true)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-1 shadow-md shadow-blue-600/20 whitespace-nowrap active:scale-95 transition-transform"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ New Piece</span>
                  </button>
                  <button
                    onClick={handleLockPortal}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-rose-950/80 border border-zinc-700 hover:border-rose-500/50 text-zinc-300 hover:text-rose-300 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap active:scale-95"
                    title="Lock admin portal (requires owner security PIN)"
                  >
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                    <span>Lock</span>
                  </button>
                </div>
              </div>
            </div>

            {/* In-app Notification Alert Toast */}
            {notificationMsg && (
              <div className="shrink-0 bg-emerald-950 border-b border-emerald-500/40 px-5 py-2 text-xs text-emerald-300 font-bold flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{notificationMsg}</span>
              </div>
            )}

            {/* SCROLLABLE MAIN CONTENT VIEW */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs text-zinc-300 bg-zinc-950">
              {/* TAB 1: ORDERS & FULFILMENT */}
              {activeTab === 'orders' && (
                <div id="tabpanel-orders" role="tabpanel" aria-labelledby="tab-orders" className="space-y-4">
                  {/* Top Order KPIs Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total Orders</span>
                      <span className="font-display font-black text-xl text-white">{metrics.totalOrders}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-900 border border-orange-500/40">
                      <span className="text-[10px] uppercase font-bold text-orange-400 block">Needs Action</span>
                      <span className="font-display font-black text-xl text-orange-400">{metrics.pendingOrders}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-900 border border-emerald-500/40">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block">Payment Confirmed</span>
                      <span className="font-display font-black text-xl text-emerald-400">{metrics.paidOrders}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-900 border border-blue-500/40">
                      <span className="text-[10px] uppercase font-bold text-blue-400 block">In Transit (PAXI)</span>
                      <span className="font-display font-black text-xl text-blue-400">{metrics.dispatchedOrders}</span>
                    </div>

                    <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-zinc-900 border border-emerald-600/40">
                      <span className="text-[10px] uppercase font-bold text-emerald-300 block">Gross Value</span>
                      <span className="font-display font-black text-xl text-emerald-400">
                        {formatZAR(metrics.totalRev)}
                      </span>
                    </div>
                  </div>

                  {/* STORED ORDER HISTORY (localStorage) CONTROL PANEL */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-emerald-950/40 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-black border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-sm">Stored Order History</h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            localStorage Active
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Target Key: <code className="text-zinc-300 font-mono bg-black/60 px-1 py-0.5 rounded">{ORDERS_STORAGE_KEY}</code> •{' '}
                          <strong className="text-white">{savedOrders.length} records</strong> in browser storage • Real-time checkout sync
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleRefreshFromLocalStorage}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
                        title="Re-read orders from localStorage"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                        <span>Sync Storage</span>
                      </button>

                      <button
                        onClick={handleExportOrdersJSON}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
                        title="Backup entire order history as JSON"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Backup JSON</span>
                      </button>

                      <button
                        onClick={handleExportOrdersCSV}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
                        title="Export orders to CSV"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Export CSV</span>
                      </button>

                      <button
                        onClick={handleSeedDemoOrders}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-zinc-800"
                        title="Load prototype sample orders"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
                        <span>Demo Orders</span>
                      </button>

                      {savedOrders.length > 0 && (
                        <button
                          onClick={() => setIsConfirmingClearAll(true)}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                          title="Clear all stored orders from localStorage"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Clear History</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bulk Selection Management Bar */}
                  {selectedOrderNumbers.length > 0 && (
                    <div className="p-3 rounded-2xl bg-orange-950/80 border border-orange-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in">
                      <div className="flex items-center gap-2 text-xs font-bold text-orange-200">
                        <CheckSquare className="w-4 h-4 text-orange-400" />
                        <span>
                          {selectedOrderNumbers.length} of {savedOrders.length} order entries selected for management
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleToggleSelectAllFiltered}
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-xl text-xs font-bold"
                        >
                          {isAllFilteredSelected ? 'Deselect Filtered' : 'Select All Filtered'}
                        </button>

                        <button
                          onClick={() => setSelectedOrderNumbers([])}
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs"
                        >
                          Cancel Selection
                        </button>

                        <button
                          onClick={handleDeleteSelectedOrders}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md shadow-rose-950"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Selected ({selectedOrderNumbers.length})</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Search, Filter & Action Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2 flex-1">
                      {filteredOrders.length > 0 && (
                        <button
                          type="button"
                          onClick={handleToggleSelectAllFiltered}
                          className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-xs flex items-center gap-1.5 shrink-0"
                          title={isAllFilteredSelected ? 'Deselect all filtered orders' : 'Select all filtered orders for deletion'}
                        >
                          {isAllFilteredSelected ? (
                            <CheckSquare className="w-4 h-4 text-orange-400" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-500" />
                          )}
                          <span className="hidden sm:inline">{isAllFilteredSelected ? 'Deselect All' : 'Select All'}</span>
                        </button>
                      )}

                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search stored orders by Order #, Customer Name, Phone, Email or PEP Branch..."
                          value={orderSearchQuery}
                          onChange={(e) => setOrderSearchQuery(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                        />
                        {orderSearchQuery && (
                          <button
                            onClick={() => setOrderSearchQuery('')}
                            className="absolute right-3 top-2.5 text-zinc-500 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Filter Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {[
                      { id: 'all', label: `All Orders (${savedOrders.length})` },
                      { id: 'action_needed', label: `Action Needed (${metrics.pendingOrders})` },
                      { id: 'payment_confirmed', label: `Paid (${metrics.paidOrders})` },
                      { id: 'dispatched_paxi', label: `Dispatched (${metrics.dispatchedOrders})` },
                      { id: 'completed', label: `Completed (${metrics.completedOrders})` },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setOrderStatusFilter(st.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                          orderStatusFilter === st.id
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {/* Orders List */}
                  {filteredOrders.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                      <ClipboardList className="w-10 h-10 text-zinc-600 mx-auto" />
                      <div>
                        <h4 className="font-bold text-white text-sm">No orders matching filter</h4>
                        <p className="text-zinc-500 text-xs mt-1">
                          Try resetting your filters or creating a new manual customer order.
                        </p>
                      </div>
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setOrderStatusFilter('all');
                            setOrderSearchQuery('');
                          }}
                          className="px-4 py-2 bg-zinc-800 text-white font-bold rounded-xl text-xs"
                        >
                          Reset Filters
                        </button>
                        <button
                          onClick={() => setIsAddingOrder(true)}
                          className="px-4 py-2 bg-orange-500 text-white font-bold rounded-xl text-xs"
                        >
                          + Record Manual Order
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredOrders.map((ord) => (
                        <div
                          key={ord.orderNumber}
                          className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 shadow-sm hover:border-zinc-700 transition-colors"
                        >
                          {/* Order Header with Checkbox and Status Management */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-zinc-800 pb-3">
                            <div className="flex flex-wrap items-center gap-2.5">
                              {/* Multi-select checkbox */}
                              <button
                                type="button"
                                onClick={() => handleToggleSelectOrder(ord.orderNumber)}
                                className="p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                                title={
                                  selectedOrderNumbers.includes(ord.orderNumber)
                                    ? 'Deselect order'
                                    : 'Select order for deletion'
                                }
                              >
                                {selectedOrderNumbers.includes(ord.orderNumber) ? (
                                  <CheckSquare className="w-4 h-4 text-orange-400" />
                                ) : (
                                  <Square className="w-4 h-4 text-zinc-500" />
                                )}
                              </button>

                              <span className="font-mono font-black text-sm text-orange-400">
                                #{ord.orderNumber}
                              </span>

                              {/* Interactive Status Selector */}
                              <select
                                value={ord.status}
                                onChange={(e) =>
                                  handleUpdateOrderStatus(
                                    ord.orderNumber,
                                    e.target.value as SubmittedOrder['status'],
                                    ord.paxiTrackingCode,
                                    ord.statusNotes
                                  )
                                }
                                className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-black border cursor-pointer focus:outline-none ${
                                  ord.status === 'dispatched_paxi' || ord.status === 'ready_for_collection'
                                    ? 'bg-blue-950/80 text-blue-400 border-blue-500/50'
                                    : ord.status === 'payment_confirmed'
                                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50'
                                    : ord.status === 'completed'
                                    ? 'bg-zinc-900 text-zinc-300 border-zinc-700'
                                    : 'bg-orange-950/80 text-orange-400 border-orange-500/50'
                                }`}
                                title="Change order status in localStorage"
                              >
                                <option value="whatsapp_generated">WhatsApp Generated</option>
                                <option value="pending_verification">Pending Verification</option>
                                <option value="payment_confirmed">Payment Confirmed</option>
                                <option value="dispatched_paxi">Dispatched (PAXI)</option>
                                <option value="ready_for_collection">Ready for Collection</option>
                                <option value="completed">Completed</option>
                              </select>

                              {ord.paymentStatus === 'paid' && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                                  <span>💳</span>
                                  <span>Paid in App ({ord.paymentMethod?.toUpperCase() || 'ONLINE'})</span>
                                </span>
                              )}

                              <span className="text-[11px] text-zinc-500">
                                {new Date(ord.date).toLocaleDateString()}
                              </span>
                              {ord.transactionId && (
                                <span className="text-[10px] font-mono text-zinc-400">
                                  TXN: {ord.transactionId}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-zinc-400 text-xs">Total:</span>
                              <span className="font-mono font-black text-base text-white">
                                {formatZAR(ord.estimatedTotal)}
                              </span>
                            </div>
                          </div>

                          {/* Customer & Destination 3-Column Info */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-black/60 p-3.5 rounded-xl border border-zinc-800">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">
                                Customer Details
                              </span>
                              <span className="text-white font-bold block">{ord.customer.fullName}</span>
                              <span className="text-zinc-400 font-mono block text-[11px]">
                                {ord.customer.phoneOrWhatsApp}
                              </span>
                              {ord.customer.email && (
                                <span className="text-zinc-500 block text-[11px] truncate">{ord.customer.email}</span>
                              )}
                            </div>

                            <div>
                              <span className="text-[10px] uppercase font-bold text-blue-400 block mb-0.5">
                                PAXI / Delivery Counter
                              </span>
                              <span className="text-white font-bold block">
                                {ord.customer.pepStoreBranch || 'Gauteng Dropoff'}
                              </span>
                              <span className="text-zinc-400 block text-[11px]">
                                Method: {ord.customer.deliveryMethod.replace('-', ' ').toUpperCase()} (Fee:{' '}
                                {formatZAR(ord.deliveryFee)})
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] uppercase font-bold text-orange-400 block mb-0.5">
                                Ordered Pieces
                              </span>
                              <div className="space-y-1">
                                {ord.items.map((it, idx) => (
                                  <div key={idx} className="text-zinc-300 font-medium text-[11px]">
                                    <strong className="text-white">{it.quantity}x</strong> {it.name} • {it.selectedSize} ({it.selectedColour})
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* PAXI Tracking Code Bar & Quick Actions */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                            {/* Tracking code field */}
                            <div className="flex items-center gap-2">
                              {editingTrackingRef === ord.orderNumber ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    placeholder="PAXI Bag Code (e.g. P1234567)"
                                    value={trackingCodeInput}
                                    onChange={(e) => setTrackingCodeInput(e.target.value)}
                                    className="bg-black border border-blue-500 rounded-lg px-2.5 py-1 text-xs text-white"
                                  />
                                  <button
                                    onClick={() => handleSaveTrackingCode(ord.orderNumber)}
                                    className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingTrackingRef(null)}
                                    className="px-2 py-1 text-zinc-400 hover:text-white text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <Truck className="w-3.5 h-3.5 text-blue-400" />
                                  <span className="text-zinc-400 text-xs">PAXI Tracking:</span>
                                  {ord.paxiTrackingCode ? (
                                    <span className="font-mono font-bold text-white bg-blue-950/80 border border-blue-500/50 px-2 py-0.5 rounded text-xs">
                                      {ord.paxiTrackingCode}
                                    </span>
                                  ) : (
                                    <span className="text-zinc-500 italic text-[11px]">No bag assigned</span>
                                  )}
                                  <button
                                    onClick={() => {
                                      setEditingTrackingRef(ord.orderNumber);
                                      setTrackingCodeInput(ord.paxiTrackingCode || '');
                                    }}
                                    className="text-blue-400 hover:underline text-[11px] font-bold ml-1"
                                  >
                                    {ord.paxiTrackingCode ? 'Edit Code' : '+ Add Code'}
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => handleCopyPackingSlip(ord)}
                                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs flex items-center gap-1"
                                title="Copy packing slip for PEP counter"
                              >
                                {copiedSlipRef === ord.orderNumber ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Packing Slip</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => handleWhatsAppCustomer(ord)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                                title="Direct WhatsApp notification to customer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>WhatsApp Customer</span>
                              </button>

                              <button
                                onClick={() => handleAdvanceOrderStatus(ord)}
                                className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-white font-black text-xs flex items-center gap-1 shadow-md shadow-orange-500/20"
                                title="Advance order status"
                              >
                                <span>Advance Status</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setOrderToDelete(ord)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-white font-bold text-xs flex items-center gap-1 transition-colors shadow-sm"
                                title="Delete this order entry from localStorage"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                <span>Delete Entry</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: INVENTORY & STOCK MANAGEMENT */}
              {activeTab === 'inventory' && (
                <div id="tabpanel-inventory" role="tabpanel" aria-labelledby="tab-inventory" className="space-y-4">
                  {/* Stock Metrics Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Catalog Pieces</span>
                      <span className="font-display font-black text-xl text-white">{localProducts.length}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-900 border border-blue-500/40">
                      <span className="text-[10px] uppercase font-bold text-blue-400 block">Total Units In Stock</span>
                      <span className="font-display font-black text-xl text-blue-400">{metrics.totalUnitsInStock}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-900 border border-orange-500/40">
                      <span className="text-[10px] uppercase font-bold text-orange-400 block">Low Stock (≤ 5 units)</span>
                      <span className={`font-display font-black text-xl ${metrics.lowStockItems > 0 ? 'text-orange-400' : 'text-white'}`}>
                        {metrics.lowStockItems}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-900 border border-rose-500/40">
                      <span className="text-[10px] uppercase font-bold text-rose-400 block">Out of Stock (0)</span>
                      <span className={`font-display font-black text-xl ${metrics.outOfStockItems > 0 ? 'text-rose-400' : 'text-white'}`}>
                        {metrics.outOfStockItems}
                      </span>
                    </div>
                  </div>

                  {/* Low Stock Notice Banner */}
                  {metrics.lowStockItems > 0 && (
                    <div className="p-3.5 rounded-2xl bg-orange-950/40 border border-orange-500/40 flex items-center justify-between gap-3 text-orange-200">
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0" />
                        <div>
                          <strong className="text-white block font-bold text-xs">
                            Inventory Notice: {metrics.lowStockItems} garment(s) have 5 or fewer units left.
                          </strong>
                          <span className="text-[11px] text-orange-200/90">
                            Use the quick inline steppers below to add restocked units after screen-printing runs.
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={handleRestockAll}
                        className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-xs shrink-0 shadow-sm"
                      >
                        +10 All Pieces
                      </button>
                    </div>
                  )}

                  {/* Inventory Search & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search garments by name, SKU or print placement..."
                        value={inventorySearchQuery}
                        onChange={(e) => setInventorySearchQuery(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleExportInventoryCSV}
                        className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs flex items-center gap-1.5"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                        <span>Export CSV</span>
                      </button>

                      <button
                        onClick={() => setIsAddingProduct(true)}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New Piece</span>
                      </button>
                    </div>
                  </div>

                  {/* Stock Quick Filters */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {[
                      { id: 'all', label: 'All Garments' },
                      { id: 'low', label: `Needs Restock (≤ 5)` },
                      { id: 'out', label: `Out of Stock (${metrics.outOfStockItems})` },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setInventoryStockFilter(st.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                          inventoryStockFilter === st.id
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {/* Garment Inventory Rows */}
                  <div className="space-y-2.5">
                    {filteredInventory.map((product) => {
                      const isLowStock = product.stockQuantity <= 5 && product.stockQuantity > 0;
                      const isOutOfStock = product.stockQuantity === 0;

                      return (
                        <div
                          key={product.id}
                          className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-zinc-700 transition-colors shadow-sm"
                        >
                          {/* Garment Preview */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-14 h-16 rounded-xl object-cover bg-black shrink-0 border border-zinc-800"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-white text-sm truncate">{product.name}</h4>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                                    product.status === 'published'
                                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-zinc-800 text-zinc-400'
                                  }`}
                                >
                                  {product.status}
                                </span>
                              </div>
                              <span className="text-zinc-500 font-mono text-[11px] block">
                                SKU: {product.sku} • {product.printType || 'Screen Print'}
                              </span>
                              <span className="text-zinc-400 text-[11px] block">
                                Sizes: {product.availableSizes.join(', ')}
                              </span>
                            </div>
                          </div>

                          {/* Quick Price Adjuster */}
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400 text-xs">Price:</span>
                            <div className="flex items-center bg-black border border-zinc-800 rounded-xl px-2.5 py-1">
                              <span className="text-zinc-500 text-xs font-mono mr-1">R</span>
                              <input
                                type="number"
                                value={product.price}
                                onChange={(e) => handleUpdateProductPrice(product.id, Number(e.target.value))}
                                className="w-16 bg-transparent text-white font-bold text-xs focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Quick Stock Stepper */}
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400 text-xs hidden sm:inline">Units:</span>
                            <div className="flex items-center gap-1 bg-black border border-zinc-800 rounded-xl p-1">
                              <button
                                onClick={() => handleAdjustStockDelta(product.id, -5)}
                                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-xs font-bold"
                                title="Deduct 5 units"
                              >
                                -5
                              </button>
                              <button
                                onClick={() => handleAdjustStockDelta(product.id, -1)}
                                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-xs font-bold"
                                title="Deduct 1 unit"
                              >
                                -1
                              </button>

                              <input
                                type="number"
                                value={product.stockQuantity}
                                onChange={(e) => handleUpdateProductStock(product.id, Number(e.target.value))}
                                className={`w-12 text-center font-mono font-black text-xs bg-transparent focus:outline-none ${
                                  isOutOfStock
                                    ? 'text-rose-400'
                                    : isLowStock
                                    ? 'text-orange-400'
                                    : 'text-emerald-400'
                                }`}
                              />

                              <button
                                onClick={() => handleAdjustStockDelta(product.id, 1)}
                                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-xs font-bold"
                                title="Add 1 unit"
                              >
                                +1
                              </button>
                              <button
                                onClick={() => handleAdjustStockDelta(product.id, 5)}
                                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-xs font-bold"
                                title="Add 5 units"
                              >
                                +5
                              </button>
                            </div>

                            {/* Status Indicator Badge */}
                            <span
                              className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase whitespace-nowrap ${
                                isOutOfStock
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : isLowStock
                                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                            </span>
                          </div>

                          {/* Visibility and Remove Actions */}
                          <div className="flex items-center gap-1.5 self-end md:self-auto">
                            <button
                              onClick={() => handleToggleProductStatus(product.id)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                                product.status === 'published'
                                  ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
                                  : 'bg-emerald-600 text-white border-emerald-500'
                              }`}
                              title="Toggle public store visibility"
                            >
                              {product.status === 'published' ? 'Live in Shop' : 'Hidden (Draft)'}
                            </button>

                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg transition-colors"
                              title="Delete piece"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: SITE CONFIGURATION */}
              {activeTab === 'config' && (
                <div id="tabpanel-config" role="tabpanel" aria-labelledby="tab-config" className="space-y-6 max-w-4xl">
                  {/* Executive Performance Snapshot */}
                  <div>
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>Executive Overview &amp; Store Performance</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-2xl bg-zinc-900 border border-emerald-500/40 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                          Orders Value
                        </span>
                        <span className="font-display font-black text-xl text-emerald-400">
                          {formatZAR(metrics.totalRev)}
                        </span>
                        <span className="text-[10px] text-zinc-500 block">Gross revenue arranged</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-zinc-900 border border-orange-500/40 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-orange-400 block tracking-wider">
                          Needs Action
                        </span>
                        <span className={`font-display font-black text-xl ${metrics.pendingOrders > 0 ? 'text-orange-400' : 'text-white'}`}>
                          {metrics.pendingOrders}
                        </span>
                        <span className="text-[10px] text-zinc-500 block">Pending verification</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-zinc-900 border border-blue-500/40 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-blue-400 block tracking-wider">
                          In Transit PAXI
                        </span>
                        <span className="font-display font-black text-xl text-blue-400">
                          {metrics.dispatchedOrders}
                        </span>
                        <span className="text-[10px] text-zinc-500 block">Deliveries en route</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-white block tracking-wider">
                          Stock Health
                        </span>
                        <span className="font-display font-black text-xl text-white">
                          {metrics.totalUnitsInStock} <span className="text-xs text-zinc-400 font-normal">units</span>
                        </span>
                        <span className="text-[10px] text-zinc-500 block">
                          Across {metrics.totalProducts} pieces
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Brand Owner Security Interface Card */}
                  <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <Lock className="w-4 h-4 text-emerald-400" />
                          <span>Brand Owner Security &amp; Access Control</span>
                        </h4>
                        <p className="text-zinc-400 text-xs mt-0.5">
                          Protects the admin portal and order history with your confidential PIN.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5">
                          <Shield className="w-3 h-3 text-emerald-400" />
                          <span>PIN Protection Active</span>
                        </span>
                        <button
                          onClick={handleLockPortal}
                          className="px-3 py-1 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-white font-bold text-[11px] transition-colors flex items-center gap-1"
                        >
                          <Lock className="w-3 h-3 text-rose-400" />
                          <span>Lock Now</span>
                        </button>
                      </div>
                    </div>

                    {/* Change PIN Form */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-300 font-semibold">Change Custom Security PIN</span>
                        <span className="text-[11px] text-zinc-500 font-medium">Confidential PIN</span>
                      </div>

                      <form onSubmit={handleChangePin} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] text-zinc-400 block mb-1">New Secret PIN</label>
                            <input
                              type="password"
                              placeholder="••••"
                              value={newPinInput}
                              onChange={(e) => {
                                setNewPinInput(e.target.value);
                                if (pinChangeError) setPinChangeError('');
                              }}
                              className="w-full bg-black border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none font-mono tracking-widest"
                              maxLength={10}
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-zinc-400 block mb-1">Confirm Secret PIN</label>
                            <input
                              type="password"
                              placeholder="••••"
                              value={confirmPinInput}
                              onChange={(e) => {
                                setConfirmPinInput(e.target.value);
                                if (pinChangeError) setPinChangeError('');
                              }}
                              className="w-full bg-black border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none font-mono tracking-widest"
                              maxLength={10}
                            />
                          </div>
                        </div>

                        {pinChangeError && (
                          <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs font-semibold flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>{pinChangeError}</span>
                          </div>
                        )}

                        {pinChangeSuccess && (
                          <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Security PIN updated successfully!</span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="submit"
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>Save Security PIN</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleResetPinToDefault}
                            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs rounded-xl transition-colors"
                            title="Restore default PIN"
                          >
                            Restore Default PIN
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Brand Contact & PAXI Delivery Settings */}
                  <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2 border-b border-zinc-800 pb-3">
                      <Phone className="w-4 h-4 text-orange-400" />
                      <span>Brand Contact &amp; PAXI Delivery Settings</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Owner WhatsApp (Order Routing)</label>
                        <input
                          type="text"
                          value={configForm.ownerWhatsApp}
                          onChange={(e) => setConfigForm({ ...configForm, ownerWhatsApp: e.target.value })}
                          className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Display Call Number</label>
                        <input
                          type="text"
                          value={configForm.displayWhatsApp}
                          onChange={(e) => setConfigForm({ ...configForm, displayWhatsApp: e.target.value })}
                          className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">PAXI Standard Fee (ZAR)</label>
                        <input
                          type="number"
                          value={configForm.paxiStandardFee}
                          onChange={(e) => setConfigForm({ ...configForm, paxiStandardFee: Number(e.target.value) })}
                          className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">PAXI Express Fee (ZAR)</label>
                        <input
                          type="number"
                          value={configForm.paxiExpressFee}
                          onChange={(e) => setConfigForm({ ...configForm, paxiExpressFee: Number(e.target.value) })}
                          className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleSaveConfig}
                        className="px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Configuration</span>
                      </button>
                    </div>
                  </div>

                  {/* Official LASS App & APK Icon Assets */}
                  <div className="p-5 rounded-2xl bg-zinc-900 border border-emerald-500/40 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src="/icon-192.png"
                          alt="LASS App Icon"
                          className="w-10 h-10 rounded-xl bg-black border border-emerald-500 shadow-md object-contain"
                        />
                        <div>
                          <h4 className="font-display font-black text-white text-sm flex items-center gap-2">
                            <span>Official LASS App Icon (Android APK &amp; PWA)</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40">
                              Active in APK
                            </span>
                          </h4>
                          <p className="text-zinc-400 text-[11px]">
                            Brand Owner LASS Typographic Emblem &bull; HARVEST KE LASS &bull; Safe Zone Verified
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-black border border-zinc-800 flex items-center gap-3">
                        <img
                          src="/icon-512.png"
                          alt="512px APK Icon"
                          className="w-12 h-12 rounded-2xl border border-zinc-700 object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-white text-xs block">Standard APK Icon</span>
                          <span className="text-[10px] text-zinc-400 block font-mono">512 × 512 px</span>
                          <a
                            href="/icon-512.png"
                            download="lass-app-icon-512x512.png"
                            className="text-orange-400 hover:text-orange-300 text-[11px] font-bold flex items-center gap-1 mt-0.5"
                          >
                            <Download className="w-3 h-3" /> Download
                          </a>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-black border border-zinc-800 flex items-center gap-3">
                        <img
                          src="/icon-maskable-512.png"
                          alt="Adaptive Maskable Icon"
                          className="w-12 h-12 rounded-full border border-blue-500/60 object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-white text-xs block">Adaptive Maskable</span>
                          <span className="text-[10px] text-zinc-400 block font-mono">512 × 512 px Safe-Zone</span>
                          <a
                            href="/icon-maskable-512.png"
                            download="lass-app-icon-maskable-512x512.png"
                            className="text-blue-400 hover:text-blue-300 text-[11px] font-bold flex items-center gap-1 mt-0.5"
                          >
                            <Download className="w-3 h-3" /> Download
                          </a>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-black border border-zinc-800 flex items-center gap-3">
                        <img
                          src="/icon-1024.png"
                          alt="1024px Play Store Icon"
                          className="w-12 h-12 rounded-2xl border border-orange-500/60 object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-white text-xs block">Play Store Master</span>
                          <span className="text-[10px] text-zinc-400 block font-mono">1024 × 1024 px HD</span>
                          <a
                            href="/icon-1024.png"
                            download="lass-app-icon-1024x1024.png"
                            className="text-emerald-400 hover:text-emerald-300 text-[11px] font-bold flex items-center gap-1 mt-0.5"
                          >
                            <Download className="w-3 h-3" /> Download
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reset Catalog */}
                  <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <strong className="text-white block text-xs">Reset to Factory Catalog</strong>
                      <span className="text-zinc-500 text-[11px]">
                        Restores original audited products and demo orders.
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm('Reset all catalog customizations and orders to factory defaults?')) {
                          onResetToDefault();
                          setLocalProducts(products);
                          showNotification('Store restored to factory defaults.');
                        }
                      }}
                      className="px-3.5 py-2 bg-zinc-800 hover:bg-rose-950/60 hover:text-rose-400 text-zinc-300 font-bold text-xs rounded-xl transition-colors"
                    >
                      Reset Defaults
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* MODAL FOOTER */}
        <div className="shrink-0 p-3 sm:p-4 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-300 font-semibold">LASS Brand Clothes • Brand Owner Portal</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-xs shadow-md shadow-orange-500/25 transition-all"
          >
            Back to Store (Customer View)
          </button>
        </div>
      </div>

      {/* New Product Creator Modal */}
      {isAddingProduct && (
        <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-base">Add New Garment Piece</h3>
              <button onClick={() => setIsAddingProduct(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Piece Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Signature Front Print Tee (B&W)"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Price in ZAR (R) *</label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Initial Stock Units</label>
                  <input
                    type="number"
                    value={newProduct.stockQuantity}
                    onChange={(e) => setNewProduct({ ...newProduct, stockQuantity: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value as any })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="t-shirts">T-Shirts (B&W)</option>
                    <option value="2026-new-drops">2026 Drops</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Print Placement</label>
                  <input
                    type="text"
                    value={newProduct.printType}
                    onChange={(e) => setNewProduct({ ...newProduct, printType: e.target.value as any })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Description</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white h-16"
                  placeholder="Streetwear details, cut and fabric notes..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddingProduct(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md"
                >
                  Save Piece
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Manual Order Creator Modal */}
      {isAddingOrder && (
        <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-base">Record Manual Customer Order</h3>
              <button onClick={() => setIsAddingOrder(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Lerato Khumalo"
                  value={newManualOrder.customerName}
                  onChange={(e) => setNewManualOrder({ ...newManualOrder, customerName: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Phone / WhatsApp *</label>
                  <input
                    type="tel"
                    placeholder="e.g. 071 234 5678"
                    value={newManualOrder.phone}
                    onChange={(e) => setNewManualOrder({ ...newManualOrder, phone: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Customer Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="lerato@gmail.com"
                    value={newManualOrder.email}
                    onChange={(e) => setNewManualOrder({ ...newManualOrder, email: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">PEP Branch / Destination</label>
                  <input
                    type="text"
                    placeholder="e.g. PEP Store Pretoria West"
                    value={newManualOrder.pepBranch}
                    onChange={(e) => setNewManualOrder({ ...newManualOrder, pepBranch: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Delivery Method</label>
                  <select
                    value={newManualOrder.deliveryMethod}
                    onChange={(e) => setNewManualOrder({ ...newManualOrder, deliveryMethod: e.target.value as any })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="paxi-standard">PAXI Standard (R60, 7-9 Days)</option>
                    <option value="paxi-express">PAXI Express (R100, 3-5 Days)</option>
                    <option value="collection">Local Pickup / Collection</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Select Garment Piece</label>
                <select
                  value={newManualOrder.selectedPieceId}
                  onChange={(e) => setNewManualOrder({ ...newManualOrder, selectedPieceId: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white"
                >
                  {localProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatZAR(p.price)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Size</label>
                  <select
                    value={newManualOrder.selectedSize}
                    onChange={(e) => setNewManualOrder({ ...newManualOrder, selectedSize: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="2XL">2XL</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Colour</label>
                  <input
                    type="text"
                    value={newManualOrder.selectedColour}
                    onChange={(e) => setNewManualOrder({ ...newManualOrder, selectedColour: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Qty</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newManualOrder.quantity}
                    onChange={(e) => setNewManualOrder({ ...newManualOrder, quantity: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Internal Notes</label>
                <textarea
                  value={newManualOrder.notes}
                  onChange={(e) => setNewManualOrder({ ...newManualOrder, notes: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white h-14"
                  placeholder="e.g. Paid cash at workshop / EFT verified"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddingOrder(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl shadow-md"
                >
                  Save Manual Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Single Order Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-zinc-950 border-2 border-rose-500/40 rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xl shadow-rose-950/60">
            <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 mx-auto shadow-lg">
              <Trash2 className="w-7 h-7" />
            </div>
            <div className="text-center space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                localStorage Permanent Deletion
              </span>
              <h3 className="font-bold text-white text-base sm:text-lg pt-1">
                Delete Order #{orderToDelete.orderNumber}?
              </h3>
              <p className="text-zinc-400 text-xs">
                This will delete this order record permanently from browser storage ({ORDERS_STORAGE_KEY}).
              </p>
            </div>

            <div className="p-3.5 bg-black/80 rounded-2xl border border-zinc-800 text-xs space-y-2">
              <div className="flex justify-between text-zinc-400">
                <span>Customer:</span>
                <span className="text-white font-bold">{orderToDelete.customer.fullName}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Phone / WA:</span>
                <span className="text-white font-mono">{orderToDelete.customer.phoneOrWhatsApp}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Order Total:</span>
                <span className="text-emerald-400 font-mono font-bold">{formatZAR(orderToDelete.estimatedTotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Items:</span>
                <span className="text-zinc-300">
                  {orderToDelete.items.reduce((s, it) => s + it.quantity, 0)} garments
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl font-bold text-xs transition-colors"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={() => handleDeleteOrder(orderToDelete.orderNumber)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-950 transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Orders Confirmation Modal */}
      {isConfirmingClearAll && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-zinc-950 border-2 border-rose-500/50 rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xl shadow-rose-950/60">
            <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 mx-auto shadow-lg">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="text-center space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Wipe Stored History
              </span>
              <h3 className="font-bold text-white text-base sm:text-lg pt-1">
                Clear All {savedOrders.length} Stored Orders?
              </h3>
              <p className="text-zinc-400 text-xs">
                This will delete every order stored in localStorage key <code className="text-zinc-300 font-mono">{ORDERS_STORAGE_KEY}</code>.
              </p>
            </div>

            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-[11px] text-amber-200 leading-relaxed">
              💡 Tip: You can back up your orders first using the &ldquo;Backup JSON&rdquo; or &ldquo;Export CSV&rdquo; buttons. You can also restore prototype demo orders at any time using &ldquo;Demo Orders&rdquo;.
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsConfirmingClearAll(false)}
                className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAllOrders}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-950 transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Wipe All Orders</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
