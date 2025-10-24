import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { api } from '../services/api';
import { toast } from '../utils/toast';
import {
  Package,
  ShoppingCart,
  Calendar,
  AlertCircle,
  DollarSign,
  Clock,
  TrendingUp,
  Star,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, sellersRes] = await Promise.all([
        api.getDashboardStats(),
        api.getBestSellers(5),
      ]);

      if (statsRes.success) {
        setStats(statsRes.data);
      }
      if (sellersRes.success) {
        setBestSellers(sellersRes.data || []);
      }
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats
    ? [
        {
          title: 'Total Products',
          value: stats.totalProducts,
          icon: Package,
          color: 'from-blue-500 to-blue-600',
        },
        {
          title: 'Total Orders',
          value: stats.totalOrders,
          icon: ShoppingCart,
          color: 'from-green-500 to-green-600',
        },
        {
          title: 'Subscriptions',
          value: stats.totalSubscriptions,
          icon: Calendar,
          color: 'from-purple-500 to-purple-600',
        },
        {
          title: 'Low Stock Items',
          value: stats.lowStockProducts,
          icon: AlertCircle,
          color: 'from-red-500 to-red-600',
        },
        {
          title: 'Total Revenue',
          value: `$${stats.totalRevenue?.toFixed(2) || '0.00'}`,
          icon: DollarSign,
          color: 'from-[#9268AF] to-[#775596]',
        },
        {
          title: 'Pending Orders',
          value: stats.pendingOrders,
          icon: Clock,
          color: 'from-orange-500 to-orange-600',
        },
      ]
    : [];

  const COLORS = ['#9268AF', '#775596', '#DAC8ED', '#6B5B95', '#9B7EBD'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1E2934BA] mb-2">Dashboard Overview</h1>
        <p className="text-[#775596]">Monitor your café's performance at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#1E2934BA] opacity-60 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-[#1E2934BA]">{stat.value}</p>
              </div>
              <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-lg`}>
                <stat.icon size={24} className="text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Best Selling Products">
          {bestSellers.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bestSellers}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2DFFF" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#1E2934BA' }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis tick={{ fill: '#1E2934BA' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #F2DFFF',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="totalSold" fill="#9268AF" name="Units Sold" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-[#1E2934BA] opacity-60 py-12">No sales data available</p>
          )}
        </Card>

        <Card title="Product Distribution">
          {bestSellers.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bestSellers}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="totalSold"
                >
                  {bestSellers.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-[#1E2934BA] opacity-60 py-12">No data available</p>
          )}
        </Card>
      </div>

      <Card title="Recent Activity">
        <div className="space-y-4">
          {bestSellers.slice(0, 5).map((product, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-[#F2DFFF] bg-opacity-30 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-[#9268AF] to-[#775596] p-2 rounded-lg">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-medium text-[#1E2934BA]">{product.name}</p>
                  <p className="text-sm text-[#775596]">{product.totalSold} units sold</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium text-[#1E2934BA]">
                  {product.rating?.toFixed(1) || 'N/A'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
