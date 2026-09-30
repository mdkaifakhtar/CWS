import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { ArrowLeft, FileText, MapPin, Mail, Phone, CalendarClock, Wrench, CheckCircle2, ExternalLink, RotateCcw } from 'lucide-react';
import {
  fetchAdminVendorDetail,
  approveVendor,
  rejectVendor,
  suspendVendor,
  restoreVendor,
} from '../../features/admin/adminSlice';
import { Card, StatCard } from '../../components/ui/Card';
import { VendorStatusBadge, Badge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Modal';

const DOCUMENT_TYPE_LABELS = {
  business_license: 'Business license / registration',
  owner_id_proof: 'Owner government ID',
  address_proof: 'Address proof',
  shop_proof: 'Shop / business proof',
  other: 'Other',
};

const VERIFICATION_TONE = { pending: 'amber', verified: 'green', rejected: 'red' };

const InfoRow = ({ icon: Icon, children }) => (
  <p className="text-sm text-white flex items-center gap-1.5 mb-1">
    {Icon && <Icon size={13} className="text-slate-400 flex-shrink-0" />} {children}
  </p>
);

const AdminVendorDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { activeVendor } = useSelector((state) => state.admin);
  const [dialog, setDialog] = useState(null); // 'approve' | 'reject' | 'suspend' | 'restore'
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminVendorDetail(id));
  }, [dispatch, id]);

  if (!activeVendor) {
    return <div className="text-center text-slate-400 py-16">Loading vendor…</div>;
  }

  const { vendor, stats } = activeVendor;

  const runAction = async () => {
    setSubmitting(true);
    let result;
    if (dialog === 'approve') result = await dispatch(approveVendor(id));
    if (dialog === 'reject') result = await dispatch(rejectVendor({ id, reason }));
    if (dialog === 'suspend') result = await dispatch(suspendVendor({ id, reason }));
    if (dialog === 'restore') result = await dispatch(restoreVendor(id));
    setSubmitting(false);

    if (result.type.endsWith('/fulfilled')) {
      toast.success(`Vendor ${dialog === 'restore' ? 'restored' : dialog + 'd'}`);
      setDialog(null);
      setReason('');
    } else {
      toast.error(result.payload || 'Action failed');
    }
  };

  const DIALOG_CONFIG = {
    approve: { title: 'Approve this vendor?', description: 'They will be able to publish services and receive bookings immediately.', confirmLabel: 'Approve', variant: 'dark', requireReason: false },
    reject: { title: 'Reject this vendor', description: 'The vendor will see this reason on their dashboard and can resubmit.', confirmLabel: 'Reject application', variant: 'danger', requireReason: true },
    suspend: { title: 'Suspend this vendor', description: 'Their services will be hidden and bookings paused. They will see this reason.', confirmLabel: 'Suspend account', variant: 'danger', requireReason: true },
    restore: { title: 'Restore this vendor?', description: 'They will be reinstated as an approved, active vendor.', confirmLabel: 'Restore', variant: 'dark', requireReason: false },
  };

  return (
    <div>
      <Link to="/admin/vendors" className="focus-ring flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6">
        <ArrowLeft size={15} /> Back to vendors
      </Link>

      <Card className="mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-4">
            <span className="w-14 h-14 rounded-2xl bg-ink text-white flex items-center justify-center font-display font-bold text-xl flex-shrink-0">
              {vendor.businessName[0]}
            </span>
            <div>
              <h1 className="font-display font-bold text-xl text-white">{vendor.businessName}</h1>
              <p className="text-sm text-slate-400">{vendor.ownerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {vendor.resubmissionCount > 0 && (
              <Badge tone="amber" className="flex items-center gap-1">
                <RotateCcw size={11} /> Resubmitted ×{vendor.resubmissionCount}
              </Badge>
            )}
            <VendorStatusBadge status={vendor.approvalStatus} />
          </div>
        </div>

        {vendor.approvalStatus === 'rejected' && vendor.rejectionReason && (
          <p className="text-sm bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg px-4 py-3 mb-5">
            <strong>Rejection reason:</strong> {vendor.rejectionReason}
          </p>
        )}
        {vendor.approvalStatus === 'suspended' && vendor.suspensionReason && (
          <p className="text-sm bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg px-4 py-3 mb-5">
            <strong>Suspension reason:</strong> {vendor.suspensionReason}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Owner</h3>
            <InfoRow>{vendor.ownerName}</InfoRow>
            {vendor.ownerPhone && <InfoRow icon={Phone}>{vendor.ownerPhone}</InfoRow>}
            {vendor.ownerEmail && <InfoRow icon={Mail}>{vendor.ownerEmail}</InfoRow>}
            {vendor.ownerAddress && <InfoRow icon={MapPin}>{vendor.ownerAddress}</InfoRow>}
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Business contact</h3>
            <InfoRow icon={Mail}>{vendor.email}</InfoRow>
            <InfoRow icon={Phone}>{vendor.phone}</InfoRow>
            {vendor.businessRegistrationNumber && (
              <InfoRow>Reg. no: {vendor.businessRegistrationNumber}</InfoRow>
            )}
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Location</h3>
            <p className="text-sm text-white flex items-start gap-1.5 mb-1">
              <MapPin size={13} className="mt-0.5 flex-shrink-0 text-slate-400" />
              {vendor.businessAddress}, {vendor.city}
              {vendor.state ? `, ${vendor.state}` : ''} {vendor.pincode}
            </p>
            {vendor.location?.latitude && vendor.location?.longitude && (
              <a
                href={`https://www.google.com/maps?q=${vendor.location.latitude},${vendor.location.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-aqua-400 hover:text-aqua-300 flex items-center gap-1 mt-1"
              >
                View on map <ExternalLink size={11} />
              </a>
            )}
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Service area</h3>
            <p className="text-sm text-white">
              {vendor.serviceAreas?.length ? vendor.serviceAreas.join(', ') : vendor.city}
            </p>
          </div>
        </div>

        {vendor.description && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">About</h3>
            <p className="text-sm text-slate-300">{vendor.description}</p>
          </div>
        )}

        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Submitted documents</h3>
          {!vendor.documents?.length ? (
            <p className="text-sm text-slate-400">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {vendor.documents.map((doc) => (
                <div key={doc._id} className="flex items-center justify-between border border-white/10 rounded-lg px-3.5 py-2.5">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="focus-ring flex items-center gap-2.5 text-sm font-medium text-white hover:text-aqua-400 min-w-0"
                  >
                    <FileText size={14} className="flex-shrink-0" />
                    <span className="truncate">{doc.name}</span>
                    <span className="text-xs text-slate-500 flex-shrink-0">({DOCUMENT_TYPE_LABELS[doc.type] || 'Other'})</span>
                  </a>
                  <Badge tone={VERIFICATION_TONE[doc.verificationStatus] || 'slate'} className="capitalize flex-shrink-0">
                    {doc.verificationStatus || 'pending'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/10">
          {vendor.approvalStatus === 'pending' && (
            <>
              <Button variant="dark" icon={CheckCircle2} onClick={() => setDialog('approve')}>
                Approve
              </Button>
              <Button variant="danger" onClick={() => setDialog('reject')}>
                Reject
              </Button>
            </>
          )}
          {vendor.approvalStatus === 'approved' && (
            <Button variant="danger" onClick={() => setDialog('suspend')}>
              Suspend account
            </Button>
          )}
          {vendor.approvalStatus === 'suspended' && (
            <Button variant="dark" onClick={() => setDialog('restore')}>
              Restore account
            </Button>
          )}
          {vendor.approvalStatus === 'rejected' && (
            <Button variant="dark" icon={CheckCircle2} onClick={() => setDialog('approve')}>
              Approve anyway
            </Button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Services listed" value={stats.serviceCount} icon={Wrench} tone="aqua" />
        <StatCard label="Total bookings" value={stats.bookingCount} icon={CalendarClock} tone="aqua" />
        <StatCard label="Completed bookings" value={stats.completedBookingCount} icon={CheckCircle2} tone="green" />
      </div>

      {dialog && (
        <ConfirmDialog
          open={!!dialog}
          onClose={() => { setDialog(null); setReason(''); }}
          onConfirm={runAction}
          loading={submitting}
          {...DIALOG_CONFIG[dialog]}
          reason={reason}
          onReasonChange={setReason}
        />
      )}
    </div>
  );
};

export default AdminVendorDetail;
