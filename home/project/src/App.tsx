import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Car, PencilLine, Download, Plus, X, LayoutDashboard, FileText, ClipboardList, Save, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from './supabase';

// Types
type Vehicle = {
  id: string;
  number: string;
  drivername: string;
  licenseplate: string;
};

type Toll = {
  id: string;
  highway: string;
  licenseplate: string;
  amount: number;
  month: string;
};

type Invoice = {
  id: string;
  highway: string;
  agreementnumber: string;
  amount: number;
  month: string;
  billingdate: string;
};

const HIGHWAYS = [
  'Vespucio Sur',
  'Costanera Norte',
  'Vespucio Norte Express',
  'Autopista Central',
  'Globalvia',
  'Ruta del Maipo',
  'Ruta Pass',
  'AVO',
  'Canopsa',
  'Survias',
  'Ruta Sur'
];

// Generate months with years for the next 2 years
const generateMonths = () => {
  const months = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  
  for (let year = currentYear; year <= currentYear + 1; year++) {
    ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].forEach(month => {
      months.push(`${month} ${year}`);
    });
  }
  return months;
};

const MONTHS = generateMonths();

type Tab = 'dashboard' | 'register' | 'billing';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [tolls, setTolls] = useState<Toll[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[new Date().getMonth()]);
  const [editingToll, setEditingToll] = useState<Toll | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  
  // Estados para el formulario de vehículos
  const [newVehicle, setNewVehicle] = useState({
    number: '',
    drivername: '',
    licenseplate: ''
  });

  // Estados para el formulario de peajes
  const [newToll, setNewToll] = useState({
    highway: HIGHWAYS[0],
    licenseplate: '',
    amount: '',
    month: selectedMonth
  });

  // Estados para el formulario de facturación
  const [newInvoice, setNewInvoice] = useState({
    highway: HIGHWAYS[0],
    agreementnumber: '',
    amount: '',
    month: selectedMonth,
    billingdate: new Date().toISOString().split('T')[0]
  });

  // Load data from Supabase on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('*');
      
      const { data: tollsData } = await supabase
        .from('tolls')
        .select('*');
      
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*');

      if (vehiclesData) setVehicles(vehiclesData);
      if (tollsData) setTolls(tollsData);
      if (invoicesData) setInvoices(invoicesData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Delete data for selected month
  const handleDeleteMonthData = async () => {
    if (!confirm(`¿Estás seguro que deseas eliminar todos los datos del mes ${selectedMonth}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      // Delete tolls for selected month
      await supabase
        .from('tolls')
        .delete()
        .eq('month', selectedMonth);

      // Delete invoices for selected month
      await supabase
        .from('invoices')
        .delete()
        .eq('month', selectedMonth);

      // Refresh data
      await loadData();
      alert('Datos eliminados exitosamente');
    } catch (error) {
      console.error('Error deleting data:', error);
      alert('Error al eliminar los datos');
    }
  };

  // Save data function
  const saveData = async () => {
    try {
      // Save vehicles
      await supabase
        .from('vehicles')
        .upsert(vehicles, { onConflict: 'id' });

      // Save tolls
      await supabase
        .from('tolls')
        .upsert(tolls, { onConflict: 'id' });

      // Save invoices
      await supabase
        .from('invoices')
        .upsert(invoices, { onConflict: 'id' });

      alert('Datos guardados exitosamente');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error al guardar los datos');
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newVehicleData = {
        id: editingVehicle?.id || Date.now().toString(),
        ...newVehicle
      };

      const { error } = await supabase
        .from('vehicles')
        .upsert(newVehicleData);

      if (error) throw error;

      await loadData();
      setEditingVehicle(null);
      setNewVehicle({ number: '', drivername: '', licenseplate: '' });
    } catch (error) {
      console.error('Error saving vehicle:', error);
      alert('Error al guardar el vehículo');
    }
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setNewVehicle({
      number: vehicle.number,
      drivername: vehicle.drivername,
      licenseplate: vehicle.licenseplate
    });
  };

  const handleAddToll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newTollData = {
        id: editingToll?.id || Date.now().toString(),
        ...newToll,
        amount: Number(newToll.amount)
      };

      const { error } = await supabase
        .from('tolls')
        .upsert(newTollData);

      if (error) throw error;

      await loadData();
      setEditingToll(null);
      setNewToll({
        highway: newToll.highway,
        licenseplate: '',
        amount: '',
        month: selectedMonth
      });
    } catch (error) {
      console.error('Error saving toll:', error);
      alert('Error al guardar el peaje');
    }
  };

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newInvoiceData = {
        id: editingInvoice?.id || Date.now().toString(),
        ...newInvoice,
        amount: Number(newInvoice.amount)
      };

      const { error } = await supabase
        .from('invoices')
        .upsert(newInvoiceData);

      if (error) throw error;

      await loadData();
      setEditingInvoice(null);
      setNewInvoice({
        highway: newInvoice.highway,
        agreementnumber: '',
        amount: '',
        month: selectedMonth,
        billingdate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Error al guardar la factura');
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setNewInvoice({
      highway: invoice.highway,
      agreementnumber: invoice.agreementnumber,
      amount: invoice.amount.toString(),
      month: invoice.month,
      billingdate: invoice.billingdate
    });
  };

  const handleEditToll = (toll: Toll) => {
    setEditingToll(toll);
    setNewToll({
      highway: toll.highway,
      licenseplate: toll.licenseplate,
      amount: toll.amount.toString(),
      month: toll.month
    });
  };

  const calculateTotalByVehicle = (licenseplate: string) => {
    return tolls
      .filter(toll => toll.licenseplate === licenseplate && toll.month === selectedMonth)
      .reduce((sum, toll) => sum + toll.amount, 0);
  };

  const exportToExcel = () => {
    // Get unique license plates
    const uniqueLicensePlates = Array.from(new Set(vehicles.map(v => v.licenseplate)));
    
    // Create worksheet data
    const wsData = [['Patente', ...uniqueLicensePlates, 'Total']];
    
    // Add highway rows
    HIGHWAYS.forEach(highway => {
      const row = [highway];
      let rowTotal = 0;
      
      uniqueLicensePlates.forEach(plate => {
        const amount = tolls
          .filter(t => t.highway === highway && t.licenseplate === plate && t.month === selectedMonth)
          .reduce((sum, t) => sum + t.amount, 0);
        row.push(amount);
        rowTotal += amount;
      });
      
      row.push(rowTotal);
      wsData.push(row);
    });
    
    // Add total row
    const totalRow = ['Total'];
    const columnCount = uniqueLicensePlates.length;
    for (let i = 0; i < columnCount; i++) {
      const columnTotal = wsData
        .slice(1) // Skip header row
        .reduce((sum, row) => sum + (row[i + 1] as number || 0), 0);
      totalRow.push(columnTotal);
    }
    
    // Add grand total
    const grandTotal = totalRow.slice(1).reduce((sum, val) => sum + (val as number), 0);
    totalRow.push(grandTotal);
    wsData.push(totalRow);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gastos TAG');

    // Generate Excel file
    XLSX.writeFile(wb, `Gastos_TAG_${selectedMonth.replace(' ', '_')}.xlsx`);
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Dashboard</h2>
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
            onClick={handleDeleteMonthData}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar Mes
          </button>
          <button
            onClick={saveData}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            Guardar Todo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Móviles */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Móviles</h3>
          {vehicles.length > 0 ? (
            <div className="space-y-4">
              {vehicles.map(vehicle => (
                <div key={vehicle.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">Móvil {vehicle.number}</p>
                      <p className="text-sm text-gray-600">{vehicle.drivername}</p>
                      <p className="text-sm text-gray-600">{vehicle.licenseplate}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleEditVehicle(vehicle)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilLine className="w-5 h-5" />
                      </button>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total TAG:</p>
                        <p className="font-semibold">${calculateTotalByVehicle(vehicle.licenseplate).toLocaleString()}</p>
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
          )}
        </div>

        {/* Todos los Gastos TAG */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Todos los Gastos TAG</h3>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Exportar Excel
            </button>
          </div>
          {tolls.length > 0 ? (
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
                    .filter(toll => toll.month === selectedMonth)
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

  const renderRegister = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Formulario de Vehículos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Car className="w-5 h-5" />
          {editingVehicle ? 'Editar Vehículo' : 'Registrar Vehículo'}
        </h2>
        <form onSubmit={handleAddVehicle} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Número de Móvil</label>
            <input
              type="text"
              value={newVehicle.number}
              onChange={(e) => setNewVehicle({...newVehicle, number: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre del Conductor</label>
            <input
              type="text"
              value={newVehicle.drivername}
              onChange={(e) => setNewVehicle({...newVehicle, drivername: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Patente</label>
            <input
              type="text"
              value={newVehicle.licenseplate}
              onChange={(e) => setNewVehicle({...newVehicle, licenseplate: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 flex justify-center items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {editingVehicle ? (
                <>
                  <PencilLine className="w-4 h-4" />
                  Actualizar Vehículo
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Agregar Vehículo
                </>
              )}
            </button>
            {editingVehicle && (
              <button
                type="button"
                onClick={() => {
                  setEditingVehicle(null);
                  setNewVehicle({
                    number: '',
                    drivername: '',
                    licenseplate: ''
                  });
                }}
                className="flex justify-center items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
                Cancelar
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
        <form onSubmit={handleAddToll} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Autopista</label>
            <select
              value={newToll.highway}
              onChange={(e) => setNewToll({...newToll, highway: e.target.value})}
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
              onChange={(e) => setNewToll({...newToll, month: e.target.value})}
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
              onChange={(e) => setNewToll({...newToll, licenseplate: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Seleccione una patente</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.licenseplate}>
                  {vehicle.licenseplate} - Móvil {vehicle.number}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Monto</label>
            <input
              type="number"
              value={newToll.amount}
              onChange={(e) => setNewToll({...newToll, amount: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Ingrese el monto"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 flex justify-center items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {editingToll ? (
                <>
                  <PencilLine className="w-4 h-4" />
                  Actualizar Gasto
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Registrar Gasto
                </>
              )}
            </button>
            {editingToll && (
              <button
                type="button"
                onClick={() => {
                  setEditingToll(null);
                  setNewToll({
                    highway: HIGHWAYS[0],
                    licenseplate: '',
                    amount: '',
                    month: selectedMonth
                  });
                }}
                className="flex justify-center items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* Lista de gastos TAG para edición */}
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
                  {tolls.map(toll => (
                    <tr key={toll.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{toll.highway}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{toll.month}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{toll.licenseplate}</td>
                      <td className="px-6 py-4 whitespace-nowrap">${toll.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleEditToll(toll)}
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
  );

  const renderBilling = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Formulario de Facturación */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {editingInvoice ? 'Editar Facturación Autopista' : 'Registrar Facturación Autopista'}
        </h2>
        <form onSubmit={handleAddInvoice} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Autopista</label>
            <select
              value={newInvoice.highway}
              onChange={(e) => setNewInvoice({...newInvoice, highway: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {HIGHWAYS.map(highway => (
                <option key={highway} value={highway}>{highway}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Número de Convenio</label>
            <input
              type="text"
              value={newInvoice.agreementnumber}
              onChange={(e) => setNewInvoice({...newInvoice, agreementnumber: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Monto Factura</label>
            <input
              type="number"
              value={newInvoice.amount}
              onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Ingrese el monto"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mes</label>
            <select
              value={newInvoice.month}
              onChange={(e) => setNewInvoice({...newInvoice, month: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {MONTHS.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de Facturación</label>
            <input
              type="date"
              value={newInvoice.billingdate}
              onChange={(e) => setNewInvoice({...newInvoice, billingdate: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 flex justify-center items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {editingInvoice ? (
                <>
                  <PencilLine className="w-4 h-4" />
                  Actualizar Facturación
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Guardar Facturación
                </>
              )}
            </button>
            {editingInvoice && (
              <button
                type="button"
                onClick={() => {
                  setEditingInvoice(null);
                  setNewInvoice({
                    highway: HIGHWAYS[0],
                    agreementnumber: '',
                    amount: '',
                    month: selectedMonth,
                    billingdate: new Date().toISOString().split('T')[0]
                  });
                }}
                className="flex justify-center items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Lista de Facturaciones */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />
          Facturación de Autopistas
        </h2>
        {invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Autopista</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Convenio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices
                  .filter(invoice => invoice.month === selectedMonth)
                  .map(invoice => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{invoice.highway}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{invoice.agreementnumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap">${invoice.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(invoice.billingdate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleEditInvoice(invoice)}
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
            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No hay facturaciones registradas</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Gestión TAG</h1>
          <nav className="mt-4">
            <div className="border-b border-gray-200">
              <div className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`mr-8 py-4 text-sm font-medium flex items-center gap-2 border-b-2 ${
                    activeTab === 'dashboard'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className={`mr-8 py-4 text-sm font-medium flex items-center gap-2 border-b-2 ${
                    activeTab === 'register'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Registrar
                </button>
                <button
                  onClick={() => setActiveTab('billing')}
                  className={`py-4 text-sm font-medium flex items-center gap-2 border-b-2 ${
                    activeTab === 'billing'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Facturación
                </button>
              </div>
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'register' && renderRegister()}
        {activeTab === 'billing' && renderBilling()}
      </main>
    </div>
  );
}

export default App;