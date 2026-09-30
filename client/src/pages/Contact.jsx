import { useState } from 'react';
import toast from 'react-hot-toast';
import StaticPage from '../components/StaticPage';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success("Thanks — we'll get back to you soon.");
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <StaticPage title="Contact us">
      <p>Have a question about a booking or the platform? Send us a message and we'll respond shortly.</p>
      <form onSubmit={handleSubmit} className="not-prose space-y-4 mt-6 max-w-md">
        <input
          required
          placeholder="Your name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="focus-ring w-full bg-ink border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500"
        />
        <input
          required
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="focus-ring w-full bg-ink border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500"
        />
        <textarea
          required
          rows={4}
          placeholder="Your message"
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className="focus-ring w-full bg-ink border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500"
        />
        <button type="submit" className="focus-ring bg-ink text-white text-sm font-semibold px-5 py-2.5 rounded-lg">
          Send message
        </button>
      </form>
    </StaticPage>
  );
};

export default Contact;
