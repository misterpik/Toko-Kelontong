import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Package, TrendingUp, Clock, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/../supabase/supabase';
import { useAuth } from '@/../supabase/auth';

interface Stats {
  todaySales: number;
  todayTransactions: number;
  lowStockCount: number;
}

interface RecentSale {
  id: string;
  total: number;
  payment_method: string;
  created_at: string;
}

export default function CashierDashboard() {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<Stats>({
    todaySales: 0,
    todayTransactions: 0,
    lowStockCount: 0,
  });
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id, id')
        .eq('user_id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: salesData } = await supabase
        .from('sales')
        .select('total, payment_method, created_at, id')
        .eq('tenant_id', userData.tenant_id)
        .eq('user_id', userData.id)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (salesData) {
        const totalSales = salesData.reduce((sum, sale) => sum + sale.total, 0);
        setStats(prev => ({
          ...prev,
          todaySales: totalSales,
          todayTransactions: salesData.length,
        }));
        setRecentSales(salesData.slice(0, 5));
      }

      const { data: lowStockData } = await supabase
        .from('products')
        .select('id')
        .eq('tenant_id', userData.tenant_id)
        .lt('stock', 10);

      if (lowStockData) {
        setStats(prev => ({ ...prev, lowStockCount: lowStockData.length }));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Tunai',
      qris: 'QRIS',
      ewallet: 'E-Wallet',
    };
    return labels[method] || method;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Kasir</h1>
              <p className="text-gray-600 mt-1">Selamat datang kembali!</p>
            </div>
            <div className="flex gap-3">
              <Link to="/owner/pos">
                <Button size="lg">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Buka Kasir
                </Button>
              </Link>
              <Button variant="outline" size="lg" onClick={signOut}>
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Penjualan Hari Ini
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.todaySales)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.todayTransactions} transaksi
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Transaksi
                </CardTitle>
                <CreditCard className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.todayTransactions}
                </div>
                <p className="text-xs text-gray-500 mt-1">Hari ini</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Stok Menipis
                </CardTitle>
                <Package className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.lowStockCount}
                </div>
                <p className="text-xs text-gray-500 mt-1">Produk perlu restock</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Transaksi Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentSales.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Belum ada transaksi hari ini</p>
                  <Link to="/owner/pos">
                    <Button className="mt-4">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Mulai Transaksi
                    </Button>
                  </Link>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Metode Pembayaran</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{formatTime(sale.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getPaymentMethodLabel(sale.payment_method)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(sale.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
