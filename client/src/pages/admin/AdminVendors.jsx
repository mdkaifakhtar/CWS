import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Store } from 'lucide-react';
import { fetchAdminVendors } from '../../features/admin/adminSlice';
import { PageHeader } from '../../components/ui/Card';
import { TextInput, Select } from '../../components/ui/FormField';
import { VendorStatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/StateViews';
import { TableSkeleton } from '../../components/ui/Loading';

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Suspended', value: 'suspended' },
];

const AdminVendors = () => {
  const dispatch = useDispatch();
  const { vendors, status, vendorsPagination } = useSelector((state) => state.admin);
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const statusFilter = searchParams.get('status') || '';
  const page = Number(searchParams.get('page') || 1);

  useEffect(() => {
    dispatch(fetchAdminVendors({ q, status: statusFilter, page, limit: 10 }));
  }, [dispatch, q, statusFilter, page]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  return (
    <div>
      <PageHeader title="Vendors" description="Review, approve, and manage vendor accounts." />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <TextInput
            defaultValue={q}
            onBlur={(e) => updateParam('q', e.target.value)}
            placeholder="Search by business name, owner, city or email"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onChange={(e) => updateParam('status', e.target.value)} className="sm:w-48">
          {STATUS_TABS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label === 'All' ? 'All statuses' : t.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => updateParam('status', t.value)}
            className={`focus-ring flex-shrink-0 text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors ${
              statusFilter === t.value ? 'bg-ink border-ink text-white' : 'border-white/10 text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {status === 'loading' ? (
        <TableSkeleton rows={6} />
      ) : vendors.length === 0 ? (
        <EmptyState icon={Store} title="No vendors found" description="Try a different search or filter." />
      ) : (
        <>
          <div className="space-y-3">
            {vendors.map((v) => (
              <Link
                key={v._id}
                to={`/admin/vendors/${v._id}`}
                className="flex items-center justify-between bg-ink-card border border-white/10 rounded-xl2 p-4 hover:border-aqua-200 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-full bg-ink text-white flex items-center justify-center font-display font-bold flex-shrink-0">
                    {v.businessName[0]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{v.businessName}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{v.ownerName} · {v.city}</p>
                  </div>
                </div>
                <VendorStatusBadge status={v.approvalStatus} />
              </Link>
            ))}
          </div>

          {vendorsPagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: vendorsPagination.pages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => updateParam('page', String(i + 1))}
                  className={`focus-ring w-9 h-9 rounded-lg text-sm font-medium ${
                    page === i + 1 ? 'bg-ink text-white' : 'border border-white/10 text-slate-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminVendors;
