import { ShoppingCart, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

type Category = { id: string; name: string; parent_id: string | null };

export const Header = () => {
  const { user, isAdmin, signOut, dbUser } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  const primaryCategories = allCategories.filter((c) => c.parent_id === null);
  const childrenByParent = primaryCategories.reduce<Record<string, Category[]>>((acc, parent) => {
    acc[parent.id] = allCategories.filter((c) => c.parent_id === parent.id);
    return acc;
  }, {});

  useEffect(() => {
    const loadCats = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id,name,parent_id')
        .order('name', { ascending: true });
      setAllCategories((data as Category[]) || []);
    };
    loadCats();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const closeTimer = useRef<number | null>(null);
  const openMenu = useCallback(() => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setMenuOpen(true);
  }, []);
  const closeMenuDelayed = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setMenuOpen(false), 180);
  }, []);

  return (
    <header className="border-b bg-[#eaf2d5]">
      <div className="container mx-auto px-4 py-4 relative">
        <div
          className="flex items-center justify-between"
        >
          <div className="flex items-center">
            {/* Logo */}
            <Link to="/" className="hidden md:block flex items-center gap-2">
              <img src="/logo_full.png" alt="All Paper Pack" className="h-10 w-auto" />
            </Link>

            {/* Divider */}
            <div className="hidden md:block h-10 border-l border-green-900/20 ml-2" aria-hidden="true" />

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-4 ml-4">
              <div
                className="relative"
                onMouseEnter={openMenu}
                onMouseLeave={closeMenuDelayed}
              >
                <Link
                  to="/products"
                  className="text-foreground hover:text-primary transition-colors"
                  onFocus={openMenu}
                  onBlur={closeMenuDelayed}
                >
                  Προϊόντα
                </Link>
              </div>

              <Link to="/contact" className="text-foreground hover:text-primary transition-colors">
                Επικοινωνία
              </Link>
            </nav>

            {/* Mobile dropdown (unchanged) */}
            <details className="relative md:hidden ml-2">
              <summary className="flex items-center gap-2 p-3 rounded-full text-foreground/90 hover:bg-primary cursor-pointer select-none">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </summary>
              <div className="absolute left-0 mt-2 w-64 rounded-md border bg-white shadow-lg z-50">
                <ul className="py-1">
                  <li>
                    <Link
                      to="/"
                      className="block px-3 py-2 text-sm text-foreground hover:bg-gray-100"
                      onClick={(e) => (e.currentTarget as HTMLElement).closest('details')?.removeAttribute('open')}
                    >
                      Αρχική
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/products"
                      className="block px-3 py-2 text-sm text-foreground hover:bg-gray-100"
                      onClick={(e) => (e.currentTarget as HTMLElement).closest('details')?.removeAttribute('open')}
                    >
                      Προϊόντα
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/contact"
                      className="block px-3 py-2 text-sm text-foreground hover:bg-gray-100"
                      onClick={(e) => (e.currentTarget as HTMLElement).closest('details')?.removeAttribute('open')}
                    >
                      Επικοινωνία
                    </Link>
                  </li>
                </ul>
              </div>
            </details>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link to="/cart" className="relative">
                  <Button className="rounded-full hover:bg-primary" variant="ghost" size="icon">
                    <ShoppingCart className="h-5 w-5" />
                    {itemCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {itemCount}
                      </Badge>
                    )}
                  </Button>
                </Link>

                <div className="flex items-center gap-2">
                  <Link to="/account">
                    <Button className="bg-[#eaf2d5] hover:bg-primary border-[#eaf2d5] rounded-full" variant="outline" size="sm">
                      <User className="h-4 w-4" />
                      <span className="text-sm">{dbUser?.full_name || user.email}</span>
                    </Button>
                  </Link>

                  {isAdmin && (
                    <Link to="/admin">
                      <Button className="bg-[#eaf2d5] hover:bg-primary border-[#eaf2d5] rounded-full" variant="outline" size="sm">
                        Dashboard
                      </Button>
                    </Link>
                  )}
                  <Button className="rounded-full hover:bg-red-400" variant="ghost" size="sm" onClick={handleSignOut}>
                    Αποσύνδεση
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth">
                  <Button className="rounded-full">Σύνδεση</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mega menu (desktop) – full container width */}
        <div
          className={`
            hidden md:block absolute left-0 right-0 top-full mt-2 z-50
            overflow-hidden origin-top transition-[opacity,transform] duration-200 ease-out
            ${menuOpen && primaryCategories.length > 0 ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 -translate-y-2'}
          `}
          onMouseEnter={openMenu}
          onMouseLeave={closeMenuDelayed}
          aria-hidden={!menuOpen}
        >
          <div className="rounded-md border bg-white shadow-lg p-6">
            {primaryCategories.length > 0 && (
              <div
                className="grid gap-6"
                style={{ gridTemplateColumns: `repeat(${primaryCategories.length}, minmax(0, 1fr))` }}
              >
                {primaryCategories.map((pc) => (
                  <div key={pc.id} className="min-w-0">
                    <Link
                      to={`/products?category=${pc.id}`}
                      className="font-semibold text-foreground hover:text-primary"
                    >
                      {pc.name}
                    </Link>
                    <ul className="mt-3 space-y-2">
                      {childrenByParent[pc.id]?.map((sc) => (
                        <li key={sc.id} className="truncate">
                          <Link
                            to={`/products?category=${sc.id}`}
                            className="text-sm text-muted-foreground hover:text-primary"
                          >
                            {sc.name}
                          </Link>
                        </li>
                      )) || null}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-8 bg-primary">
        <p className="font-semibold text-center text-sm text-primary-foreground leading-8">
          We Think Green...
        </p>
      </div>
    </header>
  );
};