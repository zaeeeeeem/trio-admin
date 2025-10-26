import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { ProductSelector } from '../components/ui/ProductSelector';
import { api } from '../services/api';
import { toast } from '../utils/toast';
import { Search, Eye, Trash2, Edit2, Plus } from 'lucide-react';
import type { Order, Product, CreateOrderPayload } from '../types';

type OrderItemForm = {
  product: Product | null;
  quantity: number;
};

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusUpdate, setStatusUpdate] = useState({ paymentStatus: '', deliveryStatus: '' });
  const [modalLoading, setModalLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createOrderLoading, setCreateOrderLoading] = useState(false);
  const [createOrderForm, setCreateOrderForm] = useState({
    sessionId: '',
    customerEmail: '',
    customerPhone: '',
    shippingAddress: '',
    paymentGateway: '',
    paymentTransactionRef: '',
    items: [{ product: null, quantity: 1 }] as OrderItemForm[],
  });

  const formatDateTime = (value?: string) => {
    if (!value) {
      return 'N/A';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'N/A';
    }
    return date.toLocaleString();
  };

  const formatCurrency = (value?: number) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return '$0.00';
    }
    return `$${value.toFixed(2)}`;
  };

  const extractId = (value: unknown): string => {
    if (typeof value === 'string') {
      return value;
    }
    if (value && typeof value === 'object') {
      const withOid = value as { $oid?: string; oid?: string; id?: string };
      if (typeof withOid.$oid === 'string') return withOid.$oid;
      if (typeof withOid.oid === 'string') return withOid.oid;
      if (typeof withOid.id === 'string') return withOid.id;
      if ('toString' in value && typeof (value as { toString: () => string }).toString === 'function') {
        return (value as { toString: () => string }).toString();
      }
    }
    return '';
  };

  const extractDate = (value: unknown): string => {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number') {
      return new Date(value).toISOString();
    }
    if (value && typeof value === 'object') {
      const withDate = value as { $date?: unknown; date?: unknown; toDate?: () => Date };
      if (withDate.$date) {
        const nested = withDate.$date as { $numberLong?: string } | string | number;
        if (typeof nested === 'string') return new Date(nested).toISOString();
        if (typeof nested === 'number') return new Date(nested).toISOString();
        if (nested && typeof nested === 'object' && typeof nested.$numberLong === 'string') {
          return new Date(Number(nested.$numberLong)).toISOString();
        }
      }
      if (withDate.date) {
        const nested = withDate.date as { value?: number } | string | number;
        if (typeof nested === 'string') return new Date(nested).toISOString();
        if (typeof nested === 'number') return new Date(nested).toISOString();
        if (nested && typeof nested === 'object' && typeof nested.value === 'number') {
          return new Date(nested.value).toISOString();
        }
      }
      if (typeof withDate.toDate === 'function') {
        return withDate.toDate().toISOString();
      }
    }
    return new Date().toISOString();
  };

  const normalizeOrder = (
    rawOrder: Partial<Order> | (Partial<Order> & { [key: string]: unknown })
  ): Order => {
    const orderRecord = rawOrder as Partial<Order> & { [key: string]: unknown };
    const itemsSource =
      (orderRecord.items as Order['items']) ??
      ((orderRecord as { order_items?: Order['items'] }).order_items ?? []);

    const items = (itemsSource ?? []).map((item) => {
      const rawProduct =
        item.product ??
        (item as { product_id?: Product | string }).product_id ??
        (item as { productId?: Product | string }).productId;

      const product =
        rawProduct && typeof rawProduct === 'object'
          ? (rawProduct as Product)
          : undefined;

      const price =
        typeof item.price === 'number'
          ? item.price
          : (item as { priceAtTime?: number }).priceAtTime ??
            (item as { price_at_time?: number }).price_at_time ??
            0;

      const subtotal =
        typeof item.subtotal === 'number'
          ? item.subtotal
          : (item as { subtotal?: number }).subtotal ?? price * item.quantity;

      return {
        ...item,
        product,
        productName:
          item.productName ??
          (item as { product_name?: string }).product_name ??
          product?.name,
        price,
        subtotal,
      };
    });

    const id = extractId(orderRecord.id ?? (orderRecord as { _id?: unknown })._id);

    const totalAmountValue =
      typeof orderRecord.totalAmount === 'number'
        ? orderRecord.totalAmount
        : (orderRecord as { total_amount?: number }).total_amount ??
          items.reduce((sum, item) => sum + (item.subtotal ?? item.price * item.quantity), 0);

    return {
      id,
      _id: extractId((orderRecord as { _id?: unknown })._id),
      sessionId:
        (orderRecord.sessionId as string | undefined) ??
        (orderRecord as { session_id?: string }).session_id ??
        '',
      customerEmail:
        (orderRecord.customerEmail as string | undefined) ??
        (orderRecord as { customer_email?: string }).customer_email ??
        (orderRecord as { email?: string }).email ??
        '',
      customerPhone:
        (orderRecord.customerPhone as string | undefined) ??
        (orderRecord as { customer_phone?: string }).customer_phone ??
        (orderRecord as { phone?: string }).phone,
      shippingAddress:
        (orderRecord.shippingAddress as string | undefined) ??
        (orderRecord as { shipping_address?: string }).shipping_address ??
        (orderRecord as { address?: string }).address ??
        '',
      items,
      totalAmount: totalAmountValue,
      paymentStatus:
        (orderRecord.paymentStatus as Order['paymentStatus'] | undefined) ??
        (orderRecord as { payment_status?: Order['paymentStatus'] }).payment_status ??
        'pending',
      deliveryStatus:
        (orderRecord.deliveryStatus as Order['deliveryStatus'] | undefined) ??
        (orderRecord as { delivery_status?: Order['deliveryStatus'] }).delivery_status ??
        'processing',
      paymentDetails:
        orderRecord.paymentDetails ??
        (orderRecord as { payment_details?: unknown }).payment_details,
      createdAt: extractDate(
        orderRecord.createdAt ?? (orderRecord as { created_at?: unknown }).created_at
      ),
      updatedAt: extractDate(
        orderRecord.updatedAt ??
          (orderRecord as { updated_at?: unknown }).updated_at ??
          orderRecord.createdAt ??
          (orderRecord as { created_at?: unknown }).created_at
      ),
    };
  };

  const resetCreateOrderForm = () => {
    setCreateOrderForm({
      sessionId: '',
      customerEmail: '',
      customerPhone: '',
      shippingAddress: '',
      paymentGateway: '',
      paymentTransactionRef: '',
      items: [{ product: null, quantity: 1 }] as OrderItemForm[],
    });
  };

  useEffect(() => {
    fetchOrders();
  }, [page, search, paymentFilter, deliveryFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const filters: any = { page, limit: 10 };
      if (search) filters.customerEmail = search;
      if (paymentFilter) filters.paymentStatus = paymentFilter;
      if (deliveryFilter) filters.deliveryStatus = deliveryFilter;

      const response = await api.getOrders(filters);
      if (response.success) {
        setOrders(response.data?.orders ?? []);
        setTotalPages(response.data?.pagination?.totalPages ?? 1);
      }
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const loadOrderDetails = async (order: Order) => {
    const orderId = order.id ?? order._id;
    if (!orderId) {
      return normalizeOrder(order);
    }

    const hasDetailedItems = Array.isArray(order.items) && order.items.length > 0;
    if (hasDetailedItems && order.shippingAddress) {
      return normalizeOrder(order);
    }

    try {
      const response = await api.getOrder(orderId);
      if (response.success && response.data) {
        return normalizeOrder(response.data as Order);
      }
    } catch (error) {
      console.error('Failed to fetch order details', error);
      throw error;
    }

    return normalizeOrder(order);
  };

  const populateOrderState = (order: Order) => {
    const normalized = normalizeOrder(order);
    setSelectedOrder(normalized);
    setStatusUpdate({
      paymentStatus: normalized.paymentStatus,
      deliveryStatus: normalized.deliveryStatus,
    });
  };

  const handleViewOrder = async (order: Order) => {
    setShowStatusModal(false);
    setShowDetailsModal(true);
    setModalLoading(true);
    setSelectedOrder(null);

    try {
      const detailedOrder = await loadOrderDetails(order);
      populateOrderState(detailedOrder);
    } catch (error) {
      toast.error('Failed to load order details');
      populateOrderState(order);
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenStatusModal = async (order: Order) => {
    populateOrderState(order);
    setShowDetailsModal(false);
    setShowStatusModal(true);
    setModalLoading(true);

    try {
      const detailedOrder = await loadOrderDetails(order);
      populateOrderState(detailedOrder);
    } catch (error) {
      toast.error('Failed to load order details');
      populateOrderState(order);
    } finally {
      setModalLoading(false);
    }
  };

  const handleAddOrderItem = () => {
    setCreateOrderForm((prev) => ({
      ...prev,
      items: [...prev.items, { product: null, quantity: 1 }],
    }));
  };

  const handleRemoveOrderItem = (index: number) => {
    setCreateOrderForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleItemProductSelect = (index: number, product: Product | null) => {
    setCreateOrderForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], product };
      return { ...prev, items };
    });
  };

  const handleItemQuantityChange = (index: number, quantity: number) => {
    setCreateOrderForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], quantity: quantity > 0 ? quantity : 1 };
      return { ...prev, items };
    });
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateOrderLoading(false);
    resetCreateOrderForm();
  };

  const handleCreateOrderSubmit = async () => {
    const trimmedEmail = createOrderForm.customerEmail.trim();
    if (!trimmedEmail) {
      toast.error('Customer email is required');
      return;
    }

    const orderItems = createOrderForm.items
      .filter((item) => item.product && item.quantity > 0)
      .map((item) => ({
        productId: item.product?.id ?? item.product?._id ?? '',
        quantity: item.quantity,
      }))
      .filter((item) => item.productId);

    if (orderItems.length === 0) {
      toast.error('Add at least one product to the order');
      return;
    }

    const payload: CreateOrderPayload = {
      sessionId: createOrderForm.sessionId.trim() || undefined,
      customerEmail: trimmedEmail,
      customerPhone: createOrderForm.customerPhone.trim() || undefined,
      shippingAddress: createOrderForm.shippingAddress.trim() || undefined,
      items: orderItems,
      paymentDetails:
        createOrderForm.paymentGateway.trim() || createOrderForm.paymentTransactionRef.trim()
          ? {
              gateway: createOrderForm.paymentGateway.trim() || 'manual',
              transactionRef: createOrderForm.paymentTransactionRef.trim() || `MANUAL-${Date.now()}`,
            }
          : undefined,
    };

    setCreateOrderLoading(true);
    try {
      if (!payload.sessionId) {
        const sessionResponse = await api.createSession();
        if (!sessionResponse.success || !sessionResponse.data?.sessionId) {
          toast.error(sessionResponse.message || 'Failed to create session');
          setCreateOrderLoading(false);
          return;
        }
        payload.sessionId = sessionResponse.data.sessionId;
      }

      const response = await api.createOrder(payload);
      if (!response.success) {
        toast.error(response.message || 'Failed to create order');
        return;
      }

      toast.success('Order created successfully');
      handleCloseCreateModal();
      await fetchOrders();
      if (response.data) {
        void handleViewOrder(response.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create order');
    } finally {
      setCreateOrderLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    const orderId = selectedOrder.id ?? selectedOrder._id;
    if (!orderId) {
      toast.error('Unable to determine order identifier');
      return;
    }

    try {
      await api.updateOrderStatus(orderId, statusUpdate.paymentStatus, statusUpdate.deliveryStatus);
      toast.success('Order status updated successfully');
      setSelectedOrder((current) =>
        current
          ? {
              ...current,
              paymentStatus: statusUpdate.paymentStatus as Order['paymentStatus'],
              deliveryStatus: statusUpdate.deliveryStatus as Order['deliveryStatus'],
            }
          : current
      );
      setShowStatusModal(false);
      setShowDetailsModal(false);
      fetchOrders();
    } catch (error: any) {
      toast.error('Failed to update order status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      await api.deleteOrder(id);
      toast.success('Order deleted successfully');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to delete order');
    }
  };

  const columns = [
    {
      header: 'Order ID',
      accessor: (row: Order) => (
        <span className="font-mono text-sm">{(row.id ?? row._id)?.slice(-8)}</span>
      ),
    },
    {
      header: 'Customer',
      accessor: (row: Order) => (
        <div>
          <p className="font-medium">{row.customerEmail}</p>
          <p className="text-xs text-[#775596]">{row.customerPhone}</p>
        </div>
      ),
    },
    {
      header: 'Amount',
      accessor: (row: Order) => formatCurrency(row.totalAmount),
    },
    {
      header: 'Payment',
      accessor: (row: Order) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.paymentStatus === 'paid'
              ? 'bg-green-100 text-green-700'
              : row.paymentStatus === 'failed'
              ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {row.paymentStatus}
        </span>
      ),
    },
    {
      header: 'Delivery',
      accessor: (row: Order) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.deliveryStatus === 'delivered'
              ? 'bg-green-100 text-green-700'
              : row.deliveryStatus === 'cancelled'
              ? 'bg-red-100 text-red-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {row.deliveryStatus}
        </span>
      ),
    },
    {
      header: 'Date',
      accessor: (row: Order) => formatDateTime(row.createdAt),
    },
    {
      header: 'Actions',
      accessor: (row: Order) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewOrder(row)}
            title="Preview order"
          >
            <Eye size={16} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenStatusModal(row)}
            title="Edit status"
          >
            <Edit2 size={16} />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              const orderId = row.id ?? row._id;
              if (orderId) {
                handleDelete(orderId);
              } else {
                toast.error('Unable to determine order identifier');
              }
            }}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1E2934BA] mb-2">Orders</h1>
          <p className="text-[#775596]">Manage customer orders and status</p>
        </div>
        <Button
          onClick={() => {
            resetCreateOrderForm();
            setShowCreateModal(true);
          }}
        >
          <Plus size={18} className="mr-2" />
          Create Order
        </Button>
      </div>

      <Card>
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#775596]"
              size={20}
            />
            <Input
              placeholder="Search by email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>

          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9268AF]"
          >
            <option value="">All Payment Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={deliveryFilter}
            onChange={(e) => {
              setDeliveryFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9268AF]"
          >
            <option value="">All Delivery Status</option>
            <option value="processing">Processing</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <Table data={orders} columns={columns} loading={loading} emptyMessage="No orders found" />

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <span className="px-4 py-2 text-[#1E2934BA]">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="ghost"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </Card>

      <Modal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        title="Create Order"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Customer Email"
              type="email"
              value={createOrderForm.customerEmail}
              onChange={(e) =>
                setCreateOrderForm((prev) => ({ ...prev, customerEmail: e.target.value }))
              }
              placeholder="customer@example.com"
              required
            />
            <Input
              label="Customer Phone (optional)"
              value={createOrderForm.customerPhone}
              onChange={(e) =>
                setCreateOrderForm((prev) => ({ ...prev, customerPhone: e.target.value }))
              }
              placeholder="+1234567890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E2934BA] mb-1">
              Shipping Address (optional)
            </label>
            <textarea
              value={createOrderForm.shippingAddress}
              onChange={(e) =>
                setCreateOrderForm((prev) => ({ ...prev, shippingAddress: e.target.value }))
              }
              className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9268AF]"
              rows={3}
              placeholder="123 Main St, City, Country"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Session ID (optional)"
              value={createOrderForm.sessionId}
              onChange={(e) =>
                setCreateOrderForm((prev) => ({ ...prev, sessionId: e.target.value }))
              }
              placeholder="manual-session-id"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Payment Gateway"
                value={createOrderForm.paymentGateway}
                onChange={(e) =>
                  setCreateOrderForm((prev) => ({ ...prev, paymentGateway: e.target.value }))
                }
                placeholder="Manual"
              />
              <Input
                label="Transaction Ref"
                value={createOrderForm.paymentTransactionRef}
                onChange={(e) =>
                  setCreateOrderForm((prev) => ({
                    ...prev,
                    paymentTransactionRef: e.target.value,
                  }))
                }
                placeholder="TXN123"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#1E2934BA]">Order Items</p>
              <Button variant="secondary" size="sm" onClick={handleAddOrderItem}>
                <Plus size={16} className="mr-2" /> Add Item
              </Button>
            </div>

            {createOrderForm.items.map((item, index) => (
              <div
                key={`order-item-${index}`}
                className="flex flex-col md:flex-row gap-3 items-start md:items-end"
              >
                <div className="flex-1 w-full">
                  {index === 0 && (
                    <p className="text-sm font-medium text-[#1E2934BA] mb-1">Product</p>
                  )}
                  <ProductSelector
                    selectedProduct={item.product}
                    onSelect={(product) => handleItemProductSelect(index, product)}
                    placeholder="Search product..."
                  />
                </div>
                <div className="w-full md:w-32">
                  <Input
                    label={index === 0 ? 'Quantity' : undefined}
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemQuantityChange(index, parseInt(e.target.value, 10) || 1)
                    }
                  />
                </div>
                {createOrderForm.items.length > 1 && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleRemoveOrderItem(index)}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#F2DFFF]">
            <Button variant="ghost" onClick={handleCloseCreateModal} disabled={createOrderLoading}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrderSubmit} loading={createOrderLoading}>
              Create Order
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedOrder(null);
          setModalLoading(false);
        }}
        title="Order Details"
        size="lg"
      >
        {modalLoading ? (
          <div className="py-16 text-center text-[#775596]">Loading order details...</div>
        ) : selectedOrder ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#775596] mb-1">Order ID</p>
                <p className="font-mono text-sm break-all">
                  {(selectedOrder.id ?? selectedOrder._id) || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#775596] mb-1">Date</p>
                <p>{formatDateTime(selectedOrder.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-[#775596] mb-1">Customer Email</p>
                <p>{selectedOrder.customerEmail || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-[#775596] mb-1">Customer Phone</p>
                <p>{selectedOrder.customerPhone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-[#775596] mb-1">Session ID</p>
                <p className="font-mono text-xs break-all">
                  {selectedOrder.sessionId || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#775596] mb-1">Shipping Address</p>
                <p>{selectedOrder.shippingAddress || 'N/A'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-[#775596] mb-2">Order Items</p>
              <div className="space-y-2">
                {(selectedOrder.items ?? []).length === 0 ? (
                  <div className="p-3 bg-[#F2DFFF] bg-opacity-30 rounded-lg text-sm text-[#775596]">
                    No items attached to this order.
                  </div>
                ) : (
                  (selectedOrder.items ?? []).map((item, index) => (
                    <div
                      key={`${item.productId}-${index}`}
                      className="flex justify-between gap-4 p-3 bg-[#F2DFFF] bg-opacity-30 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-[#1E2934BA]">
                          {item.product?.name ?? item.productName ?? 'Unknown product'}
                        </p>
                        <p className="text-xs text-[#775596]">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[#775596]">
                          Unit: {formatCurrency(item.price)}
                        </p>
                        <p className="font-medium text-[#1E2934BA]">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Amount</span>
              <span>{formatCurrency(selectedOrder.totalAmount)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#775596] mb-1">Payment Status</p>
                <span className="font-medium text-[#1E2934BA] capitalize">
                  {selectedOrder.paymentStatus}
                </span>
              </div>
              <div>
                <p className="text-sm text-[#775596] mb-1">Delivery Status</p>
                <span className="font-medium text-[#1E2934BA] capitalize">
                  {selectedOrder.deliveryStatus}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#F2DFFF]">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDetailsModal(false);
                  setModalLoading(false);
                  setSelectedOrder(null);
                }}
              >
                Close
              </Button>
              <Button onClick={() => handleOpenStatusModal(selectedOrder)}>Edit Status</Button>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center text-[#775596]">Order details unavailable.</div>
        )}
      </Modal>

      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedOrder(null);
          setModalLoading(false);
        }}
        title="Update Order Status"
      >
        {modalLoading ? (
          <div className="py-10 text-center text-[#775596]">Loading order details...</div>
        ) : selectedOrder ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-[#775596] mb-1">Order</p>
              <p className="font-medium text-[#1E2934BA]">
                {(selectedOrder.id ?? selectedOrder._id)?.slice(-8)} — {selectedOrder.customerEmail}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1E2934BA] mb-1">
                  Payment Status
                </label>
                <select
                  value={statusUpdate.paymentStatus}
                  onChange={(e) =>
                    setStatusUpdate({ ...statusUpdate, paymentStatus: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9268AF]"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E2934BA] mb-1">
                  Delivery Status
                </label>
                <select
                  value={statusUpdate.deliveryStatus}
                  onChange={(e) =>
                    setStatusUpdate({ ...statusUpdate, deliveryStatus: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9268AF]"
                >
                  <option value="processing">Processing</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#F2DFFF]">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowStatusModal(false);
                  setModalLoading(false);
                  setSelectedOrder(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateStatus}>Update Status</Button>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-[#775596]">Order details unavailable.</div>
        )}
      </Modal>
    </div>
  );
}
