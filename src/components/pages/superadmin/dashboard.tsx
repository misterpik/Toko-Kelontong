import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, Users, TrendingUp, Plus, Edit, Trash2, Power, PowerOff, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/../supabase/supabase';
import { useAuth } from '@/../supabase/auth';

interface Tenant {
  id: string;
  name: string;
  owner_name: string;
  owner_email: string;
  status: string;
  created_at: string;
}

interface Stats {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
}

export default function SuperAdminDashboard() {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalTenants: 0,
    activeTenants: 0,
    inactiveTenants: 0,
  });
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    owner_name: '',
    owner_email: '',
  });

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      // Use RPC function to get tenants with owner info (bypasses RLS)
      const { data, error } = await supabase
        .rpc('get_tenants_with_owners');

      if (error) throw error;

      // Transform data to match Tenant interface
      const tenantsWithOwners = data?.map((row: any) => ({
        id: row.tenant_id,
        name: row.tenant_name,
        status: row.tenant_status,
        subdomain: row.tenant_subdomain,
        created_at: row.tenant_created_at,
        updated_at: row.tenant_updated_at,
        owner_name: row.owner_name || '-',
        owner_email: row.owner_email || '-',
      })) || [];

      setTenants(tenantsWithOwners);
      
      const active = tenantsWithOwners.filter(t => t.status === 'active').length;
      const inactive = tenantsWithOwners.filter(t => t.status === 'inactive').length;
      
      setStats({
        totalTenants: tenantsWithOwners.length,
        activeTenants: active,
        inactiveTenants: inactive,
      });
    } catch (error: any) {
      console.error('Error loading tenants:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal memuat data tenant',
        variant: 'destructive',
      });
    }
  };

  const handleAddTenant = async () => {
    if (!formData.name) {
      toast({
        title: 'Error',
        description: 'Nama toko harus diisi',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Only insert tenant data (owner info will be added when owner signs up)
      const { error } = await supabase
        .from('tenants')
        .insert({
          name: formData.name,
          status: 'active',
        });

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Tenant berhasil ditambahkan. Owner dapat mendaftar menggunakan email mereka.',
      });

      setDialogOpen(false);
      setFormData({ name: '', owner_name: '', owner_email: '' });
      loadTenants();
    } catch (error: any) {
      console.error('Error adding tenant:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menambahkan tenant',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTenant = async () => {
    if (!editingTenant) return;

    setLoading(true);
    try {
      // Only update tenant name (owner info is in users table)
      const { error } = await supabase
        .from('tenants')
        .update({
          name: formData.name,
        })
        .eq('id', editingTenant.id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Tenant berhasil diupdate',
      });

      setDialogOpen(false);
      setEditingTenant(null);
      setFormData({ name: '', owner_name: '', owner_email: '' });
      loadTenants();
    } catch (error: any) {
      console.error('Error updating tenant:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal mengupdate tenant',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (tenant: Tenant) => {
    const newStatus = tenant.status === 'active' ? 'inactive' : 'active';
    
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ status: newStatus })
        .eq('id', tenant.id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: `Tenant berhasil ${newStatus === 'active' ? 'diaktifkan' : 'dinonaktifkan'}`,
      });

      loadTenants();
    } catch (error: any) {
      console.error('Error toggling tenant status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal mengubah status tenant',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tenant ini? Semua data terkait akan dihapus.')) return;

    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantId);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Tenant berhasil dihapus',
      });

      loadTenants();
    } catch (error: any) {
      console.error('Error deleting tenant:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus tenant',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      owner_name: tenant.owner_name,
      owner_email: tenant.owner_email,
    });
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingTenant(null);
    setFormData({ name: '', owner_name: '', owner_email: '' });
    setDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Kelola semua tenant dan monitoring sistem</p>
            </div>
            <Button variant="outline" size="lg" onClick={signOut}>
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Tenant
                </CardTitle>
                <Store className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalTenants}
                </div>
                <p className="text-xs text-gray-500 mt-1">Semua tenant terdaftar</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Tenant Aktif
                </CardTitle>
                <Power className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.activeTenants}
                </div>
                <p className="text-xs text-gray-500 mt-1">Sedang beroperasi</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Tenant Nonaktif
                </CardTitle>
                <PowerOff className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.inactiveTenants}
                </div>
                <p className="text-xs text-gray-500 mt-1">Tidak beroperasi</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Daftar Tenant ({tenants.length})
                </CardTitle>
                <Button onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Tenant
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tenants.length === 0 ? (
                <div className="text-center py-12">
                  <Store className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500 mb-4">Belum ada tenant yang terdaftar</p>
                  <Button onClick={openAddDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Tenant Pertama
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Toko</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tanggal Daftar</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">
                          {tenant.name}
                        </TableCell>
                        <TableCell>{tenant.owner_name}</TableCell>
                        <TableCell>{tenant.owner_email}</TableCell>
                        <TableCell>{formatDate(tenant.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant={tenant.status === 'active' ? 'secondary' : 'destructive'}>
                            {tenant.status === 'active' ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(tenant)}
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(tenant)}
                            >
                              {tenant.status === 'active' ? (
                                <PowerOff className="h-4 w-4 text-orange-600" />
                              ) : (
                                <Power className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTenant(tenant.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTenant ? 'Edit Tenant' : 'Tambah Tenant Baru'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Toko *</Label>
              <Input
                id="name"
                placeholder="Nama toko"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {!editingTenant && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Info:</strong> Setelah tenant dibuat, owner dapat mendaftar menggunakan halaman signup dan memilih tenant ini.
                </p>
              </div>
            )}

            {editingTenant && (
              <div className="space-y-2">
                <Label className="text-gray-600">Owner Saat Ini</Label>
                <div className="bg-gray-50 border rounded-lg p-3 space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Nama:</span> {editingTenant.owner_name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Email:</span> {editingTenant.owner_email}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Info owner tidak dapat diubah di sini. Owner dapat mengupdate profil mereka sendiri.
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={editingTenant ? handleUpdateTenant : handleAddTenant} 
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : editingTenant ? 'Update' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
