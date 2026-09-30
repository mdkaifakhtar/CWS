import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Car, Plus, Trash2, Star } from 'lucide-react';
import { fetchMyVehicles, addVehicle, updateVehicle, deleteVehicle } from '../../features/booking/vehicleSlice';
import { fetchVehicleTypes } from '../../features/booking/catalogSlice';
import { PageHeader, Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Field, TextInput, Select } from '../../components/ui/FormField';
import { EmptyState } from '../../components/StateViews';

const emptyForm = { vehicleType: '', nickname: '', make: '', model: '', registrationNumber: '' };

const Vehicles = () => {
  const dispatch = useDispatch();
  const { items: vehicles } = useSelector((state) => state.vehicles);
  const { vehicleTypes } = useSelector((state) => state.catalog);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchMyVehicles());
    dispatch(fetchVehicleTypes());
  }, [dispatch]);

  const handleSave = async () => {
    if (!form.vehicleType) {
      toast.error('Select a vehicle type');
      return;
    }
    setSaving(true);
    const result = await dispatch(addVehicle(form));
    setSaving(false);
    if (addVehicle.fulfilled.match(result)) {
      toast.success('Vehicle added');
      setForm(emptyForm);
      setShowForm(false);
    } else {
      toast.error(result.payload || 'Could not add vehicle');
    }
  };

  const handleSetDefault = async (id) => {
    await dispatch(updateVehicle({ id, payload: { isDefault: true } }));
    toast.success('Default vehicle updated');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this vehicle?')) return;
    await dispatch(deleteVehicle(id));
    toast.success('Vehicle removed');
  };

  return (
    <div>
      <PageHeader
        title="My vehicles"
        description="Add the vehicles you'll bring in for a wash — you'll pick one first when booking."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setShowForm((s) => !s)}>
            Add vehicle
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Vehicle type" required>
              <Select value={form.vehicleType} onChange={(e) => setForm((f) => ({ ...f, vehicleType: e.target.value }))}>
                <option value="">Select type</option>
                {vehicleTypes.map((vt) => (
                  <option key={vt._id} value={vt._id}>{vt.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Nickname" hint="e.g. My Nexon">
              <TextInput value={form.nickname} onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Make">
              <TextInput placeholder="Tata" value={form.make} onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))} />
            </Field>
            <Field label="Model">
              <TextInput placeholder="Nexon" value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} />
            </Field>
            <Field label="Registration number">
              <TextInput placeholder="TS09AB1234" value={form.registrationNumber} onChange={(e) => setForm((f) => ({ ...f, registrationNumber: e.target.value }))} />
            </Field>
          </div>
          <div className="flex gap-2">
            <Button variant="dark" loading={saving} onClick={handleSave}>Save vehicle</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {vehicles.length === 0 && !showForm ? (
        <EmptyState icon={Car} title="No vehicles yet" description="Add a vehicle to start booking a car wash." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {vehicles.map((v) => (
            <div key={v._id} className="bg-ink-card border border-white/10 rounded-xl2 p-4 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-full bg-aqua-500/10 text-aqua-400 flex items-center justify-center flex-shrink-0">
                  <Car size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                    {v.nickname || `${v.make} ${v.model}`.trim() || v.vehicleType?.name}
                    {v.isDefault && <Star size={12} className="text-volt-400 fill-volt-400" />}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{v.vehicleType?.name} {v.registrationNumber && `· ${v.registrationNumber}`}</p>
                  {!v.isDefault && (
                    <button onClick={() => handleSetDefault(v._id)} className="text-xs text-aqua-400 hover:text-aqua-300 mt-1.5">
                      Set as default
                    </button>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(v._id)} className="text-slate-400 hover:text-red-400" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Vehicles;
