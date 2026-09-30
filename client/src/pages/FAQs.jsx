import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'How do I pay for a booking?',
    a: 'All bookings are pay-at-shop — you pay the shop directly once the service is complete.',
  },
  {
    q: 'Can I cancel a booking?',
    a: 'Yes, you can cancel a booking any time before the shop starts working on it, from your dashboard under "My bookings".',
  },
  {
    q: 'How is the price calculated?',
    a: 'Each service has a base price which can vary slightly by vehicle type. Any discount is applied automatically at checkout.',
  },
  {
    q: 'What if the shop rejects my booking?',
    a: 'You\'ll see the status change to "Rejected" on your booking, along with the shop\'s reason, and you can book with another shop right away.',
  },
];

const FAQs = () => {
  const [open, setOpen] = useState(null);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="font-display font-bold text-3xl text-white mb-8">Frequently asked questions</h1>
      <div className="divide-y divide-white/10 border-t border-b border-white/10">
        {FAQS.map((faq, idx) => (
          <div key={faq.q}>
            <button
              onClick={() => setOpen(open === idx ? null : idx)}
              className="focus-ring w-full flex items-center justify-between py-4 text-left"
            >
              <span className="font-medium text-white text-sm sm:text-base">{faq.q}</span>
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform flex-shrink-0 ml-4 ${open === idx ? 'rotate-180' : ''}`}
              />
            </button>
            {open === idx && <p className="text-sm text-slate-400 pb-4 leading-relaxed">{faq.a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQs;
