import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { api } from '../services/api';
import { toast } from '../utils/toast';
import { Search, Eye, Trash2 } from 'lucide-react';
import type { Order } from '../types';

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusUpdate, setStatusUpdate] = useState({ paymentStatus: '', deliveryStatus: '' });

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
        setOrders(response.data.orders || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setStatusUpdate({
      paymentStatus: order.paymentStatus,
      deliveryStatus: order.deliveryStatus,
    });
    setShowModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    try {
      await api.updateOrderStatus(
        selectedOrder._id,
        statusUpdate.paymentStatus,
        statusUpdate.deliveryStatus
      );
      toast.success('Order status updated successfully');
      setShowModal(false);
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
        <span className="font-mono text-sm">{row._id.slice(-8)}</span>
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
      accessor: (row: Order) => `$${row.totalAmount?.toFixed(2) || '0.00'}`,
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
      accessor: (row: Order) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: 'Actions',
      accessor: (row: Order) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleViewOrder(row)}>
            <Eye size={16} />
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row._id)}>
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1E2934BA] mb-2">Orders</h1>
        <p className="text-[#775596]">Manage customer orders and status</p>
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
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Order Details"
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#775596] mb-1">Order ID</p>
                <p className="font-mono text-sm">{selectedOrder._id}</p>
              </div>
              <div>
                <p className="text-sm text-[#775596] mb-1">Date</p>
                <p>{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-[#775596] mb-1">Customer Email</p>
              <p>{selectedOrder.customerEmail}</p>
            </div>

            <div>
              <p className="text-sm text-[#775596] mb-1">Shipping Address</p>
              <p>{selectedOrder.shippingAddress}</p>
            </div>

            <div>
              <p className="text-sm text-[#775596] mb-2">Order Items</p>
              <div className="space-y-2">
                {selectedOrder.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between p-3 bg-[#F2DFFF] bg-opacity-30 rounded-lg"
                  >
                    <span>Quantity: {item.quantity}</span>
                    <span className="font-medium">${item.price?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Amount</span>
              <span>${selectedOrder.totalAmount?.toFixed(2) || '0.00'}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateStatus}>Update Status</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
