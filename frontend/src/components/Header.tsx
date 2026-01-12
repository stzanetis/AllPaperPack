import { ShoppingCart, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

type Category = { id: number; name: string; parent_id: number | null };

export const Header = () => {
  const { user, isAdmin, signOut, profile } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [bannerText, setBannerText] = useState('We Think Green');
  const [isSticky, setIsSticky] = useState(false);

  const primaryCategories = allCategories.filter((c) => c.parent_id === null);
  const childrenByParent = primaryCategories.reduce<Record<number, Category[]>>((acc, parent) => {
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

    const loadBannerText = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'banner_text')
        .single();
      if (data) {
        setBannerText(data.value);
      }
    };

    loadCats();
    loadBannerText();

    // Handle sticky header on scroll
    const handleScroll = () => {
      setIsSticky(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // hover-intent: keep open while hovering trigger or dropdown
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
    <>
    <header 
      className={`bg-[#eaf2d5] ${isSticky ? 'fixed top-0 left-0 right-0 z-50 shadow-md' : ''}`}
    >
      <div className="container mx-auto px-4 relative py-4">
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
                  className="text-[#464940] font-semibold hover:text-primary transition-colors"
                  onFocus={openMenu}
                  onBlur={closeMenuDelayed}
                >
                  Προϊόντα
                </Link>
              </div>

              <Link to="/contact" className="text-[#464940] font-semibold hover:text-primary transition-colors">
                Επικοινωνία
              </Link>
            </nav>

            {/* Mobile dropdown */}
            <div className="relative md:hidden ml-2">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex items-center gap-2 p-3 rounded-full text-[#464940] hover:bg-primary cursor-pointer select-none"
                aria-expanded={mobileMenuOpen}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <div className={`
                absolute left-0 mt-2 -ml-6 w-screen shadow-xl z-50
                overflow-hidden origin-top transition-[opacity,transform] duration-200 ease-out bg-[#eaf2d5]
                ${mobileMenuOpen ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 -translate-y-2'}
              `}>
                {/* User info section */}
                {user && (
                  <Link 
                    to="/account" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 border-b border-[#c5d4a8] hover:bg-[#d9e5c0] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-[#464940]">{profile?.name || 'Χρήστης'}</p>
                        <p className="text-xs text-[#75796b] truncate">{user.email}</p>
                      </div>
                    </div>
                  </Link>
                )}
                
                <ul className="py-2">
                  <li>
                    <Link
                      to="/"
                      className="flex items-center gap-3 px-4 py-2.5 text-md text-[#464940] hover:bg-[#d9e5c0] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                      Αρχική
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/products"
                      className="flex items-center gap-3 px-4 py-2.5 text-md text-[#464940] hover:bg-[#d9e5c0] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      Προϊόντα
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/contact"
                      className="flex items-center gap-3 px-4 py-2.5 text-md text-[#464940] hover:bg-[#d9e5c0] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      Επικοινωνία
                    </Link>
                  </li>
                  
                  {user && (
                    <>
                      <li className="border-t border-[#c5d4a8] my-2"></li>
                      <li>
                        <Link
                          to="/cart"
                          className="flex items-center gap-3 px-4 py-2.5 text-md text-[#464940] hover:bg-[#d9e5c0] transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Καλάθι
                          {itemCount > 0 && (
                            <Badge className="ml-auto h-5 px-2 text-xs">{itemCount}</Badge>
                          )}
                        </Link>
                      </li>
                      {isAdmin && (
                        <li>
                          <Link
                            to="/admin"
                            className="flex items-center gap-3 px-4 py-2.5 text-md text-[#464940] hover:bg-[#d9e5c0] transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Admin Panel
                          </Link>
                        </li>
                      )}
                      <li className="border-t border-[#c5d4a8] my-2"></li>
                      <li>
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false);
                            handleSignOut();
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-md text-red-700 hover:bg-red-100/50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          Αποσύνδεση
                        </button>
                      </li>
                    </>
                  )}
                  
                  {!user && (
                    <>
                      <li className="border-t border-[#c5d4a8] my-2"></li>
                      <li>
                        <Link
                          to="/auth"
                          className="flex items-center gap-3 px-4 py-2.5 text-md font-medium text-primary hover:bg-[#d9e5c0] transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                          Σύνδεση / Εγγραφή
                        </Link>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            {/* Mobile Logo */}
              <Link to="/" className="md:hidden flex items-center gap-2 ml-2">
                <img src="/logo_full.png" alt="All Paper Pack" className="h-10 w-auto" />
              </Link>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link to="/cart" className="relative hidden md:block">
                  <Button className="rounded-full hover:bg-primary" variant="ghost" size="icon">
                    <ShoppingCart className="h-5 w-5 text-[#464940]" />
                    {itemCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {itemCount}
                      </Badge>
                    )}
                  </Button>
                </Link>

                <div className="hidden md:flex items-center gap-2">
                  <Link to="/account">
                    <Button className="bg-[#eaf2d5] text-[#464940] font-semibold hover:bg-primary border-[#eaf2d5] rounded-full" variant="outline" size="sm">
                      <User className="h-4 w-4" />
                      <span className="text-sm">{profile?.name || user.email}</span>
                    </Button>
                  </Link>

                  {isAdmin && (
                    <Link to="/admin">
                      <Button className="bg-[#eaf2d5] text-[#464940] font-semibold hover:bg-primary border-[#eaf2d5] rounded-full" variant="outline" size="sm">
                        Admin Panel
                      </Button>
                    </Link>
                  )}
                  <Button className="rounded-full hover:bg-red-400 text-[#464940] font-semibold" variant="ghost" size="sm" onClick={handleSignOut}>
                    Αποσύνδεση
                  </Button>
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/auth">
                  <Button className="rounded-full font-semibold">Σύνδεση</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mega menu (desktop) – full container width */}
        <div
          className={`
            hidden md:block absolute left-0 right-0 top-full z-50
            overflow-hidden origin-top transition-[opacity,transform] duration-200 ease-out shadow-md rounded-b-lg
            ${menuOpen && primaryCategories.length > 0 ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 -translate-y-2'}
          `}
          onMouseEnter={openMenu}
          onMouseLeave={closeMenuDelayed}
          aria-hidden={!menuOpen}
        >
          <div className="bg-[#eaf2d5] p-6">
            {primaryCategories.length > 0 && (
              <div
                className="grid gap-6"
                style={{ gridTemplateColumns: `repeat(${primaryCategories.length}, minmax(0, 1fr))` }}
              >
                {primaryCategories.map((pc) => (
                  <div key={pc.id} className="min-w-0">
                    <Link
                      to={`/products?category=${pc.id}`}
                      className="font-semibold text-[#464940] hover:text-primary"
                    >
                      {pc.name}
                    </Link>
                    <ul className="mt-3 space-y-2">
                      {childrenByParent[pc.id]?.map((sc) => (
                        <li key={sc.id} className="truncate">
                          <Link
                            to={`/products?category=${sc.id}`}
                            className="text-sm text-[#75796b] hover:text-primary"
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
          {bannerText}
        </p>
      </div>
    </header>

    {/* Spacer to prevent content jump when header becomes fixed */}
    {isSticky && <div className="h-[calc(72px+2rem)]" />}
    </>
  );
};