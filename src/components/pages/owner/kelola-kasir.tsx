import { useState, useEffect } from 'react';
import OwnerLayout from '@/components/layout/OwnerLayout';
import { Users, Plus, Trash2, Mail, Lock, User, Eye, EyeOff, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/../supabase/supabase';
import { useAuth } from '@/../supabase/auth';

interface Employee {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  position: string;
  status: string;
  hired_date: string;
  created_at: string;
}

export default function ManageCashiersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    loadEmployees();
  }, [user]);

  const loadEmployees = async () => {
    if (!user) return;

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .eq('position', 'kasir')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading employees:', error);
        throw error;
      }
      
      console.log('Loaded employees:', data);
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data kasir',
        variant: 'destructive',
      });
    }
  };

  const handleAddCashier = async () => {
    if (!formData.full_name || !formData.email || !formData.password) {
      toast({
        title: 'Error',
        description: 'Nama, email, dan password harus diisi',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password minimal 6 karakter',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: ownerData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('user_id', user?.id)
        .single();

      if (!ownerData?.tenant_id) {
        throw new Error('Tenant tidak ditemukan');
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: 'kasir',
            tenant_id: ownerData.tenant_id,
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Gagal membuat user');
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          role: 'kasir',
          tenant_id: ownerData.tenant_id,
          full_name: formData.full_name,
        })
        .eq('user_id', authData.user.id);

      if (updateError) {
        console.error('Error updating user role:', updateError);
      }

      const { error: employeeError } = await supabase
        .from('employees')
        .insert({
          tenant_id: ownerData.tenant_id,
          user_id: authData.user.id,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || null,
          address: formData.address || null,
          position: 'kasir',
          status: 'active',
        });

      if (employeeError) {
        console.error('Error creating employee:', employeeError);
        throw employeeError;
      }

      toast({
        title: 'Berhasil',
        description: 'Kasir berhasil ditambahkan',
      });

      setDialogOpen(false);
      setFormData({ full_name: '', email: '', password: '', phone: '', address: '' });
      loadEmployees();
    } catch (error: any) {
      console.error('Error adding cashier:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menambahkan kasir',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCashier = async (employeeId: string, userId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kasir ini?')) return;

    setLoading(true);
    try {
      const { error: employeeError } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId);

      if (employeeError) throw employeeError;

      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('user_id', userId);

      if (userError) {
        console.error('Error deleting user:', userError);
      }

      toast({
        title: 'Berhasil',
        description: 'Kasir berhasil dihapus',
      });

      loadEmployees();
    } catch (error: any) {
      console.error('Error deleting cashier:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus kasir',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kelola Kasir</h1>
            <p className="text-gray-600 mt-1">Tambah dan kelola akun kasir untuk toko Anda</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Kasir
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Daftar Kasir ({employees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {employees.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500 mb-4">Belum ada kasir yang ditambahkan</p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Kasir Pertama
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Tanggal Bergabung</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        {employee.full_name}
                      </TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.phone || '-'}</TableCell>
                      <TableCell>{formatDate(employee.hired_date)}</TableCell>
                      <TableCell>
                        <Badge variant={employee.status === 'active' ? 'secondary' : 'destructive'}>
                          {employee.status === 'active' ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCashier(employee.id, employee.user_id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Kasir Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nama Lengkap *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="full_name"
                  placeholder="Nama lengkap kasir"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-gray-500">
                Email ini akan digunakan untuk login kasir
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 6 karakter"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="address"
                  placeholder="Alamat lengkap"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddCashier} disabled={loading}>
              {loading ? 'Menambahkan...' : 'Tambah Kasir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OwnerLayout>
  );
}
