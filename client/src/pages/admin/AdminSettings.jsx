import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { fetchPlatformSettings, updatePlatformSettings } from '../../features/admin/adminSlice';
import { PageHeader, Card } from '../../components/ui/Card';
import { Field, TextInput } from '../../components/ui/FormField';
import Button from '../../components/ui/Button';
import ChangePasswordForm from '../../components/ChangePasswordForm';
import ChangeEmailForm from '../../components/ChangeEmailForm';

const AdminSettings = () => {
  const dispatch = useDispatch();
  const { settings } = useSelector((state) => state.admin);
  const [commissionPercent, setCommissionPercent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchPlatformSettings());
  }, [dispatch]);

  useEffect(() => {
    if (settings) setCommissionPercent(String(settings.commissionPercent));
  }, [settings]);

  const handleSave = async () => {
    const value = Number(commissionPercent);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      toast.error('Enter a commission percentage between 0 and 100');
      return;
    }
    setSaving(true);
    const result = await dispatch(updatePlatformSettings({ commissionPercent: value }));
    setSaving(false);
    if (updatePlatformSettings.fulfilled.match(result)) {
      toast.success('Settings updated. New completions will use this rate.');
    } else {
      toast.error(result.payload || 'Could not update settings');
    }
  };

  return (
    <div>
      <PageHeader title="Platform settings" description="Business rules that apply platform-wide." />

      <Card className="max-w-md space-y-4">
        <Field
          label="Platform commission %"
          hint="Applied to every booking's amount when a vendor marks it Completed. Changing this does not affect already-completed bookings — their commission is locked in at completion time."
        >
          <TextInput type="number" min="0" max="100" value={commissionPercent} onChange={(e) => setCommissionPercent(e.target.value)} />
        </Field>
        <Button variant="dark" loading={saving} onClick={handleSave}>Save settings</Button>
      </Card>

      <h2 className="font-display font-semibold text-lg text-white mt-10 mb-4">Account security</h2>
      <div className="flex flex-col sm:flex-row gap-6">
        <ChangePasswordForm />
        <ChangeEmailForm />
      </div>
    </div>
  );
};

export default AdminSettings;
