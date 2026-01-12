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
    const name = formData.get('name') as string;
    const surname = formData.get('surname') as string;

    const { error } = await signUp(email, password, name, surname);

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
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Tabs defaultValue="signin" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-full">
          <TabsTrigger className="rounded-full" value="signin">Σύνδεση</TabsTrigger>
          <TabsTrigger className="rounded-full" value="signup">Εγγραφή</TabsTrigger>
        </TabsList>

        <TabsContent className="mt-4" value="signin">
          <Card className="rounded-3xl hover:shadow-md transition-full duration-200 hover:scale-105">
            <CardHeader>
              <CardTitle>Σύνδεση</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1">
                  <Label className="ml-2" htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    className="rounded-full"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="ml-2" htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    required
                    placeholder="Your password"
                    className="rounded-full"
                  />
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={loading}>
                  {loading ? 'Signing In...' : 'Σύνδεση'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="mt-4" value="signup">
          <Card className="rounded-3xl hover:shadow-md transition-full duration-200 hover:scale-105">
            <CardHeader>
              <CardTitle>Εγγραφή</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="ml-2" htmlFor="signup-name">Όνομα</Label>
                    <Input
                      id="signup-name"
                      name="name"
                      type="text"
                      required
                      placeholder="Όνομα"
                      className="rounded-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="ml-2" htmlFor="signup-surname">Επώνυμο</Label>
                    <Input
                      id="signup-surname"
                      name="surname"
                      type="text"
                      required
                      placeholder="Επώνυμο"
                      className="rounded-full"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="ml-2" htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    className="rounded-full"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="ml-2" htmlFor="signup-password">Κωδικός</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    required
                    placeholder="Choose a password"
                    minLength={8}
                    className="rounded-full"
                  />
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={loading}>
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