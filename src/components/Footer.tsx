import { Link } from 'react-router-dom';

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-y-[1px] border-[#3bb2a8] border bg-[#5cabae]">
      <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 bg-white p-2 rounded">
            <img src="/logo_full.png" alt="All Paper Pack" className="h-8 w-auto" />
          </Link>
          <p className="mt-3 text-sm text-white">
            Βιώσιμες λύσεις συσκευασίας και εκτυπώσεων.
          </p>
          <div className="text-white text-sm mt-2">
            © {year} All Paper Pack. All rights reserved.
          </div>
        </div>

        <div>
          <h4 className="text-white mb-3 font-semibold">Πλοήγηση</h4>
          <nav className="flex flex-col gap-2 text-sm">
            <Link to="/" className="text-white hover:text-[#FFD700]">Αρχική</Link>
            <Link to="/products" className="text-white hover:text-[#FFD700]">Προϊόντα</Link>
            <Link to="/contact" className="text-white hover:text-[#FFD700]">Επικοινωνία</Link>
          </nav>
        </div>

        <div>
          <h4 className="text-white mb-3 font-semibold">Επικοινωνία</h4>
          <ul className="space-y-2 text-sm text-white">
            <li>Email: <a className="text-white hover:text-[#FFD700]" href="mailto:info@allpaperpack.gr">info@allpaperpack.gr</a></li>
            <li>Τηλ: <a className="text-white hover:text-[#FFD700]" href="tel:+306996159627">+30 699 615 9627</a></li>
            <li>Facebook: <a className="text-white hover:text-[#FFD700]" href="https://www.facebook.com/dimitris.tzanetis">Dimitris Tzanetis</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export default Footer;