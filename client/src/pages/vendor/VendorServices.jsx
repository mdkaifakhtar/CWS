import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Plus, Wrench, Pencil, Trash2, Power } from 'lucide-react';
import { fetchVendorServices, toggleVendorServiceActive, deleteVendorService } from '../../features/vendor/vendorSlice';
import { PageHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/StateViews';
import { TableSkeleton } from '../../components/ui/Loading';
import VendorServiceForm from './VendorServiceForm';

const VendorServices = () => {
  const dispatch = useDispatch();
  const { services } = useSelector((state) => state.vendor);
  const { profile } = useSelector((state) => state.vendor);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isApproved = profile?.approvalStatus === 'approved';

  useEffect(() => {
    dispatch(fetchVendorServices()).finally(() => setLoading(false));
  }, [dispatch]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (service) => {
    setEditing(service);
    setFormOpen(true);
  };

  const handleToggle = async (id) => {
    const result = await dispatch(toggleVendorServiceActive(id));
    if (toggleVendorServiceActive.fulfilled.match(result)) {
      toast.success('Status updated');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    await dispatch(deleteVendorService(deleteTarget._id));
    setDeleting(false);
    setDeleteTarget(null);
    toast.success('Service deleted');
  };

  return (
    <div>
      <PageHeader
        title="Services"
        description="Manage the services you offer. New services need an approved account to publish."
        actions={
          <Button variant="primary" icon={Plus} onClick={openCreate} disabled={!isApproved}>
            Add service
          </Button>
        }
      />

      {!isApproved && (
        <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3.5 py-2.5 mb-6">
          You can preview the form, but publishing new services requires an approved vendor account.
        </p>
      )}

      {loading ? (
        <TableSkeleton rows={4} />
      ) : services.length === 0 ? (
        <EmptyState icon={Wrench} title="No services yet" description="Add your first service to start receiving bookings." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {services.map((s) => (
            <div key={s._id} className="bg-ink-card border border-white/10 rounded-xl2 p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs font-semibold text-aqua-400 uppercase tracking-wide">{s.category?.name}</p>
                  <h3 className="font-display font-semibold text-white mt-0.5">{s.name}</h3>
                </div>
                <Badge tone={s.isActive ? 'green' : 'slate'}>{s.isActive ? 'Active' : 'Paused'}</Badge>
              </div>
              <p className="text-sm text-slate-400 line-clamp-2 mb-3">{s.description}</p>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-display font-bold text-lg text-white">₹{s.basePrice}</span>
                <span className="text-xs text-slate-400">{s.durationMinutes} min</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" icon={Pencil} onClick={() => openEdit(s)}>
                  Edit
                </Button>
                <Button variant="outline" size="sm" icon={Power} onClick={() => handleToggle(s._id)}>
                  {s.isActive ? 'Pause' : 'Activate'}
                </Button>
                <Button variant="danger" size="sm" icon={Trash2} onClick={() => setDeleteTarget(s)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit service' : 'Add service'} maxWidth="max-w-xl">
        <VendorServiceForm existing={editing} onDone={() => setFormOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        variant="danger"
        title="Delete this service?"
        description={`"${deleteTarget?.name}" will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
};

export default VendorServices;
