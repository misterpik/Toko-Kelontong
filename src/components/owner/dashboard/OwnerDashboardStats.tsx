import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  AlertTriangle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { supabase } from '@/../supabase/supabase';
import { useAuth } from '@/../supabase/auth';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  icon: React.ReactNode;
  iconBg: string;
}

function StatCard({ title, value, change, trend, icon, iconBg }: StatCardProps) {
  return (
    <Card className="bg-white border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
            {change && (
              <div className="flex items-center gap-1 mt-2">
                {trend === 'up' ? (
                  <ArrowUp className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {change}
                </span>
                <span className="text-sm text-gray-500">dari kemarin</span>
              </div>
            )}
          </div>
          <div className={`h-12 w-12 rounded-xl ${iconBg} flex items-center justify-center`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DashboardStats {
  totalSales: number;
  todaySales: number;
  lowStockCount: number;
  todayTransactions: number;
  salesChange: string;
  transactionsChange: string;
}

export default function OwnerDashboardStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    todaySales: 0,
    lowStockCount: 0,
    todayTransactions: 0,
    salesChange: '0%',
    transactionsChange: '0%'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const [salesResult, todaySalesResult, yesterdaySalesResult, lowStockResult] = await Promise.all([
        supabase
          .from('sales')
          .select('total')
          .eq('tenant_id', userData.tenant_id),
        supabase
          .from('sales')
          .select('total')
          .eq('tenant_id', userData.tenant_id)
          .gte('created_at', today.toISOString()),
        supabase
          .from('sales')
          .select('total')
          .eq('tenant_id', userData.tenant_id)
          .gte('created_at', yesterday.toISOString())
          .lt('created_at', today.toISOString()),
        supabase
          .from('products')
          .select('id')
          .eq('tenant_id', userData.tenant_id)
          .filter('stock', 'lte', 'min_stock')
      ]);

      const totalSales = salesResult.data?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
      const todaySales = todaySalesResult.data?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
      const yesterdaySales = yesterdaySalesResult.data?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
      const todayTransactions = todaySalesResult.data?.length || 0;
      const yesterdayTransactions = yesterdaySalesResult.data?.length || 0;

      const salesChange = yesterdaySales > 0 
        ? `${Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100)}%`
        : '0%';
      
      const transactionsChange = yesterdayTransactions > 0
        ? `${Math.round(((todayTransactions - yesterdayTransactions) / yesterdayTransactions) * 100)}%`
        : '0%';

      setStats({
        totalSales,
        todaySales,
        lowStockCount: lowStockResult.data?.length || 0,
        todayTransactions,
        salesChange,
        transactionsChange
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-white border-gray-200">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Penjualan"
        value={formatCurrency(stats.totalSales)}
        icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
        iconBg="bg-blue-50"
      />
      <StatCard
        title="Penjualan Hari Ini"
        value={formatCurrency(stats.todaySales)}
        change={stats.salesChange}
        trend={stats.salesChange.startsWith('-') ? 'down' : 'up'}
        icon={<ShoppingCart className="h-6 w-6 text-green-600" />}
        iconBg="bg-green-50"
      />
      <StatCard
        title="Transaksi Hari Ini"
        value={stats.todayTransactions.toString()}
        change={stats.transactionsChange}
        trend={stats.transactionsChange.startsWith('-') ? 'down' : 'up'}
        icon={<ShoppingCart className="h-6 w-6 text-purple-600" />}
        iconBg="bg-purple-50"
      />
      <StatCard
        title="Stok Menipis"
        value={stats.lowStockCount.toString()}
        icon={<AlertTriangle className="h-6 w-6 text-orange-600" />}
        iconBg="bg-orange-50"
      />
    </div>
  );
}
