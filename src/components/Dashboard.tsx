import React from 'react';
import {
  FileSpreadsheet, Car, PencilLine, Download,
  LayoutDashboard, Save, Trash2, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { Vehicle, Toll, HIGHWAYS, MONTHS } from '../types';
import { sortVehicles } from '../lib/utils';

interface DashboardProps {
  vehicles: Vehicle[];
  tolls: Toll[];
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  dashboardView: 'vehicles' | 'highways';
  setDashboardView: (view: 'vehicles' | 'highways') => void;
  loading: boolean;
  error: string | null;
  onLoadData: () => void;
  onDeleteMonthData: () => void;
  onSaveData: () => void;
  onExportExcel: () => void;
  onEditVehicle: (vehicle: Vehicle) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  vehicles, tolls, selectedMonth, setSelectedMonth,
  dashboardView, setDashboardView,
  loading, error, onLoadData, onDeleteMonthData, onSaveData, onExportExcel,
  onEditVehicle,
}) => {
  const totalByVehicle = (licenseplate: string) =>
    tolls
      .filter(t => t.licenseplate === licenseplate && t.month === selectedMonth)
      .reduce((sum, t) => sum + t.amount, 0);

  const totalByHighway = (highway: string) =>
    tolls
      .filter(t => t.highway === highway && t.month === selectedMonth)
      .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <button
            onClick={onLoadData}
            className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="mt-2 text-gray-600">Cargando datos...</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </h2>
        <div className="flex gap-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {MONTHS.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          <button
            onClick={onDeleteMonthData}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar Mes
          </button>
          <button
            onClick={onSaveData}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            Guardar Todo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel izquierdo: Móviles o Autopistas */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {dashboardView === 'vehicles' ? 'Móviles' : 'Autopistas'}
            </h3>
            <button
              onClick={() => setDashboardView(dashboardView === 'vehicles' ? 'highways' : 'vehicles')}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md transition-colors"
            >
              {dashboardView === 'vehicles' ? (
                <><ToggleLeft className="w-5 h-5" /> Ver por Autopistas</>
              ) : (
                <><ToggleRight className="w-5 h-5" /> Ver por Móviles</>
              )}
            </button>
          </div>

          {dashboardView === 'vehicles' ? (
            vehicles.length > 0 ? (
              <div className="space-y-4">
                {sortVehicles(vehicles).map(vehicle => (
                  <div key={vehicle.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">Móvil {vehicle.number}</p>
                        <p className="text-sm text-gray-600">{vehicle.drivername}</p>
                        <p className="text-sm text-gray-600">{vehicle.licenseplate}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => onEditVehicle(vehicle)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <PencilLine className="w-5 h-5" />
                        </button>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total TAG:</p>
                          <p className="font-semibold">${totalByVehicle(vehicle.licenseplate).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Car className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No hay móviles registrados</p>
              </div>
            )
          ) : (
            <div className="space-y-4">
              {HIGHWAYS.map(highway => {
                const total = totalByHighway(highway);
                return (
                  <div key={highway} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{highway}</p>
                        <p className="text-sm text-gray-600">
                          {tolls.filter(t => t.highway === highway && t.month === selectedMonth).length} registros
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total TAG:</p>
                        <p className="font-semibold">${total.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel derecho: Todos los Gastos TAG */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Todos los Gastos TAG</h3>
            <button
              onClick={onExportExcel}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Exportar Excel
            </button>
          </div>

          {tolls.filter(t => t.month === selectedMonth).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Autopista</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tolls
                    .filter(t => t.month === selectedMonth)
                    .map(toll => (
                      <tr key={toll.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{toll.highway}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{toll.licenseplate}</td>
                        <td className="px-6 py-4 whitespace-nowrap">${toll.amount.toLocaleString()}</td>
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
  );
};

export default Dashboard;
