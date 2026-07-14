import React from 'react';
import { Car, FileSpreadsheet, PencilLine, Plus, X } from 'lucide-react';
import { Vehicle, Toll, HIGHWAYS, MONTHS } from '../types';
import { sortVehicles } from '../lib/utils';
import BulkUpload from './BulkUpload';

interface RegisterTabProps {
  vehicles: Vehicle[];
  tolls: Toll[];
  selectedMonth: string;

  // Vehicle form
  editingVehicle: Vehicle | null;
  newVehicle: { number: string; drivername: string; licenseplate: string };
  setNewVehicle: (v: { number: string; drivername: string; licenseplate: string }) => void;
  onAddVehicle: (e: React.FormEvent) => void;
  onCancelEditVehicle: () => void;
  onQuickAddVehicle: (vehicle: { number: string; drivername: string; licenseplate: string }) => Promise<void>;

  // Toll form
  editingToll: Toll | null;
  newToll: { highway: string; licenseplate: string; amount: string; month: string };
  setNewToll: (t: { highway: string; licenseplate: string; amount: string; month: string }) => void;
  onAddToll: (e: React.FormEvent) => void;
  onEditToll: (toll: Toll) => void;
  onCancelEditToll: () => void;

  // Bulk upload
  onBulkSave: (tolls: Omit<Toll, 'id'>[]) => void;
}

const RegisterTab: React.FC<RegisterTabProps> = ({
  vehicles, tolls, selectedMonth,
  editingVehicle, newVehicle, setNewVehicle, onAddVehicle, onCancelEditVehicle, onQuickAddVehicle,
  editingToll, newToll, setNewToll, onAddToll, onEditToll, onCancelEditToll,
  onBulkSave,
}) => {
  return (
    <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Formulario de Vehículos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Car className="w-5 h-5" />
          {editingVehicle ? 'Editar Vehículo' : 'Registrar Vehículo'}
        </h2>
        <form onSubmit={onAddVehicle} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Número de Móvil</label>
            <input
              type="text"
              value={newVehicle.number}
              onChange={(e) => setNewVehicle({ ...newVehicle, number: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre del Conductor</label>
            <input
              type="text"
              value={newVehicle.drivername}
              onChange={(e) => setNewVehicle({ ...newVehicle, drivername: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Patente</label>
            <input
              type="text"
              value={newVehicle.licenseplate}
              onChange={(e) => setNewVehicle({ ...newVehicle, licenseplate: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 flex justify-center items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {editingVehicle ? (
                <><PencilLine className="w-4 h-4" /> Actualizar Vehículo</>
              ) : (
                <><Plus className="w-4 h-4" /> Agregar Vehículo</>
              )}
            </button>
            {editingVehicle && (
              <button
                type="button"
                onClick={onCancelEditVehicle}
                className="flex justify-center items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Formulario de TAG */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          {editingToll ? 'Editar Gasto TAG' : 'Registrar Gasto TAG'}
        </h2>
        <form onSubmit={onAddToll} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Autopista</label>
            <select
              value={newToll.highway}
              onChange={(e) => setNewToll({ ...newToll, highway: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {HIGHWAYS.map(highway => (
                <option key={highway} value={highway}>{highway}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mes</label>
            <select
              value={newToll.month}
              onChange={(e) => setNewToll({ ...newToll, month: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {MONTHS.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Patente</label>
            <select
              value={newToll.licenseplate}
              onChange={(e) => setNewToll({ ...newToll, licenseplate: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Seleccione una patente</option>
              {sortVehicles(vehicles).map(vehicle => (
                <option key={vehicle.id} value={vehicle.licenseplate}>
                  {vehicle.licenseplate} - Móvil {vehicle.number}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Monto</label>
            <input
              type="text"
              value={newToll.amount}
              onChange={(e) => setNewToll({ ...newToll, amount: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Ingrese el monto o una suma (ej: 1000+2000)"
            />
            <p className="mt-1 text-xs text-gray-500">
              Puedes ingresar operaciones matemáticas como: 1000+2000, 500*3, etc.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 flex justify-center items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {editingToll ? (
                <><PencilLine className="w-4 h-4" /> Actualizar Gasto</>
              ) : (
                <><Plus className="w-4 h-4" /> Registrar Gasto</>
              )}
            </button>
            {editingToll && (
              <button
                type="button"
                onClick={onCancelEditToll}
                className="flex justify-center items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
            )}
          </div>
        </form>

        {/* Lista de gastos TAG */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Gastos Registrados</h3>
          {tolls.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Autopista</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...tolls]
                    .sort((a, b) => parseInt(b.id) - parseInt(a.id))
                    .map(toll => (
                      <tr key={toll.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{toll.highway}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{toll.month}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{toll.licenseplate}</td>
                        <td className="px-6 py-4 whitespace-nowrap">${toll.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => onEditToll(toll)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <PencilLine className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No hay gastos registrados</p>
            </div>
          )}
        </div>
      </div>
    </div>
    <BulkUpload vehicles={vehicles} existingTolls={tolls} onSave={onBulkSave} onAddVehicle={onQuickAddVehicle} />
    </div>
  );
};

export default RegisterTab;
