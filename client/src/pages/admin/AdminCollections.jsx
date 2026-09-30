import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Wallet } from 'lucide-react';
import { fetchCollectionsOverview, fetchVendorCollectionHistory, recordCollection } from '../../features/admin/adminSlice';
import { PageHeader, Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TextInput, TextArea, Field } from '../../components/ui/FormField';
import { TableSkeleton } from '../../components/ui/Loading';
import { EmptyState } from '../../components/StateViews';

const STATUS_TONE = { Collected: 'green', 'Partially Collected': 'amber', Pending: 'red' };

const AdminCollections = () => {
  const dispatch = useDispatch();
  const { collections, activeVendorCollections, status } = useSelector((state) => state.admin);
  const [modalVendor, setModalVendor] = useState(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchCollectionsOverview());
  }, [dispatch]);

  const openVendor = async (row) => {
    setModalVendor(row);
    await dispatch(fetchVendorCollectionHistory(row.vendor._id));
  };

  const handleRecord = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setSubmitting(true);
    const result = await dispatch(recordCollection({ vendorId: modalVendor.vendor._id, amount: Number(amount), notes }));
    setSubmitting(false);
    if (recordCollection.fulfilled.match(result)) {
      toast.success('Collection recorded');
      setAmount('');
      setNotes('');
      dispatch(fetchCollectionsOverview());
    } else {
      toast.error(result.payload || 'Could not record collection');
    }
  };

  return (
    <div>
      <PageHeader
        title="Collections"
        description="Vendor-wise settlement ledger — gross revenue, platform commission, vendor payable, and what's been collected so far."
      />

      {status === 'loading' && !collections.length ? (
        <TableSkeleton rows={5} />
      ) : collections.length === 0 ? (
        <EmptyState icon={Wallet} title="No completed bookings yet" description="Collections appear here once vendors have completed bookings." />
      ) : (
        <div className="space-y-3">
          {collections.map((row) => (
            <button
              key={row.vendor._id}
              onClick={() => openVendor(row)}
              className="focus-ring w-full text-left bg-ink-card border border-white/10 rounded-xl2 p-5 hover:border-aqua-500/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-white">{row.vendor.businessName}</p>
                  <p className="text-xs text-slate-400">{row.vendor.city} · {row.completedBookings} completed bookings</p>
                </div>
                <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Gross</p>
                  <p className="text-sm font-semibold text-white">₹{row.grossBookingValue}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Commission</p>
                  <p className="text-sm font-semibold text-white">₹{row.platformCommission}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Payable</p>
                  <p className="text-sm font-semibold text-white">₹{row.vendorPayable}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Collected</p>
                  <p className="text-sm font-semibold text-green-400">₹{row.collected}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Pending</p>
                  <p className="text-sm font-semibold text-amber-400">₹{row.pendingCollection}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal
        open={!!modalVendor}
        onClose={() => setModalVendor(null)}
        title={modalVendor?.vendor.businessName}
        maxWidth="max-w-lg"
      >
        {activeVendorCollections && (
          <div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 text-center">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Payable</p>
                <p className="font-display font-bold text-white">₹{activeVendorCollections.vendorPayable}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Collected</p>
                <p className="font-display font-bold text-green-400">₹{activeVendorCollections.collected}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Pending</p>
                <p className="font-display font-bold text-amber-400">₹{activeVendorCollections.pendingCollection}</p>
              </div>
            </div>

            <Card className="mb-5 space-y-3">
              <p className="text-sm font-semibold text-white">Record a collection</p>
              <Field label="Amount" required>
                <TextInput type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
              </Field>
              <Field label="Notes">
                <TextArea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Weekly settlement, paid via bank transfer" />
              </Field>
              <Button variant="dark" loading={submitting} onClick={handleRecord}>Mark as collected</Button>
            </Card>

            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">History</p>
            {activeVendorCollections.entries.length === 0 ? (
              <p className="text-sm text-slate-400">No collections recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {activeVendorCollections.entries.map((e) => (
                  <div key={e._id} className="flex items-center justify-between text-xs bg-white/5 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-white font-medium">₹{e.amount} {e.notes && `· ${e.notes}`}</p>
                      <p className="text-slate-500">by {e.collectedBy?.name} · {new Date(e.collectedAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminCollections;
