import Header from '@/components/layout/Header';
import { requireAdmin } from '@/lib/dal';
import { listVehicleTypes } from '@/lib/repo/vehicleTypes';
import { CreateVehicleTypeForm, EditVehicleTypeForm, ToggleVehicleTypeActiveButton } from './forms';

export default async function KilometersaetzePage() {
  await requireAdmin();
  const vehicleTypes = listVehicleTypes(true);

  return (
    <div className="min-h-full">
      <Header title="Kilometersätze" />
      <div className="p-4 lg:p-6 space-y-4 max-w-3xl mx-auto">
        <CreateVehicleTypeForm />

        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {vehicleTypes.map((vt) => (
            <div key={vt.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              <div className="flex-1">
                <EditVehicleTypeForm
                  id={vt.id}
                  name={vt.name}
                  satz={(vt.satzProKmCent / 100).toFixed(2).replace('.', ',')}
                />
              </div>
              <ToggleVehicleTypeActiveButton id={vt.id} active={vt.aktiv} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
