const StaticPage = ({ title, children }) => (
  <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <h1 className="font-display font-bold text-3xl text-white mb-6">{title}</h1>
    <div className="prose prose-slate text-slate-300 leading-relaxed space-y-4">{children}</div>
  </div>
);

export default StaticPage;
