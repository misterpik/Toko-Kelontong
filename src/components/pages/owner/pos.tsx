import { useState, useEffect } from 'react';
import OwnerLayout from '@/components/layout/OwnerLayout';
import { ShoppingCart, Search, Trash2, Plus, Minus, CreditCard, Smartphone, Banknote, Printer, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/../supabase/supabase';
import { useAuth } from '@/../supabase/auth';

interface Product {
  id: string;
  name: string;
  barcode: string | null;
  sell_price: number;
  stock: number;
}

interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  stock: number;
}

export default function POSPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'ewallet'>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, [user]);

  const loadProducts = async () => {
    if (!user) return;

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      const { data, error } = await supabase
        .from('products')
        .select('id, name, barcode, sell_price, stock')
        .eq('tenant_id', userData.tenant_id)
        .gt('stock', 0)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleAddToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product_id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast({
          title: 'Stok Tidak Cukup',
          description: `Stok ${product.name} hanya tersisa ${product.stock}`,
          variant: 'destructive',
        });
        return;
      }

      setCart(cart.map(item =>
        item.product_id === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              subtotal: (item.quantity + 1) * item.price,
            }
          : item
      ));
    } else {
      const newItem: CartItem = {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        price: product.sell_price,
        subtotal: product.sell_price,
        stock: product.stock,
      };
      setCart([...cart, newItem]);
    }

    setSearchQuery('');
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return item;
        if (newQuantity > item.stock) {
          toast({
            title: 'Stok Tidak Cukup',
            description: `Stok hanya tersisa ${item.stock}`,
            variant: 'destructive',
          });
          return item;
        }
        return {
          ...item,
          quantity: newQuantity,
          subtotal: newQuantity * item.price,
        };
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateChange = () => {
    if (paymentMethod !== 'cash') return 0;
    const received = parseFloat(cashReceived) || 0;
    const total = calculateTotal();
    return Math.max(0, received - total);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: 'Keranjang Kosong',
        description: 'Tambahkan produk ke keranjang terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }
    setCheckoutDialogOpen(true);
  };

  const handleProcessPayment = async () => {
    if (!user) return;

    if (paymentMethod === 'cash') {
      const received = parseFloat(cashReceived) || 0;
      const total = calculateTotal();
      if (received < total) {
        toast({
          title: 'Pembayaran Kurang',
          description: 'Jumlah uang yang diterima kurang dari total',
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id, id')
        .eq('user_id', user.id)
        .single();

      if (!userData?.tenant_id) {
        throw new Error('Tenant tidak ditemukan');
      }

      const total = calculateTotal();
      const received = paymentMethod === 'cash' ? parseFloat(cashReceived) : total;
      const change = paymentMethod === 'cash' ? calculateChange() : 0;

      // Insert sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          tenant_id: userData.tenant_id,
          user_id: userData.id,
          total,
          payment_method: paymentMethod,
          payment_received: received,
          change_amount: change,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Insert sale items
      const saleItems = cart.map(item => ({
        sale_id: saleData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update stock for each product
      for (const item of cart) {
        const product = products.find(p => p.id === item.product_id);
        if (product) {
          await supabase
            .from('products')
            .update({ stock: product.stock - item.quantity })
            .eq('id', item.product_id);
        }
      }

      toast({
        title: 'Transaksi Berhasil',
        description: 'Penjualan berhasil disimpan',
      });

      setLastSaleId(saleData.id);
      setCheckoutDialogOpen(false);
      setReceiptDialogOpen(true);

      // Reset
      setCart([]);
      setPaymentMethod('cash');
      setCashReceived('');
      loadProducts();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: 'Error',
        description: 'Gagal memproses pembayaran',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    toast({
      title: 'Cetak Struk',
      description: 'Fitur cetak struk sedang dalam pengembangan',
    });
    setReceiptDialogOpen(false);
  };

  const handleSendWhatsApp = () => {
    toast({
      title: 'Kirim WhatsApp',
      description: 'Fitur kirim struk via WhatsApp sedang dalam pengembangan',
    });
    setReceiptDialogOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kasir (POS)</h1>
          <p className="text-gray-600 mt-1">Sistem Point of Sale untuk transaksi penjualan</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Search & List */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cari Produk</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari nama produk atau scan barcode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {searchQuery && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <div className="col-span-2 text-center py-8 text-gray-500">
                        Produk tidak ditemukan
                      </div>
                    ) : (
                      filteredProducts.map((product) => (
                        <Card
                          key={product.id}
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleAddToCart(product)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{product.name}</h3>
                                {product.barcode && (
                                  <p className="text-xs text-gray-500">{product.barcode}</p>
                                )}
                                <p className="text-sm text-green-600 font-semibold mt-1">
                                  {formatCurrency(product.sell_price)}
                                </p>
                              </div>
                              <Badge variant={product.stock < 10 ? 'destructive' : 'secondary'}>
                                Stok: {product.stock}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cart */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Keranjang ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>Keranjang kosong</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.product_id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{item.product_name}</h4>
                              <p className="text-xs text-gray-500">
                                {formatCurrency(item.price)} x {item.quantity}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFromCart(item.product_id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateQuantity(item.product_id, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateQuantity(item.product_id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-green-600">{formatCurrency(calculateTotal())}</span>
                      </div>
                      <Button className="w-full" size="lg" onClick={handleCheckout}>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Checkout
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proses Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Pembayaran</span>
                <span className="text-green-600">{formatCurrency(calculateTotal())}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('cash')}
                  className="flex flex-col h-auto py-3"
                >
                  <Banknote className="h-6 w-6 mb-1" />
                  <span className="text-xs">Tunai</span>
                </Button>
                <Button
                  variant={paymentMethod === 'qris' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('qris')}
                  className="flex flex-col h-auto py-3"
                >
                  <CreditCard className="h-6 w-6 mb-1" />
                  <span className="text-xs">QRIS</span>
                </Button>
                <Button
                  variant={paymentMethod === 'ewallet' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('ewallet')}
                  className="flex flex-col h-auto py-3"
                >
                  <Smartphone className="h-6 w-6 mb-1" />
                  <span className="text-xs">E-Wallet</span>
                </Button>
              </div>
            </div>

            {paymentMethod === 'cash' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cash_received">Uang Diterima</Label>
                  <Input
                    id="cash_received"
                    type="number"
                    placeholder="0"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                  />
                </div>

                {cashReceived && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span className="font-medium">Kembalian</span>
                      <span className="font-bold text-blue-600">
                        {formatCurrency(calculateChange())}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {paymentMethod === 'qris' && (
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">
                  Tampilkan QR Code untuk pembayaran QRIS
                </p>
              </div>
            )}

            {paymentMethod === 'ewallet' && (
              <div className="space-y-2">
                <Label>Pilih E-Wallet</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih e-wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gopay">GoPay</SelectItem>
                    <SelectItem value="ovo">OVO</SelectItem>
                    <SelectItem value="dana">DANA</SelectItem>
                    <SelectItem value="shopeepay">ShopeePay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleProcessPayment} disabled={loading}>
              {loading ? 'Memproses...' : 'Konfirmasi Pembayaran'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaksi Berhasil!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-green-600 font-bold text-2xl mb-2">
                {formatCurrency(calculateTotal())}
              </div>
              <p className="text-sm text-gray-600">Pembayaran berhasil diproses</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Pilih opsi struk:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={handlePrintReceipt}>
                  <Printer className="h-4 w-4 mr-2" />
                  Cetak Struk
                </Button>
                <Button variant="outline" onClick={handleSendWhatsApp}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Kirim WhatsApp
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setReceiptDialogOpen(false)} className="w-full">
              Selesai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OwnerLayout>
  );
}
