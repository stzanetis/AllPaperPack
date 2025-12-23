import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Mail } from 'lucide-react';

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
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-tinos text-3xl text-[#0a3e06] font-semibold text-center mb-2">Επικοινωνία</h1>
      <p className="text-muted-foreground text-center max-w-2xl mx-auto">
        Επικοινωνήστε μαζί μας για οτιδήποτε χρειάζεστε. Θα χαρούμε να σας βοηθήσουμε.
      </p>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        {/* Info */}
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary mt-1" />
            <div>
              <div className="font-medium">Διεύθυνση</div>
              <div className="text-muted-foreground">Λ. Παράδειγμα 123, Αθήνα</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-primary mt-1" />
            <div>
              <div className="font-medium">Τηλέφωνο</div>
              <a className="text-muted-foreground hover:text-primary" href="tel:+302100000000">+30 210 0000000</a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-primary mt-1" />
            <div>
              <div className="font-medium">Email</div>
              <a className="text-muted-foreground hover:text-primary" href="mailto:info@allpaperpack.gr">info@allpaperpack.gr</a>
            </div>
          </div>

          {/* Optional map embed */}
          <div className="aspect-[16/9] w-full overflow-hidden rounded-lg border">
            <iframe
              title="Map"
              src="https://maps.google.com/maps?q=Giannitsa%20Greece&t=&z=13&ie=UTF8&iwloc=&output=embed"
              className="h-full w-full"
              loading="lazy"
            />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="fullName">Ονοματεπώνυμο</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <div>
            <Label htmlFor="phone">Τηλέφωνο (προαιρετικό)</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="subject">Θέμα</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="message">Μήνυμα</Label>
            <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={6} required />
          </div>
          <Button type="submit" className="w-full md:w-auto">Αποστολή</Button>
        </form>
      </div>
    </div>
  );
}