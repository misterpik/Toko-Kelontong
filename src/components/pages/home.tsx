import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRight, Settings, User, Store, Package, TrendingUp, BarChart3 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/../supabase/auth";

export default function LandingPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Navigation */}
      <header className="fixed top-0 z-50 w-full bg-[rgba(255,255,255,0.8)] backdrop-blur-md border-b border-[#f5f5f7]/30">
        <div className="max-w-[980px] mx-auto flex h-12 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-blue-600" />
            <Link to="/" className="font-medium text-xl">
              Toko Kelontong
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/owner/dashboard">
                  <Button variant="ghost" className="text-sm font-light hover:text-gray-500">Dashboard</Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="h-8 w-8 hover:cursor-pointer">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                        alt={user.email || ""}
                      />
                      <AvatarFallback>
                        {user.email?.[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl border-none shadow-lg">
                    <DropdownMenuLabel className="text-xs text-gray-500">{user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/owner/pengaturan')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Pengaturan
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer" onSelect={() => signOut()}>
                      Keluar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-sm font-light hover:text-gray-500">Masuk</Button>
                </Link>
                <Link to="/signup">
                  <Button className="rounded-full bg-blue-600 text-white hover:bg-blue-700 text-sm px-4">Mulai Sekarang</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-12">
        {/* Hero section */}
        <section className="py-20 text-center">
          <h2 className="text-5xl font-semibold tracking-tight mb-1">Sistem Manajemen Toko Kelontong</h2>
          <h3 className="text-2xl font-medium text-gray-500 mb-4">Kelola inventori, penjualan, dan laporan dengan mudah</h3>
          <div className="flex justify-center space-x-6 text-xl text-blue-600">
            <Link to="/signup" className="flex items-center hover:underline">Mulai Gratis <ChevronRight className="h-4 w-4" /></Link>
          </div>
        </section>

        {/* Features section */}
        <section className="py-20 bg-[#f5f5f7] text-center">
          <h2 className="text-5xl font-semibold tracking-tight mb-1">Fitur Lengkap</h2>
          <h3 className="text-2xl font-medium text-gray-500 mb-4">Semua yang Anda butuhkan untuk mengelola toko</h3>
          <div className="mt-8 max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm text-left">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-xl font-medium mb-2">Manajemen Stok</h4>
              <p className="text-gray-500">Kelola inventori produk dengan mudah, tracking stok real-time, dan notifikasi stok menipis.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm text-left">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="text-xl font-medium mb-2">Sistem Kasir (POS)</h4>
              <p className="text-gray-500">Interface kasir yang cepat dan intuitif dengan dukungan berbagai metode pembayaran.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm text-left">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="text-xl font-medium mb-2">Laporan Keuangan</h4>
              <p className="text-gray-500">Analisis penjualan dengan grafik interaktif dan export laporan ke Excel/PDF.</p>
            </div>
          </div>
        </section>

        {/* Grid section for other features */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
          <div className="bg-[#f5f5f7] rounded-3xl p-12 text-center">
            <h2 className="text-4xl font-semibold tracking-tight mb-1">Dashboard Real-time</h2>
            <h3 className="text-xl font-medium text-gray-500 mb-4">Pantau bisnis Anda setiap saat</h3>
            <div className="flex justify-center space-x-6 text-lg text-blue-600">
              <Link to="/signup" className="flex items-center hover:underline">Coba Sekarang <ChevronRight className="h-4 w-4" /></Link>
            </div>
            <div className="mt-4 bg-white p-6 rounded-xl shadow-sm max-w-sm mx-auto">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Penjualan</span>
                  <span className="text-lg font-bold text-green-600">Rp 2.5jt</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Transaksi Hari Ini</span>
                  <span className="text-lg font-bold text-blue-600">45</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Stok Menipis</span>
                  <span className="text-lg font-bold text-orange-600">8</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#f5f5f7] rounded-3xl p-12 text-center">
            <h2 className="text-4xl font-semibold tracking-tight mb-1">Multi-Tenant</h2>
            <h3 className="text-xl font-medium text-gray-500 mb-4">Kelola multiple toko dalam satu platform</h3>
            <div className="flex justify-center space-x-6 text-lg text-blue-600">
              <Link to="/signup" className="flex items-center hover:underline">Pelajari Lebih Lanjut <ChevronRight className="h-4 w-4" /></Link>
            </div>
            <div className="mt-4 bg-white p-6 rounded-xl shadow-sm max-w-sm mx-auto text-left">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Store className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">Toko Cabang A</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Store className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium">Toko Cabang B</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Store className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium">Toko Cabang C</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#f5f5f7] py-12 text-xs text-gray-500">
        <div className="max-w-[980px] mx-auto px-4">
          <div className="border-b border-gray-300 pb-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-medium text-sm text-gray-900 mb-4">Produk</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="hover:underline">Fitur</Link></li>
                <li><Link to="/" className="hover:underline">Harga</Link></li>
                <li><Link to="/" className="hover:underline">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-900 mb-4">Dukungan</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="hover:underline">Dokumentasi</Link></li>
                <li><Link to="/" className="hover:underline">Tutorial</Link></li>
                <li><Link to="/" className="hover:underline">Kontak</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-900 mb-4">Perusahaan</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="hover:underline">Tentang Kami</Link></li>
                <li><Link to="/" className="hover:underline">Blog</Link></li>
                <li><Link to="/" className="hover:underline">Karir</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="hover:underline">Privasi</Link></li>
                <li><Link to="/" className="hover:underline">Syarat & Ketentuan</Link></li>
              </ul>
            </div>
          </div>
          <div className="py-4">
            <p>Copyright © 2025 Toko Kelontong. Hak cipta dilindungi.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}