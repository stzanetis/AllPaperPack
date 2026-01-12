import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Contact() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const to = 'info@allpaperpack.gr';
    const mailSubject = `[Επικοινωνία] ${subject || 'Χωρίς θέμα'} - ${fullName}`;
    const mailBody = `Όνομα: ${fullName}
      Email: ${email}
      Τηλέφωνο: ${phone}

      Μήνυμα:
        ${message}`;
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-tinos text-[#0a3e06] text-4xl font-bold mb-2">Επικοινωνία</h1>
      <p className="text-muted-foreground mb-2">Επικοινωνήστε μαζί μας για οτιδήποτε χρειάζεστε. Θα χαρούμε να σας βοηθήσουμε.</p>
      <hr className="mt-1 flex-1 border-gray-300 mb-8" aria-hidden />

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        {/* Info */}
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary mt-1" />
            <div>
              <div className="font-medium">Διεύθυνση</div>
              <div className="text-muted-foreground">Οδός Μπαφρας 20, Γιαννιτσά 58100</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-primary mt-1" />
            <div>
              <div className="font-medium">Τηλέφωνο</div>
              <a className="text-muted-foreground hover:text-primary" href="tel:69996159627">69996159627</a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-primary mt-1" />
            <div>
              <div className="font-medium">Email</div>
              <a className="text-muted-foreground hover:text-primary" href="mailto:info@allpaperpack.gr">info@allpaperpack.gr</a>
            </div>
          </div>

          {/* Map embed */}
          <div className="aspect-[16/9] w-full overflow-hidden rounded-3xl border">
            <iframe
              title="Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3020.73675478464!2d22.410808975524787!3d40.789801132849796!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1357cff10f138ba9%3A0xfaeca9e39737b733!2zzpzPgM6xz4bPgc6xz4IgMjAsIM6TzrnOsc69zr3Ouc-Ez4POrCA1ODEgMDA!5e0!3m2!1sel!2sgr!4v1767491261652!5m2!1sel!2sgr"
              className="h-full w-full"
              loading="lazy"
            />
          </div>
        </div>

        {/* Form */}
        <Card className="rounded-3xl hover:shadow-md transition-full duration-200 hover:scale-105 border p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="ml-2" htmlFor="fullName">Ονοματεπώνυμο</Label>
                <Input className="rounded-full" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label className="ml-2" htmlFor="email">Email</Label>
                <Input className="rounded-full" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="ml-2" htmlFor="phone">Τηλέφωνο (προαιρετικό)</Label>
              <Input className="rounded-full" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="ml-2" htmlFor="subject">Θέμα</Label>
              <Input className="rounded-full" id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="ml-2" htmlFor="message">Μήνυμα</Label>
              <Textarea className="rounded-3xl" id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={6} required />
            </div>
            <Button type="submit" className="w-full rounded-3xl md:w-auto">Αποστολή</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}