import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/../supabase/supabase';
import { useAuth } from '@/../supabase/auth';
import { useToast } from '@/components/ui/use-toast';

interface Product {
  id: string;
  name: string;
  barcode: string | null;
  price: number;
  purchase_price: number;
  sell_price: number;
  stock: number;
  min_stock: number;
  photo_url: string | null;
}

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  barcode: string;
  purchase_price: string;
  sell_price: string;
  stock: string;
  min_stock: string;
}

export default function ProductDialog({ open, onOpenChange, product, onSuccess }: ProductDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        barcode: product.barcode || '',
        purchase_price: product.purchase_price?.toString() || '',
        sell_price: product.sell_price?.toString() || '',
        stock: product.stock.toString(),
        min_stock: product.min_stock.toString(),
      });
    } else {
      reset({
        name: '',
        barcode: '',
        purchase_price: '',
        sell_price: '',
        stock: '0',
        min_stock: '5',
      });
    }
  }, [product, reset]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      console.log('User data:', userData, 'Error:', userError);

      if (!userData?.tenant_id) {
        toast({
          title: 'Error',
          description: 'Tenant tidak ditemukan. Silakan hubungi administrator.',
          variant: 'destructive',
        });
        return;
      }

      const productData = {
        name: data.name,
        barcode: data.barcode || null,
        purchase_price: parseFloat(data.purchase_price),
        sell_price: parseFloat(data.sell_price),
        price: parseFloat(data.sell_price),
        stock: parseInt(data.stock),
        min_stock: parseInt(data.min_stock),
        tenant_id: userData.tenant_id,
      };

      if (product) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);
        
        if (error) throw error;

        toast({
          title: 'Berhasil',
          description: 'Produk berhasil diperbarui',
        });
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);
        
        if (error) throw error;

        toast({
          title: 'Berhasil',
          description: 'Produk berhasil ditambahkan',
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal menyimpan produk',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {product ? 'Edit Produk' : 'Tambah Produk Baru'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Produk *</Label>
            <Input
              id="name"
              {...register('name', { required: 'Nama produk wajib diisi' })}
              placeholder="Contoh: Indomie Goreng"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode</Label>
            <Input
              id="barcode"
              {...register('barcode')}
              placeholder="Masukkan barcode produk"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_price">Harga Beli (Rp) *</Label>
              <Input
                id="purchase_price"
                type="number"
                step="0.01"
                {...register('purchase_price', { required: 'Harga beli wajib diisi' })}
                placeholder="0"
              />
              {errors.purchase_price && (
                <p className="text-sm text-red-600">{errors.purchase_price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sell_price">Harga Jual (Rp) *</Label>
              <Input
                id="sell_price"
                type="number"
                step="0.01"
                {...register('sell_price', { required: 'Harga jual wajib diisi' })}
                placeholder="0"
              />
              {errors.sell_price && (
                <p className="text-sm text-red-600">{errors.sell_price.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Stok *</Label>
              <Input
                id="stock"
                type="number"
                {...register('stock', { required: 'Stok wajib diisi' })}
                placeholder="0"
              />
              {errors.stock && (
                <p className="text-sm text-red-600">{errors.stock.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_stock">Stok Minimum *</Label>
              <Input
                id="min_stock"
                type="number"
                {...register('min_stock', { required: 'Stok minimum wajib diisi' })}
                placeholder="5"
              />
              {errors.min_stock && (
                <p className="text-sm text-red-600">{errors.min_stock.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Menyimpan...' : product ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}