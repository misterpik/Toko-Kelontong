import OwnerLayout from '@/components/layout/OwnerLayout';
import OwnerDashboardStats from '@/components/owner/dashboard/OwnerDashboardStats';
import SalesChart from '@/components/owner/dashboard/SalesChart';
import LowStockList from '@/components/owner/dashboard/LowStockList';
import RecentTransactions from '@/components/owner/dashboard/RecentTransactions';

export default function OwnerDashboard() {
  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Selamat datang kembali! Berikut ringkasan bisnis Anda hari ini.</p>
        </div>

        {/* Stats Cards */}
        <OwnerDashboardStats />

        {/* Charts and Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2">
            <SalesChart />
          </div>
          <LowStockList />
          <RecentTransactions />
        </div>
      </div>
    </OwnerLayout>
  );
}
