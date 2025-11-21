import { useState, useEffect } from 'react';
import OwnerLayout from '@/components/layout/OwnerLayout';
import { ShoppingCart, Plus, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/../supabase/supabase';
import { useAuth } from '@/../supabase/auth';

interface Supplier {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  purchase_price: number;
  stock: number;
}

interface PurchaseItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Purchase {
  id: string;
  supplier_id: string;
  supplier_name: string;
  total: number;
  payment_status: string;
  notes: string;
  created_at: string;
}

export default function PurchaseManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('belum_lunas');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      // Load suppliers
      const { data: suppliersData } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('tenant_id', userData.tenant_id)
        .order('name');

      setSuppliers(suppliersData || []);

      // Load products
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, purchase_price, stock')
        .eq('tenant_id', userData.tenant_id)
        .order('name');

      setProducts(productsData || []);

      // Load purchases
      await loadPurchases(userData.tenant_id);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadPurchases = async (tenantId: string) => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          id,
          supplier_id,
          suppliers(name),
          total,
          payment_status,
          notes,
          created_at
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPurchases = data?.map((p: any) => ({
        id: p.id,
        supplier_id: p.supplier_id,
        supplier_name: p.suppliers?.name || '-',
        total: p.total,
        payment_status: p.payment_status,
        notes: p.notes,
        created_at: p.created_at,
      })) || [];

      setPurchases(formattedPurchases);
    } catch (error) {
      console.error('Error loading purchases:', error);
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct || !quantity || !price) {
      toast({
        title: 'Error',
        description: 'Pilih produk, masukkan jumlah dan harga',
        variant: 'destructive',
      });
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const qty = parseInt(quantity);
    const priceNum = parseFloat(price);
    const subtotal = qty * priceNum;

    const newItem: PurchaseItem = {
      product_id: product.id,
      product_name: product.name,
      quantity: qty,
      price: priceNum,
      subtotal,
    };

    setItems([...items, newItem]);
    setSelectedProduct('');
    setQuantity('');
    setPrice('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleSavePurchase = async () => {
    if (!user || items.length === 0) {
      toast({
        title: 'Error',
        description: 'Tambahkan minimal satu item pembelian',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!userData?.tenant_id) {
        throw new Error('Tenant tidak ditemukan');
      }

      const total = calculateTotal();

      // Insert purchase
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          tenant_id: userData.tenant_id,
          supplier_id: selectedSupplier || null,
          total,
          payment_status: paymentStatus,
          notes: notes || null,
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Insert purchase items
      const purchaseItems = items.map(item => ({
        purchase_id: purchaseData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(purchaseItems);

      if (itemsError) throw itemsError;

      // Update stock for each product
      for (const item of items) {
        const { error: stockError } = await supabase.rpc('increment_stock', {
          product_id: item.product_id,
          qty: item.quantity,
        });

        if (stockError) {
          // If RPC doesn't exist, update manually
          const product = products.find(p => p.id === item.product_id);
          if (product) {
            await supabase
              .from('products')
              .update({ stock: product.stock + item.quantity })
              .eq('id', item.product_id);
          }
        }
      }

      toast({
        title: 'Berhasil',
        description: 'Pembelian berhasil disimpan dan stok diperbarui',
      });

      // Reset form
      setSelectedSupplier('');
      setItems([]);
      setPaymentStatus('belum_lunas');
      setNotes('');
      
      // Reload data
      loadData();
    } catch (error) {
      console.error('Error saving purchase:', error);
      toast({
        title: 'Error',
        description: 'Gagal menyimpan pembelian',
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      lunas: 'default',
      belum_lunas: 'secondary',
      cicilan: 'destructive',
    };

    const labels: Record<string, string> = {
      lunas: 'Lunas',
      belum_lunas: 'Belum Lunas',
      cicilan: 'Cicilan',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Pembelian</h1>
          <p className="text-gray-600 mt-1">Kelola pembelian barang dari supplier</p>
        </div>

        <Tabs defaultValue="form" className="space-y-4">
          <TabsList>
            <TabsTrigger value="form">Form Pembelian</TabsTrigger>
            <TabsTrigger value="history">Riwayat Pembelian</TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Buat Pembelian Baru</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Supplier (Opsional)</Label>
                    <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status Pembayaran</Label>
                    <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lunas">Lunas</SelectItem>
                        <SelectItem value="belum_lunas">Belum Lunas</SelectItem>
                        <SelectItem value="cicilan">Cicilan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Catatan pembelian (opsional)"
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Tambah Item</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Select value={selectedProduct} onValueChange={(value) => {
                      setSelectedProduct(value);
                      const product = products.find(p => p.id === value);
                      if (product) {
                        setPrice(product.purchase_price.toString());
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih produk" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      placeholder="Jumlah"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />

                    <Input
                      type="number"
                      placeholder="Harga"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />

                    <Button onClick={handleAddItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah
                    </Button>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produk</TableHead>
                          <TableHead className="text-right">Jumlah</TableHead>
                          <TableHead className="text-right">Harga</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.product_name}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-bold">
                            Total
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatCurrency(calculateTotal())}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedSupplier('');
                      setItems([]);
                      setPaymentStatus('belum_lunas');
                      setNotes('');
                    }}
                  >
                    Reset
                  </Button>
                  <Button onClick={handleSavePurchase} disabled={loading || items.length === 0}>
                    {loading ? 'Menyimpan...' : 'Simpan Pembelian'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
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
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Catatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                            <p className="text-gray-500">Belum ada riwayat pembelian</p>
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
                            <TableCell className="text-right font-medium">
                              {formatCurrency(purchase.total)}
                            </TableCell>
                            <TableCell>{getStatusBadge(purchase.payment_status)}</TableCell>
                            <TableCell className="text-gray-600">
                              {purchase.notes || '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </OwnerLayout>
  );
}