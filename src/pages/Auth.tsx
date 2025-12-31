import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already signed in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
      navigate('/');
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    const { error } = await signUp(email, password, fullName);

    if (error) {
      toast({
        title: "Error signing up",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account created!",
        description: "Please check your email to confirm your account.",
      });
    }

    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 mb-32 mt-16 max-w-md">
      <Tabs defaultValue="signin" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Σύνδεση</TabsTrigger>
          <TabsTrigger value="signup">Εγγραφή</TabsTrigger>
        </TabsList>

        <TabsContent value="signin">
          <Card>
            <CardHeader>
              <CardTitle>Σύνδεση</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    required
                    placeholder="your@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    required
                    placeholder="Your password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing In...' : 'Σύνδεση'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>Εγγραφή</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-fullname">Ονοματεπώνυμο</Label>
                  <Input
                    id="signup-fullname"
                    name="fullName"
                    type="text"
                    required
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    required
                    placeholder="your@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Κωδικός</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    required
                    placeholder="Choose a password"
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Εγγραφή'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}