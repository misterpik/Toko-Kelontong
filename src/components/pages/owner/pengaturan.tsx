import { useState, useEffect } from 'react';
import OwnerLayout from '@/components/layout/OwnerLayout';
import { User, Store, Lock, Save, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/../supabase/supabase';
import { useAuth } from '@/../supabase/auth';

interface UserProfile {
  full_name: string;
  email: string;
  phone: string | null;
}

interface TenantInfo {
  name: string;
  subdomain: string | null;
  address: string | null;
  phone: string | null;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    full_name: '',
    email: '',
    phone: '',
  });

  const [tenantInfo, setTenantInfo] = useState<TenantInfo>({
    name: '',
    subdomain: '',
    address: '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      // Load user profile
      const { data: userData } = await supabase
        .from('users')
        .select('full_name, email, tenant_id')
        .eq('user_id', user.id)
        .single();

      if (userData) {
        setUserProfile({
          full_name: userData.full_name || '',
          email: userData.email || user.email || '',
          phone: '',
        });
        setTenantId(userData.tenant_id);

        // Load tenant info
        if (userData.tenant_id) {
          const { data: tenantData } = await supabase
            .from('tenants')
            .select('name, subdomain')
            .eq('id', userData.tenant_id)
            .single();

          if (tenantData) {
            setTenantInfo({
              name: tenantData.name || '',
              subdomain: tenantData.subdomain || '',
              address: '',
              phone: '',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: userProfile.full_name,
          email: userProfile.email,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Profil berhasil diperbarui',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Gagal memperbarui profil',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTenant = async () => {
    if (!user || !tenantId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name: tenantInfo.name,
          subdomain: tenantInfo.subdomain || null,
        })
        .eq('id', tenantId);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Informasi toko berhasil diperbarui',
      });
    } catch (error) {
      console.error('Error saving tenant:', error);
      toast({
        title: 'Error',
        description: 'Gagal memperbarui informasi toko',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Masukkan password baru dan konfirmasi',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Password baru dan konfirmasi tidak cocok',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password minimal 6 karakter',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Password berhasil diubah',
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengubah password',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
          <p className="text-gray-600 mt-1">Kelola pengaturan toko dan akun Anda</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="store">
              <Store className="h-4 w-4 mr-2" />
              Toko
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="h-4 w-4 mr-2" />
              Keamanan
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Profil</CardTitle>
                <CardDescription>
                  Perbarui informasi profil dan email Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nama Lengkap</Label>
                  <Input
                    id="full_name"
                    value={userProfile.full_name}
                    onChange={(e) =>
                      setUserProfile({ ...userProfile, full_name: e.target.value })
                    }
                    placeholder="Nama lengkap Anda"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={userProfile.email}
                      onChange={(e) =>
                        setUserProfile({ ...userProfile, email: e.target.value })
                      }
                      placeholder="email@example.com"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={userProfile.phone || ''}
                      onChange={(e) =>
                        setUserProfile({ ...userProfile, phone: e.target.value })
                      }
                      placeholder="08xxxxxxxxxx"
                      className="pl-10"
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Store Tab */}
          <TabsContent value="store">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Toko</CardTitle>
                <CardDescription>
                  Kelola informasi dan pengaturan toko Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="store_name">Nama Toko</Label>
                  <Input
                    id="store_name"
                    value={tenantInfo.name}
                    onChange={(e) =>
                      setTenantInfo({ ...tenantInfo, name: e.target.value })
                    }
                    placeholder="Nama toko Anda"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <Input
                    id="subdomain"
                    value={tenantInfo.subdomain || ''}
                    onChange={(e) =>
                      setTenantInfo({ ...tenantInfo, subdomain: e.target.value })
                    }
                    placeholder="nama-toko"
                  />
                  <p className="text-xs text-gray-500">
                    URL toko Anda akan menjadi: {tenantInfo.subdomain || 'nama-toko'}.domain.com
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="store_phone">Telepon Toko</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="store_phone"
                      type="tel"
                      value={tenantInfo.phone || ''}
                      onChange={(e) =>
                        setTenantInfo({ ...tenantInfo, phone: e.target.value })
                      }
                      placeholder="Nomor telepon toko"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Alamat Toko</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="address"
                      value={tenantInfo.address || ''}
                      onChange={(e) =>
                        setTenantInfo({ ...tenantInfo, address: e.target.value })
                      }
                      placeholder="Alamat lengkap toko"
                      className="pl-10"
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button onClick={handleSaveTenant} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Ubah Password</CardTitle>
                <CardDescription>
                  Perbarui password Anda untuk keamanan akun
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Password Saat Ini</Label>
                  <Input
                    id="current_password"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    placeholder="Masukkan password saat ini"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_password">Password Baru</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    placeholder="Masukkan password baru (min. 6 karakter)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Konfirmasi Password Baru</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    placeholder="Konfirmasi password baru"
                  />
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button onClick={handleChangePassword} disabled={loading}>
                    <Lock className="h-4 w-4 mr-2" />
                    {loading ? 'Mengubah...' : 'Ubah Password'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </OwnerLayout>
  );
}