import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface PickupLocation {
  id: number;
  name: string;
  owner_full_name: string;
  owner_phone_number: string;
  working_hours: string;
  number_of_packages: number;
  package_capacity: number;
  country: string;
  city: string;
  street: string;
  number: string;
  zip: string;
}

export const PickupLocationManagement = () => {
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<PickupLocation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    owner_full_name: '',
    owner_phone_number: '',
    working_hours: '',
    package_capacity: 0,
    country: '',
    city: '',
    street: '',
    number: '',
    zip: '',
  });

  const fetchPickupLocations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pickup_locations')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching pickup locations:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία φόρτωσης σημείων παραλαβής",
        variant: "destructive",
      });
    } else {
      setPickupLocations(data || []);
    }
    setLoading(false);
  };

  const handleAddLocation = () => {
    setEditingLocation(null);
    setFormData({
      name: '',
      owner_full_name: '',
      owner_phone_number: '',
      working_hours: '',
      package_capacity: 0,
      country: '',
      city: '',
      street: '',
      number: '',
      zip: '',
    });
    setDialogOpen(true);
  };

  const handleEditLocation = (location: PickupLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      owner_full_name: location.owner_full_name,
      owner_phone_number: location.owner_phone_number,
      working_hours: location.working_hours,
      package_capacity: location.package_capacity,
      country: location.country,
      city: location.city,
      street: location.street,
      number: location.number,
      zip: location.zip,
    });
    setDialogOpen(true);
  };

  const handleSaveLocation = async () => {
    setLoading(true);
    try {
      if (editingLocation) {
        const { error } = await supabase
          .from('pickup_locations')
          .update(formData)
          .eq('id', editingLocation.id);

        if (error) throw error;
        toast({
          title: "Επιτυχία",
          description: "Το σημείο παραλαβής ενημερώθηκε",
        });
      } else {
        const { error } = await supabase
          .from('pickup_locations')
          .insert([formData]);

        if (error) throw error;
        toast({
          title: "Επιτυχία",
          description: "Το σημείο παραλαβής προστέθηκε",
        });
      }
      setDialogOpen(false);
      fetchPickupLocations();
    } catch (error: any) {
      console.error('Error saving pickup location:', error);
      toast({
        title: "Σφάλμα",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleDeleteLocation = async (id: number) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το σημείο παραλαβής;')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('pickup_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Επιτυχία",
        description: "Το σημείο παραλαβής διαγράφηκε",
      });
      fetchPickupLocations();
    } catch (error: any) {
      console.error('Error deleting pickup location:', error);
      toast({
        title: "Σφάλμα",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPickupLocations();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Διαχείριση Σημείων Παραλαβής</h1>
        <Button onClick={handleAddLocation}>
          <Plus className="h-4 w-4 mr-2" />
          Προσθήκη Σημείου
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Σημεία Παραλαβής</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Όνομα</TableHead>
                  <TableHead>Ιδιοκτήτης</TableHead>
                  <TableHead>Τηλέφωνο</TableHead>
                  <TableHead>Διεύθυνση</TableHead>
                  <TableHead>Χωρητικότητα</TableHead>
                  <TableHead>Ενέργειες</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Φόρτωση...
                    </TableCell>
                  </TableRow>
                ) : pickupLocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Δεν βρέθηκαν σημεία παραλαβής
                    </TableCell>
                  </TableRow>
                ) : (
                  pickupLocations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">
                        {location.name}
                      </TableCell>
                      <TableCell>{location.owner_full_name}</TableCell>
                      <TableCell>{location.owner_phone_number}</TableCell>
                      <TableCell>
                        {location.street} {location.number}, {location.city}, {location.zip}
                      </TableCell>
                      <TableCell>{location.package_capacity}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditLocation(location)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteLocation(location.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? 'Επεξεργασία Σημείου Παραλαβής' : 'Προσθήκη Σημείου Παραλαβής'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Όνομα</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Όνομα σημείου παραλαβής"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner_full_name">Ιδιοκτήτης</Label>
              <Input
                id="owner_full_name"
                value={formData.owner_full_name}
                onChange={(e) => setFormData({ ...formData, owner_full_name: e.target.value })}
                placeholder="Πλήρες όνομα ιδιοκτήτη"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner_phone_number">Τηλέφωνο</Label>
              <Input
                id="owner_phone_number"
                value={formData.owner_phone_number}
                onChange={(e) => setFormData({ ...formData, owner_phone_number: e.target.value })}
                placeholder="Τηλέφωνο ιδιοκτήτη"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="working_hours">Ώρες Λειτουργίας</Label>
              <Input
                id="working_hours"
                value={formData.working_hours}
                onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                placeholder="π.χ. Δευ-Παρ 9:00-18:00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="package_capacity">Χωρητικότητα Πακέτων</Label>
              <Input
                id="package_capacity"
                type="number"
                value={formData.package_capacity}
                onChange={(e) => setFormData({ ...formData, package_capacity: parseInt(e.target.value) || 0 })}
                placeholder="Μέγιστος αριθμός πακέτων"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Χώρα</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Χώρα"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Πόλη</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Πόλη"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="street">Οδός</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                placeholder="Οδός"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="number">Αριθμός</Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                placeholder="Αριθμός"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ΤΚ</Label>
              <Input
                id="zip"
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                placeholder="Ταχυδρομικός Κώδικας"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Ακύρωση
            </Button>
            <Button onClick={handleSaveLocation} disabled={loading}>
              {loading ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};