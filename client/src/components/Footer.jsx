import BrandLogo from './BrandLogo';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="bg-ink text-mist mt-24">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
      <div className="col-span-2 md:col-span-1">
        <BrandLogo size="md" />
        <p className="text-sm text-slate-400 leading-relaxed mt-4 max-w-[220px]">
          Book trusted car wash shops near you, in minutes.
        </p>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Platform</h4>
        <ul className="space-y-3 text-sm text-slate-300">
          <li><Link to="/services" className="hover:text-volt-400 transition-colors">Browse services</Link></li>
          <li><Link to="/vendor/register" className="hover:text-volt-400 transition-colors">Become a vendor</Link></li>
          <li><Link to="/about" className="hover:text-volt-400 transition-colors">About us</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Support</h4>
        <ul className="space-y-3 text-sm text-slate-300">
          <li><Link to="/contact" className="hover:text-volt-400 transition-colors">Contact us</Link></li>
          <li><Link to="/faqs" className="hover:text-volt-400 transition-colors">FAQs</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Legal</h4>
        <ul className="space-y-3 text-sm text-slate-300">
          <li><Link to="/privacy" className="hover:text-volt-400 transition-colors">Privacy policy</Link></li>
          <li><Link to="/terms" className="hover:text-volt-400 transition-colors">Terms &amp; conditions</Link></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-white/10 py-5 text-center text-xs text-slate-500">
      © {new Date().getFullYear()} SplashPoint. All rights reserved.
    </div>
  </footer>
);

export default Footer;
