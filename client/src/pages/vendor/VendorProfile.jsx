import { useEffect, useState, useRef } from 'react';
import resolveImageUrl from '../../utils/resolveImageUrl';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { fetchVendorProfile, updateVendorProfile } from '../../features/vendor/vendorSlice';
import { Card, PageHeader } from '../../components/ui/Card';
import { Field, TextInput, TextArea } from '../../components/ui/FormField';
import Button from '../../components/ui/Button';
import { VendorStatusBadge } from '../../components/ui/Badge';
import ShopImage from '../../components/ShopImage';
import axiosClient from '../../api/axiosClient';

const VendorProfile = () => {
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.vendor);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    dispatch(fetchVendorProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setForm({
        businessName: profile.businessName || '',
        ownerName: profile.ownerName || '',
        phone: profile.phone || '',
        businessAddress: profile.businessAddress || '',
        city: profile.city || '',
        state: profile.state || '',
        pincode: profile.pincode || '',
        latitude: profile.location?.latitude ?? '',
        longitude: profile.location?.longitude ?? '',
        serviceAreas: (profile.serviceAreas || []).join(', '),
        description: profile.description || '',
        coverImageUrl: profile.coverImageUrl || '',
      });
    }
  }, [profile]);

  const [imageCategory, setImageCategory] = useState('Cover Image');
  const [customCategoryName, setCustomCategoryName] = useState('');

  if (!form) return null;

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPEG, PNG, WEBP)');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image size must be under 8MB');
      return;
    }

    if (imageCategory === 'Other' && !customCategoryName.trim()) {
      toast.error('Please enter a custom category name');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('images', file);
      formData.append('category', imageCategory);
      if (imageCategory === 'Other') {
        formData.append('customCategoryName', customCategoryName.trim());
      }

      const { data } = await axiosClient.post('/uploads/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl = data.url || data.data?.url || (Array.isArray(data.data) ? data.data[0] : null) || data.data?.urls?.[0];
      if (uploadedUrl) {
        if (imageCategory === 'Cover Image') {
          setForm((f) => ({ ...f, coverImageUrl: uploadedUrl }));
        }
        dispatch(fetchVendorProfile());
        toast.success(`Shop photo (${imageCategory === 'Other' ? customCategoryName : imageCategory}) uploaded successfully!`);
      } else {
        toast.error('Upload succeeded but no image URL was returned');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload shop image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const locationObj =
      form.latitude !== '' && form.longitude !== '' && !isNaN(Number(form.latitude)) && !isNaN(Number(form.longitude))
        ? { latitude: Number(form.latitude), longitude: Number(form.longitude) }
        : profile.location;

    const payload = {
      ...form,
      location: locationObj,
      serviceAreas: form.serviceAreas ? form.serviceAreas.split(',').map((s) => s.trim()).filter(Boolean) : [],
    };

    const result = await dispatch(updateVendorProfile(payload));
    setSaving(false);
    if (updateVendorProfile.fulfilled.match(result)) {
      toast.success('Business profile updated & saved');
    } else {
      toast.error(result.payload || 'Could not update profile');
    }
  };

  return (
    <div>
      <PageHeader
        title="Business profile"
        description="This information is shown to customers on your public vendor page."
        actions={<VendorStatusBadge status={profile.approvalStatus} />}
      />

      <Card className="max-w-3xl space-y-6">
        {/* Shop Image & Gallery Section */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Shop Photo Upload
          </label>
          <div className="border border-white/10 rounded-xl p-4 bg-ink/40 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-full sm:w-44 h-28 rounded-lg overflow-hidden bg-slate-800 border border-white/10 flex-shrink-0 relative">
                <ShopImage src={form.coverImageUrl} alt={form.businessName} />
                {uploadingImage && (
                  <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm flex items-center justify-center text-volt-400 text-xs gap-1.5 font-semibold">
                    <Loader2 size={16} className="animate-spin" /> Uploading...
                  </div>
                )}
              </div>
              <div className="space-y-3 flex-1">
                <p className="text-xs text-slate-300">
                  Select photo category and upload images for your shop profile.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Image Category</label>
                    <select
                      value={imageCategory}
                      onChange={(e) => setImageCategory(e.target.value)}
                      className="focus-ring w-full bg-ink border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                    >
                      <option value="Cover Image">Cover Image</option>
                      <option value="Shop Front">Shop Front</option>
                      <option value="Waiting Area">Waiting Area</option>
                      <option value="Washing Area">Washing Area</option>
                      <option value="Interior">Interior</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Services">Services</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {imageCategory === 'Other' && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Other Category Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Customer Lounge"
                        value={customCategoryName}
                        onChange={(e) => setCustomCategoryName(e.target.value)}
                        className="focus-ring w-full bg-ink border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="dark"
                    size="sm"
                    icon={Upload}
                    loading={uploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload photo
                  </Button>
                  {form.coverImageUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setForm((f) => ({ ...f, coverImageUrl: '' }))}
                    >
                      Remove Cover
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Uploaded Shop Photos List */}
            {profile.shopPhotos?.length > 0 && (
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs font-semibold text-slate-400 mb-3">Saved Shop Photos ({profile.shopPhotos.length})</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {profile.shopPhotos.map((sp, idx) => (
                    <div key={idx} className="relative h-24 rounded-lg overflow-hidden border border-white/10 group bg-slate-800">
                      <img src={resolveImageUrl(sp.imageUrl)} alt={sp.category} className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-ink/80 backdrop-blur-xs p-1 text-[10px] text-white font-medium truncate text-center">
                        {sp.category === 'Other' ? sp.customCategoryName || 'Other' : sp.category}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Business / Shop name" required>
            <TextInput value={form.businessName} onChange={(e) => handleChange('businessName', e.target.value)} />
          </Field>
          <Field label="Owner name" required>
            <TextInput value={form.ownerName} onChange={(e) => handleChange('ownerName', e.target.value)} />
          </Field>
        </div>

        <Field label="Business phone" required>
          <TextInput value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
        </Field>

        <Field label="Business address" required>
          <TextArea rows={2} value={form.businessAddress} onChange={(e) => handleChange('businessAddress', e.target.value)} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="City" required>
            <TextInput value={form.city} onChange={(e) => handleChange('city', e.target.value)} />
          </Field>
          <Field label="State">
            <TextInput value={form.state} onChange={(e) => handleChange('state', e.target.value)} />
          </Field>
          <Field label="Pincode">
            <TextInput value={form.pincode} onChange={(e) => handleChange('pincode', e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Latitude" hint="e.g. 17.4448">
            <TextInput type="number" step="any" value={form.latitude} onChange={(e) => handleChange('latitude', e.target.value)} />
          </Field>
          <Field label="Longitude" hint="e.g. 78.3498">
            <TextInput type="number" step="any" value={form.longitude} onChange={(e) => handleChange('longitude', e.target.value)} />
          </Field>
        </div>

        <Field label="Service areas" hint="Comma-separated localities">
          <TextInput value={form.serviceAreas} onChange={(e) => handleChange('serviceAreas', e.target.value)} />
        </Field>

        <Field label="About your business" hint="Shown on your public vendor profile page">
          <TextArea rows={3} value={form.description} onChange={(e) => handleChange('description', e.target.value)} />
        </Field>

        <Button variant="dark" loading={saving} onClick={handleSave}>
          Save profile changes
        </Button>
      </Card>
    </div>
  );
};

export default VendorProfile;

