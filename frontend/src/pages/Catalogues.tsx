import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Newspaper } from 'lucide-react';

interface Catalogue {
  id: number;
  title: string;
  description: string | null;
  file_path: string;
}

export default function Catalogues() {
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('catalogues')
      .select('id, title, description, file_path')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .then(({ data }) => {
        setCatalogues(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-tinos text-[#0a3e06] text-4xl font-bold mb-2">Κατάλογοι</h1>
      <p className="text-muted-foreground mb-2">Κατεβάστε τους καταλόγους των προϊόντων μας σε μορφή PDF</p>
      <hr className="mt-1 flex-1 border-gray-300 mb-8" aria-hidden />

      {loading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-3xl" />)}
        </div>
      ) : catalogues.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">Δεν υπάρχουν διαθέσιμοι κατάλογοι.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {catalogues.map((catalogue) => (
            <Card key={catalogue.id} className="rounded-3xl hover:shadow-md transition-all duration-200 hover:scale-105 flex flex-col">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-tinos text-[#0a3e06]">{catalogue.title}</CardTitle>
                <CardDescription className="text-sm mb-2">{catalogue.description}</CardDescription>
              </CardHeader>
              <div className="flex-1" />
              <CardContent className="space-y-4">
                <Button
                  onClick={() => window.open(catalogue.file_path, '_blank')}
                  className="w-full rounded-3xl"
                  size="lg"
                >
                  <Newspaper className="h-4 w-4 mr-2" />Προβολή
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}