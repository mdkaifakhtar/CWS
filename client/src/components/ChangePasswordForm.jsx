import { useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import axiosClient from '../api/axiosClient';
import { logout } from '../features/auth/authSlice';
import { Card } from './ui/Card';
import { Field, TextInput } from './ui/FormField';
import Button from './ui/Button';

// Full-stack change-password: the backend verifies the current password,
// hashes the new one, and invalidates the existing session — so on success
// we log the user out here and send them back to login with the new
// password, matching the backend's token-invalidation behavior.
const ChangePasswordForm = () => {
  const dispatch = useDispatch();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error('Fill in all three fields');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setSaving(true);
    try {
      await axiosClient.put('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmNewPassword,
      });
      toast.success('Password changed. Please log in again.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      dispatch(logout());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="max-w-md">
      <h3 className="font-display font-semibold text-white mb-4">Change password</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Current password" required>
          <TextInput
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </Field>
        <Field label="New password" required hint="At least 6 characters.">
          <TextInput
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </Field>
        <Field label="Confirm new password" required>
          <TextInput
            type="password"
            autoComplete="new-password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />
        </Field>
        <Button type="submit" variant="dark" loading={saving} className="w-full sm:w-auto">
          Change password
        </Button>
      </form>
    </Card>
  );
};

export default ChangePasswordForm;
