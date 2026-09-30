import { useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../api/axiosClient';
import { fetchMe } from '../features/auth/authSlice';
import { Card } from './ui/Card';
import { Field, TextInput } from './ui/FormField';
import Button from './ui/Button';

// Admin-only, per spec. The backend re-verifies the admin's identity from
// the JWT (never trusts a client-supplied id) and re-checks the current
// password before allowing the change.
const ChangeEmailForm = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!newEmail || !currentPassword) {
      toast.error('Enter your new email and current password');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(newEmail.trim())) {
      toast.error('Enter a valid email address');
      return;
    }

    setSaving(true);
    try {
      await axiosClient.put('/auth/change-email', { newEmail, currentPassword });
      await dispatch(fetchMe());
      toast.success('Email updated. Use your new email address next time you log in.');
      setNewEmail('');
      setCurrentPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change email');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="max-w-md">
      <h3 className="font-display font-semibold text-white mb-4">Change email</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Current email">
          <TextInput value={user?.email || ''} disabled />
        </Field>
        <Field label="New email" required>
          <TextInput
            type="email"
            autoComplete="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="newemail@example.com"
          />
        </Field>
        <Field label="Current password" required>
          <TextInput
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </Field>
        <Button type="submit" variant="dark" loading={saving} className="w-full sm:w-auto">
          Change email
        </Button>
      </form>
    </Card>
  );
};

export default ChangeEmailForm;
