import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

type UserRole = 'Πελάτης' | 'Διαχειριστής' | 'Υπεύθυνος Παραγγελιών';

interface DbUser {
  id: number;
  full_name: string;
  email: string;
  phone_number: string | null;
  role: UserRole;
  city: string | null;
  country: string | null;
  street: string | null;
  zip: string | null;
  company_name: string | null;
  afm_number: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  dbUser: DbUser | null;
  dbUserId: number | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  refreshDbUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDbUser = async (email: string, fullName?: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (!error && data) {
      setDbUser(data as DbUser);
    } else if (error?.code === 'PGRST116') {
      // User not found in users table - create one
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          full_name: fullName || email.split('@')[0],
          email: email,
          role: 'Πελάτης' as UserRole,
        })
        .select()
        .single();

      if (!insertError && newUser) {
        setDbUser(newUser as DbUser);
      } else {
        console.error('Error creating user record:', insertError);
        setDbUser(null);
      }
    } else {
      setDbUser(null);
    }
  };

  const refreshDbUser = async () => {
    if (user?.email) {
      await fetchDbUser(user.email);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.email) {
          const fullName = session.user.user_metadata?.full_name;
          setTimeout(() => {
            fetchDbUser(session.user.email!, fullName);
          }, 0);
        } else {
          setDbUser(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        const fullName = session.user.user_metadata?.full_name;
        fetchDbUser(session.user.email, fullName);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    // First sign up with Supabase Auth
    const { error: authError, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName,
        },
      },
    });

    if (authError) {
      return { error: authError };
    }

    // Create a user record in the users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        full_name: fullName,
        email: email,
        role: 'Πελάτης' as UserRole,
      });

    if (userError) {
      console.error('Error creating user record:', userError);
      // Don't fail the signup if user record creation fails
      // The user might already exist or will be created later
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = dbUser?.role === 'Διαχειριστής' || dbUser?.role === 'Υπεύθυνος Παραγγελιών';
  const dbUserId = dbUser?.id ?? null;

  return (
    <AuthContext.Provider value={{
      user,
      session,
      dbUser,
      dbUserId,
      loading,
      signUp,
      signIn,
      signOut,
      isAdmin,
      refreshDbUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};