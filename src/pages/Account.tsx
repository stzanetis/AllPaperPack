import { useEffect, useState, FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function Account() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [afmNumber, setAfmNumber] = useState('');
  // Address fields (replace addressId editing)
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (profile || user) {
      setFullName(profile?.full_name ?? '');
      setEmail(user?.email ?? profile?.email ?? '');
      setPhoneNumber(profile?.phone_number ?? '');
      setCompanyName(profile?.company_name ?? '');
      setAfmNumber(profile?.afm_number ?? '');
    }

    // Load existing address if linked
    const loadAddress = async () => {
      if (profile?.address_id) {
        const { data, error } = await supabase
          .from('addresses')
          .select('country, city, street, street_number')
          .eq('id', profile.address_id)
          .single();
        if (!error && data) {
          setCountry(data.country ?? '');
          setCity(data.city ?? '');
          setStreet(data.street ?? '');
          setStreetNumber(data.street_number ?? '');
        }
      } else {
        setCountry('');
        setCity('');
        setStreet('');
        setStreetNumber('');
      }
    };
    loadAddress();
  }, [profile, user]);

  if (!loading && !user) return <Navigate to="/auth" replace />;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setErr(null);
    setMsg(null);

    try {
      // 1) Update profile basics (no raw address_id editing here)
      const { error: upErr } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          email,
          phone_number: phoneNumber || null,
          company_name: companyName || null,
          afm_number: afmNumber || null,
        })
        .eq('user_id', user.id);
      if (upErr) throw upErr;

      // 2) Upsert address (create if none, otherwise update existing)
      const hasAnyAddressInput =
        country.trim() || city.trim() || street.trim() || streetNumber.trim();

      if (hasAnyAddressInput) {
        if (profile?.address_id) {
          const { error: addrUpdateErr } = await supabase
            .from('addresses')
            .update({
              country: country || '',
              city: city || '',
              street: street || '',
              street_number: streetNumber || '',
            })
            .eq('id', profile.address_id);
          if (addrUpdateErr) throw addrUpdateErr;
        } else {
          const { data: newAddr, error: addrInsertErr } = await supabase
            .from('addresses')
            .insert({
              user_id: user.id,            // <- pass owner
              country: country || '',
              city: city || '',
              street: street || '',
              street_number: streetNumber || '',
            })
            .select('id')
            .single();
          if (addrInsertErr) throw addrInsertErr;

          // Link the new address to the profile
          const { error: linkErr } = await supabase
            .from('profiles')
            .update({ address_id: newAddr?.id })
            .eq('user_id', user.id);
          if (linkErr) throw linkErr;
        }
      }

      // 3) Change email in auth if needed (triggers confirmation)
      if (email && email !== user.email) {
        const { error: authErr } = await supabase.auth.updateUser({ email });
        if (authErr) throw authErr;
        setMsg('Στάλθηκε email επιβεβαίωσης για την αλλαγή email.');
      }

      // 4) Change password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error('Οι κωδικοί δεν ταιριάζουν.');
        }
        const { error: passErr } = await supabase.auth.updateUser({ password: newPassword });
        if (passErr) throw passErr;
        setMsg(prev => (prev ? `${prev} Ο κωδικός ενημερώθηκε.` : 'Ο κωδικός ενημερώθηκε.'));
        setNewPassword('');
        setConfirmPassword('');
      }

      if (!newPassword && (email === user.email) && !msg) {
        setMsg('Τα στοιχεία ενημερώθηκαν.');
      }

      await refreshProfile();
    } catch (e: any) {
      setErr(e.message || 'Προέκυψε σφάλμα.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-2xl md:text-3xl font-semibold mb-6">Ο λογαριασμός μου</h1>

      <form onSubmit={handleSave} className="grid gap-8 md:grid-cols-2">
        {/* Column 1: Στοιχεία προφίλ */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Στοιχεία προφίλ</h2>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="fullName">Ονοματεπώνυμο</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Π.χ. Γιάννης Παπαδόπουλος" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
              <p className="mt-1 text-xs text-muted-foreground">Η αλλαγή email απαιτεί επιβεβαίωση μέσω συνδέσμου.</p>
            </div>
            <div>
              <Label htmlFor="phone">Τηλέφωνο</Label>
              <Input id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+30 ..." />
            </div>
          </div>
        </section>

        {/* Column 2: Διεύθυνση */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Διεύθυνση</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="country">Χώρα</Label>
              <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Ελλάδα" />
            </div>
            <div>
              <Label htmlFor="city">Πόλη</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Αθήνα" />
            </div>
            <div className="md:col-span-1">
              <Label htmlFor="street">Οδός</Label>
              <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Παράδειγμα" />
            </div>
            <div className="md:col-span-1">
              <Label htmlFor="streetNumber">Αριθμός</Label>
              <Input id="streetNumber" value={streetNumber} onChange={(e) => setStreetNumber(e.target.value)} placeholder="123" />
            </div>
          </div>
        </section>

        {/* Column 1 (second row): Στοιχεία τιμολόγησης */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Στοιχεία τιμολόγησης</h2>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="company">Επωνυμία</Label>
              <Input id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Επωνυμία εταιρείας" />
            </div>
            <div>
              <Label htmlFor="afm">ΑΦΜ</Label>
              <Input id="afm" value={afmNumber} onChange={(e) => setAfmNumber(e.target.value)} placeholder="ΑΦΜ" />
            </div>
          </div>
        </section>

        {/* Column 2 (second row): Αλλαγή κωδικού */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Αλλαγή κωδικού</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="newPassword">Νέος κωδικός</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Επιβεβαίωση νέου κωδικού</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
            </div>
          </div>
        </section>

        {/* Messages spanning both columns */}
        <div className="md:col-span-2 space-y-2">
          {err && <div className="text-sm text-red-600">{err}</div>}
          {msg && <div className="text-sm text-green-600">{msg}</div>}
        </div>

        {/* Submit spanning both columns */}
        <div className="md:col-span-2">
          <Button type="submit" disabled={saving} className="w-full md:w-auto">
            {saving ? 'Αποθήκευση…' : 'Αποθήκευση'}
          </Button>
        </div>
      </form>
    </div>
  );
}