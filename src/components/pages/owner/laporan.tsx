import { useState, useEffect } from 'react';
import OwnerLayout from '@/components/layout/OwnerLayout';
import { FileText, Download, TrendingUp, ShoppingCart, DollarSign, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/../supabase/supabase';
import { useAuth } from '@/../supabase/auth';
import * as XLSX from 'xlsx';

interface Sale {
  id: string;
  total: number;
  payment_method: string;
  created_at: string;
  user_name: string;
}

interface Purchase {
  id: string;
  total: number;
  payment_status: string;
  created_at: string;
  supplier_name: string;
}

interface Stats {
  totalSales: number;
  totalPurchases: number;
  profit: number;
  transactionCount: number;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('today');
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalSales: 0,
    totalPurchases: 0,
    profit: 0,
    transactionCount: 0,
  });

  useEffect(() => {
    loadReportData();
  }, [user, dateFilter]);

  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateFilter) {
      case 'today':
        return { start: today, end: new Date() };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return { start: weekStart, end: new Date() };
      case 'month':
        const monthStart = new Date(today);
        monthStart.setDate(today.getDate() - 30);
        return { start: monthStart, end: new Date() };
      case 'year':
        const yearStart = new Date(today);
        yearStart.setFullYear(today.getFullYear() - 1);
        return { start: yearStart, end: new Date() };
      default:
        return { start: today, end: new Date() };
    }
  };

  const loadReportData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      const { start, end } = getDateRange();

      // Load sales
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          id,
          total,
          payment_method,
          created_at,
          users(full_name)
        `)
        .eq('tenant_id', userData.tenant_id)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      const formattedSales = salesData?.map((s: any) => ({
        id: s.id,
        total: s.total,
        payment_method: s.payment_method,
        created_at: s.created_at,
        user_name: s.users?.full_name || '-',
      })) || [];

      setSales(formattedSales);

      // Load purchases
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select(`
          id,
          total,
          payment_status,
          created_at,
          suppliers(name)
        `)
        .eq('tenant_id', userData.tenant_id)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });

      if (purchasesError) throw purchasesError;

      const formattedPurchases = purchasesData?.map((p: any) => ({
        id: p.id,
        total: p.total,
        payment_status: p.payment_status,
        created_at: p.created_at,
        supplier_name: p.suppliers?.name || '-',
      })) || [];

      setPurchases(formattedPurchases);

      // Calculate stats
      const totalSales = formattedSales.reduce((sum, s) => sum + parseFloat(s.total.toString()), 0);
      const totalPurchases = formattedPurchases.reduce((sum, p) => sum + parseFloat(p.total.toString()), 0);
      const profit = totalSales - totalPurchases;

      setStats({
        totalSales,
        totalPurchases,
        profit,
        transactionCount: formattedSales.length,
      });
    } catch (error) {
      console.error('Error loading report data:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data laporan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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

  const handleExport = () => {
    try {
      // Prepare data for export
      const dateFilterLabel = {
        today: 'Hari Ini',
        week: '7 Hari Terakhir',
        month: '30 Hari Terakhir',
        year: '1 Tahun Terakhir',
      }[dateFilter];

      // Summary data
      const summaryData = [
        ['LAPORAN KEUANGAN'],
        ['Periode:', dateFilterLabel],
        ['Tanggal Export:', new Date().toLocaleDateString('id-ID')],
        [],
        ['RINGKASAN'],
        ['Total Penjualan', formatCurrency(stats.totalSales)],
        ['Total Pembelian', formatCurrency(stats.totalPurchases)],
        ['Laba Kotor', formatCurrency(stats.profit)],
        ['Jumlah Transaksi', stats.transactionCount],
        ['Rata-rata Transaksi', formatCurrency(stats.transactionCount > 0 ? stats.totalSales / stats.transactionCount : 0)],
        [],
      ];

      // Sales data
      const salesData = [
        ['RIWAYAT PENJUALAN'],
        ['Tanggal', 'Kasir', 'Metode Pembayaran', 'Total'],
        ...sales.map(sale => [
          formatDate(sale.created_at),
          sale.user_name,
          getPaymentMethodLabel(sale.payment_method),
          sale.total,
        ]),
        [],
      ];

      // Purchases data
      const purchasesData = [
        ['RIWAYAT PEMBELIAN'],
        ['Tanggal', 'Supplier', 'Status Pembayaran', 'Total'],
        ...purchases.map(purchase => [
          formatDate(purchase.created_at),
          purchase.supplier_name,
          purchase.payment_status === 'lunas' ? 'Lunas' : 
           purchase.payment_status === 'belum_lunas' ? 'Belum Lunas' : 'Cicilan',
          purchase.total,
        ]),
      ];

      // Combine all data
      const allData = [...summaryData, ...salesData, ...purchasesData];

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(allData);

      // Set column widths
      ws['!cols'] = [
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Keuangan');

      // Generate filename
      const filename = `Laporan_Keuangan_${dateFilterLabel.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      toast({
        title: 'Berhasil',
        description: 'Laporan berhasil diexport ke Excel',
      });
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengexport laporan',
        variant: 'destructive',
      });
    }
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Laporan Keuangan</h1>
            <p className="text-gray-600 mt-1">Lihat laporan penjualan dan keuangan toko</p>
          </div>
          <div className="flex gap-2">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hari Ini</SelectItem>
                <SelectItem value="week">7 Hari Terakhir</SelectItem>
                <SelectItem value="month">30 Hari Terakhir</SelectItem>
                <SelectItem value="year">1 Tahun Terakhir</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Penjualan
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalSales)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.transactionCount} transaksi
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Pembelian
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.totalPurchases)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {purchases.length} pembelian
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Laba Kotor
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(stats.profit)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Penjualan - Pembelian
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Rata-rata Transaksi
              </CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(stats.transactionCount > 0 ? stats.totalSales / stats.transactionCount : 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Per transaksi
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Penjualan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Kasir</TableHead>
                    <TableHead>Metode Pembayaran</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-gray-500">Belum ada transaksi penjualan</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {formatDate(sale.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>{sale.user_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getPaymentMethodLabel(sale.payment_method)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(sale.total)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Purchases Table */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Pembelian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status Pembayaran</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : purchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-gray-500">Belum ada transaksi pembelian</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {formatDate(purchase.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>{purchase.supplier_name}</TableCell>
                        <TableCell>
                          <Badge variant={purchase.payment_status === 'lunas' ? 'default' : 'secondary'}>
                            {purchase.payment_status === 'lunas' ? 'Lunas' : 
                             purchase.payment_status === 'belum_lunas' ? 'Belum Lunas' : 'Cicilan'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-red-600">
                          {formatCurrency(purchase.total)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
}