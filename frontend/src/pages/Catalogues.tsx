import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';

export default function Catalogues() {
  // Sample catalogue data - you can replace with actual data from your database
  const catalogues = [
    {
      id: 1,
      title: 'Κατάλογος Χαρτικών 2025',
      description: 'Πλήρης κατάλογος με όλα τα χαρτικά προϊόντα μας',
      fileName: 'catalogue_2025.pdf',
      fileSize: '2.5 MB',
      downloadUrl: '/catalogues/catalogue_2025.pdf'
    },
    {
      id: 2,
      title: 'Κατάλογος Περιβαλλοντικών Προϊόντων',
      description: 'Ειδικός κατάλογος με τα οικολογικά και βιώσιμα προϊόντα',
      fileName: 'eco_catalogue.pdf',
      fileSize: '1.8 MB',
      downloadUrl: '/catalogues/eco_catalogue.pdf'
    },
    {
      id: 3,
      title: 'Κατάλογος Γραφικής Ύλης',
      description: 'Επαγγελματικά προϊόντα γραφικής ύλης και εξοπλισμού',
      fileName: 'office_supplies.pdf',
      fileSize: '3.2 MB',
      downloadUrl: '/catalogues/office_supplies.pdf'
    },
    {
      id: 4,
      title: 'Κατάλογος Γραφικής Ύλης',
      description: 'Επαγγελματικά προϊόντα γραφικής ύλης και εξοπλισμού',
      fileName: 'office_supplies.pdf',
      fileSize: '3.2 MB',
      downloadUrl: '/catalogues/office_supplies.pdf'
    }
  ];

  const handleDownload = (catalogue: typeof catalogues[0]) => {
    // In a real application, you would implement proper download logic
    // For now, we'll just open the PDF in a new tab
    window.open(catalogue.downloadUrl, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-tinos text-[#0a3e06] text-4xl font-bold mb-2">Κατάλογοι</h1>
      <p className="text-muted-foreground mb-2"> Κατεβάστε τους καταλόγους των προϊόντων μας σε μορφή PDF</p>
      <hr className="mt-1 flex-1 border-gray-300 mb-8" aria-hidden />

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        {catalogues.map((catalogue) => (
          <Card key={catalogue.id} className="rounded-3xl hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">{catalogue.title}</CardTitle>
              <CardDescription className="text-sm">
                {catalogue.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => handleDownload(catalogue)}
                className="w-full rounded-3xl"
                size="lg"
              >
                <Download className="h-4 w-4 mr-2" />
                Κατέβασμα
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}