import { useEffect, useState } from 'react';
import resolveImageUrl from '../../utils/resolveImageUrl';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { UploadCloud, X } from 'lucide-react';
import { fetchCategories, fetchVehicleTypes } from '../../features/booking/catalogSlice';
import { createVendorService, updateVendorService } from '../../features/vendor/vendorSlice';
import { Field, TextInput, TextArea, Select } from '../../components/ui/FormField';
import Button from '../../components/ui/Button';
import axiosClient from '../../api/axiosClient';

const OTHER_VALUE = 'other';

const emptyForm = {
  category: '',
  name: '',
  customServiceName: '',
  description: '',
  basePrice: '',
  durationMinutes: '',
  includedItems: '',
  discountPercent: '',
  images: [],
};

const VendorServiceForm = ({ existing, onDone }) => {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.catalog);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchVehicleTypes());
  }, [dispatch]);

  useEffect(() => {
    if (existing) {
      const isOtherCat = existing.category?.name === 'Other';
      setForm({
        category: isOtherCat ? OTHER_VALUE : existing.category?._id || existing.category,
        name: existing.name,
        customServiceName: isOtherCat ? existing.customServiceName || existing.name : '',
        description: existing.description || '',
        basePrice: existing.basePrice,
        durationMinutes: existing.durationMinutes,
        includedItems: (existing.includedItems || []).join(', '),
        discountPercent: existing.discountPercent || '',
        images: existing.images || [],
      });
    }
  }, [existing]);

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // allow re-selecting the same file (retry)
    if (files.length === 0 || uploadingImages) return;

    const invalid = files.find((f) => !['image/jpeg', 'image/png', 'image/webp'].includes(f.type) || f.size > 8 * 1024 * 1024);
    if (invalid) {
      setUploadError('Only JPG, PNG or WEBP images up to 8MB are allowed');
      toast.error('Only JPG, PNG or WEBP images up to 8MB are allowed');
      return;
    }

    setUploadError('');
    setUploadingImages(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('images', f));
      // Response contract: { success, data: { url, urls: string[] } }
      const { data } = await axiosClient.post('/uploads/service-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploaded = data?.data?.urls;
      if (!Array.isArray(uploaded) || uploaded.length === 0) {
        throw new Error('Upload succeeded but no image URL was returned');
      }
      setForm((f) => ({ ...f, images: [...f.images, ...uploaded] }));
      toast.success('Image(s) uploaded');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Image upload failed';
      setUploadError(message);
      toast.error(message);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (url) => setForm((f) => ({ ...f, images: f.images.filter((i) => i !== url) }));

  const handleSubmit = async () => {
    if (uploadingImages) {
      toast.error('Please wait for the image upload to finish');
      return;
    }
    const isOther = form.category === OTHER_VALUE;
    if (isOther && !form.customServiceName.trim()) {
      toast.error('Custom service name is required');
      return;
    }
    if (!form.category || (!isOther && !form.name) || !form.basePrice || !form.durationMinutes) {
      toast.error('Category, name, price and duration are required');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      name: isOther ? form.customServiceName.trim() : form.name,
      customServiceName: isOther ? form.customServiceName.trim() : '',
      basePrice: Number(form.basePrice),
      durationMinutes: Number(form.durationMinutes),
      discountPercent: form.discountPercent ? Number(form.discountPercent) : 0,
      includedItems: form.includedItems.split(',').map((s) => s.trim()).filter(Boolean),
    };

    const action = existing
      ? updateVendorService({ id: existing._id, payload })
      : createVendorService(payload);
    const result = await dispatch(action);
    setSaving(false);

    if (result.type.endsWith('/fulfilled')) {
      toast.success(existing ? 'Service updated' : 'Service created');
      onDone();
    } else {
      toast.error(result.payload || 'Could not save service');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Category" required>
          <Select value={form.category} onChange={(e) => handleChange('category', e.target.value)}>
            <option value="">Select category</option>
            {categories.filter((c) => c.name !== 'Other').map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
            <option value={OTHER_VALUE}>Other</option>
          </Select>
        </Field>
        {form.category === OTHER_VALUE ? (
          <Field label="Custom Service Name" required>
            <TextInput value={form.customServiceName} onChange={(e) => handleChange('customServiceName', e.target.value)} placeholder="Enter service name" />
          </Field>
        ) : (
          <Field label="Service name" required>
            <TextInput value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Premium Interior Wash" />
          </Field>
        )}
      </div>

      <Field label="Description">
        <TextArea rows={3} value={form.description} onChange={(e) => handleChange('description', e.target.value)} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Base price (₹)" required>
          <TextInput type="number" value={form.basePrice} onChange={(e) => handleChange('basePrice', e.target.value)} />
        </Field>
        <Field label="Duration (min)" required>
          <TextInput type="number" value={form.durationMinutes} onChange={(e) => handleChange('durationMinutes', e.target.value)} />
        </Field>
        <Field label="Discount %">
          <TextInput type="number" value={form.discountPercent} onChange={(e) => handleChange('discountPercent', e.target.value)} />
        </Field>
      </div>

      <Field label="Included items" hint="Comma-separated list">
        <TextInput value={form.includedItems} onChange={(e) => handleChange('includedItems', e.target.value)} placeholder="Vacuum, dashboard polish, tyre shine" />
      </Field>

      <Field label="Images">
        <label className="flex items-center gap-2 border border-dashed border-white/10 rounded-lg px-4 py-3 cursor-pointer hover:border-aqua-300 transition-colors text-sm text-slate-400">
          <UploadCloud size={16} /> {uploadingImages ? 'Uploading…' : 'Upload images'}
          <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} disabled={uploadingImages} />
        </label>
        {uploadError && <p className="text-xs text-red-400 mt-1.5">{uploadError} — select the image again to retry.</p>}
        {form.images.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {form.images.map((url) => (
              <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10">
                <img src={resolveImageUrl(url)} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(url)}
                  className="focus-ring absolute top-0.5 right-0.5 bg-ink/70 text-white rounded-full p-0.5"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button variant="dark" loading={saving} onClick={handleSubmit}>
          {existing ? 'Save changes' : 'Create service'}
        </Button>
      </div>
    </div>
  );
};

export default VendorServiceForm;
