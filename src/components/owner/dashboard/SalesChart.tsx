import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/../supabase/supabase';
import { useAuth } from '@/../supabase/auth';

interface SalesData {
  date: string;
  total: number;
}

export default function SalesChart() {
  const { user } = useAuth();
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSalesData();
  }, [user]);

  const loadSalesData = async () => {
    if (!user) return;

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date;
      });

      const salesByDay = await Promise.all(
        last7Days.map(async (date) => {
          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);

          const { data } = await supabase
            .from('sales')
            .select('total')
            .eq('tenant_id', userData.tenant_id)
            .gte('created_at', startOfDay.toISOString())
            .lte('created_at', endOfDay.toISOString());

          const total = data?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;

          return {
            date: date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
            total
          };
        })
      );

      setSalesData(salesByDay);
    } catch (error) {
      console.error('Error loading sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxValue = Math.max(...salesData.map(d => d.total), 1);

  if (loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Grafik Penjualan 7 Hari Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Memuat data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Grafik Penjualan 7 Hari Terakhir</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-end justify-between gap-2">
          {salesData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center justify-end h-48">
                <div className="text-xs font-medium text-gray-600 mb-1">
                  {new Intl.NumberFormat('id-ID', {
                    notation: 'compact',
                    compactDisplay: 'short'
                  }).format(data.total)}
                </div>
                <div
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-500"
                  style={{
                    height: `${(data.total / maxValue) * 100}%`,
                    minHeight: data.total > 0 ? '8px' : '0px'
                  }}
                />
              </div>
              <div className="text-xs text-gray-600 text-center">{data.date}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
