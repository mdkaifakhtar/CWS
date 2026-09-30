import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import axiosClient from '../../api/axiosClient';
import { fetchMe } from '../../features/auth/authSlice';
import ChangePasswordForm from '../../components/ChangePasswordForm';

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosClient.put('/auth/me', { name });
      await dispatch(fetchMe());
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="font-display font-semibold text-lg text-white mb-6">Profile details</h2>
      <div className="bg-ink-card border border-white/10 rounded-xl2 p-6 max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-1.5">Full name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="focus-ring w-full bg-ink border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-1.5">Email</label>
          <input
            value={user?.email || ''}
            disabled
            className="w-full bg-ink border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 bg-slate-50 text-slate-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-1.5">Mobile number</label>
          <input
            value={user?.phone || ''}
            disabled
            className="w-full bg-ink border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 bg-slate-50 text-slate-400"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="focus-ring bg-ink text-white text-sm font-semibold px-5 py-2.5 rounded-lg disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <h2 className="font-display font-semibold text-lg text-white mt-10 mb-6">Security</h2>
      <ChangePasswordForm />
    </div>
  );
};

export default Profile;
