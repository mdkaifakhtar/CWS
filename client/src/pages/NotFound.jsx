import { Link } from 'react-router-dom';
import { Droplet } from 'lucide-react';

const NotFound = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
    <span className="w-14 h-14 rounded-full bg-aqua-500/10 text-aqua-500 flex items-center justify-center mb-5">
      <Droplet size={26} />
    </span>
    <h1 className="font-display font-bold text-3xl text-white">404</h1>
    <p className="text-slate-400 mt-2">We couldn't find the page you're looking for.</p>
    <Link to="/" className="focus-ring mt-6 bg-ink text-white text-sm font-semibold px-5 py-2.5 rounded-lg">
      Back to home
    </Link>
  </div>
);

export default NotFound;
