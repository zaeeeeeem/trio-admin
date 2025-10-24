import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { api } from '../services/api';
import { toast } from '../utils/toast';
import { Plus, Edit, Trash2, Search, Ban } from 'lucide-react';
import type { Subscription, SubscriptionPlan } from '../types';

export function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [planFormData, setPlanFormData] = useState({
    name: '',
    frequency: 'monthly',
    price: 0,
    description: '',
  });

  useEffect(() => {
    fetchSubscriptions();
    fetchPlans();
  }, [page, search]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const filters: any = { page, limit: 10 };
      if (search) filters.customerEmail = search;

      const response = await api.getSubscriptions(filters);
      if (response.success) {
        setSubscriptions(response.data.subscriptions || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await api.getSubscriptionPlans();
      if (response.success) {
        setPlans(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load plans');
    }
  };

  const handleCancelSubscription = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;

    try {
      await api.cancelSubscription(id);
      toast.success('Subscription cancelled successfully');
      fetchSubscriptions();
    } catch (error) {
      toast.error('Failed to cancel subscription');
    }
  };

  const handleSubmitPlan = async () => {
    try {
      if (editingPlan) {
        await api.updateSubscriptionPlan(editingPlan._id, planFormData);
        toast.success('Plan updated successfully');
      } else {
        await api.createSubscriptionPlan(planFormData);
        toast.success('Plan created successfully');
      }
      setShowPlanModal(false);
      resetPlanForm();
      fetchPlans();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setPlanFormData({
      name: plan.name,
      frequency: plan.frequency,
      price: plan.price,
      description: plan.description || '',
    });
    setShowPlanModal(true);
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      await api.deleteSubscriptionPlan(id);
      toast.success('Plan deleted successfully');
      fetchPlans();
    } catch (error) {
      toast.error('Failed to delete plan');
    }
  };

  const resetPlanForm = () => {
    setEditingPlan(null);
    setPlanFormData({ name: '', frequency: 'monthly', price: 0, description: '' });
  };

  const getPlanName = (planId: string) => {
    const plan = plans.find((p) => p._id === planId);
    return plan?.name || 'Unknown Plan';
  };

  const subscriptionColumns = [
    {
      header: 'Customer',
      accessor: (row: Subscription) => (
        <div>
          <p className="font-medium">{row.customerEmail}</p>
          {row.giftFor && <p className="text-xs text-[#775596]">Gift for: {row.giftFor}</p>}
        </div>
      ),
    },
    {
      header: 'Plan',
      accessor: (row: Subscription) => getPlanName(row.planId),
    },
    {
      header: 'Start Date',
      accessor: (row: Subscription) => new Date(row.startDate).toLocaleDateString(),
    },
    {
      header: 'Status',
      accessor: (row: Subscription) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.status === 'active'
              ? 'bg-green-100 text-green-700'
              : row.status === 'cancelled'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: Subscription) => (
        <Button
          size="sm"
          variant="danger"
          onClick={() => handleCancelSubscription(row._id)}
          disabled={row.status !== 'active'}
        >
          <Ban size={16} />
        </Button>
      ),
    },
  ];

  const planColumns = [
    { header: 'Name', accessor: 'name' as keyof SubscriptionPlan },
    {
      header: 'Frequency',
      accessor: (row: SubscriptionPlan) => (
        <span className="capitalize">{row.frequency}</span>
      ),
    },
    {
      header: 'Price',
      accessor: (row: SubscriptionPlan) => `$${row.price.toFixed(2)}`,
    },
    {
      header: 'Actions',
      accessor: (row: SubscriptionPlan) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleEditPlan(row)}>
            <Edit size={16} />
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDeletePlan(row._id)}>
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1E2934BA] mb-2">Subscriptions</h1>
        <p className="text-[#775596]">Manage subscription plans and customers</p>
      </div>

      <Card
        title="Subscription Plans"
        action={
          <Button
            size="sm"
            onClick={() => {
              resetPlanForm();
              setShowPlanModal(true);
            }}
          >
            <Plus size={16} className="mr-2" />
            Add Plan
          </Button>
        }
      >
        <Table
          data={plans}
          columns={planColumns}
          loading={loading}
          emptyMessage="No plans found"
        />
      </Card>

      <Card title="Active Subscriptions">
        <div className="mb-6 relative">
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

        <Table
          data={subscriptions}
          columns={subscriptionColumns}
          loading={loading}
          emptyMessage="No subscriptions found"
        />

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
        isOpen={showPlanModal}
        onClose={() => {
          setShowPlanModal(false);
          resetPlanForm();
        }}
        title={editingPlan ? 'Edit Plan' : 'Add New Plan'}
      >
        <div className="space-y-4">
          <Input
            label="Plan Name"
            value={planFormData.name}
            onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1E2934BA] mb-1">
                Frequency
              </label>
              <select
                value={planFormData.frequency}
                onChange={(e) =>
                  setPlanFormData({ ...planFormData, frequency: e.target.value as any })
                }
                className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9268AF]"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <Input
              label="Price"
              type="number"
              step="0.01"
              value={planFormData.price}
              onChange={(e) =>
                setPlanFormData({ ...planFormData, price: parseFloat(e.target.value) })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E2934BA] mb-1">
              Description
            </label>
            <textarea
              value={planFormData.description}
              onChange={(e) =>
                setPlanFormData({ ...planFormData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9268AF]"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowPlanModal(false);
                resetPlanForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitPlan}>
              {editingPlan ? 'Update' : 'Create'} Plan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
