import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Car, PencilLine, Download, Plus, X, LayoutDashboard, FileText, ClipboardList, Save, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
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

// Generate months with years (includes previous year's December)
const generateMonths = () => {
  const months = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  months.push(`Diciembre ${currentYear - 1}`);

  for (let year = currentYear; year <= currentYear + 1; year++) {
    ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].forEach(month => {
      months.push(`${month} ${year}`);
    });
  }
  return months;
};

const MONTHS = generateMonths();

// Default vehicles - all vehicles from the dataset
const DEFAULT_VEHICLES: Vehicle[] = [
  { id: '1', number: '91', drivername: 'Driver', licenseplate: 'TDTP10' },
  { id: '2', number: '44', drivername: 'Driver', licenseplate: 'HGDR71' },
  { id: '3', number: '07', drivername: 'Driver', licenseplate: 'JWDL16' },
  { id: '4', number: '15', drivername: 'Driver', licenseplate: 'KFHX32' },
  { id: '5', number: '19', drivername: 'Driver', licenseplate: 'KDDV91' },
  { id: '6', number: '20', drivername: 'Driver', licenseplate: 'KYFBB66' },
  { id: '7', number: '27', drivername: 'Driver', licenseplate: 'TBZB28' },
  { id: '8', number: '32', drivername: 'Driver', licenseplate: 'SSGW45' },
  { id: '9', number: '34', drivername: 'Driver', licenseplate: 'LZRV27' },
  { id: '10', number: '37', drivername: 'Driver', licenseplate: 'LTYB54' },
  { id: '11', number: '38', drivername: 'Driver', licenseplate: 'KDDK25' },
  { id: '12', number: '44-2', drivername: 'Driver', licenseplate: 'PSLW21' },
  { id: '13', number: '44-3', drivername: 'Driver', licenseplate: 'PJSH64' },
  { id: '14', number: '44-4', drivername: 'Driver', licenseplate: 'VDCH69' },
  { id: '15', number: '44', drivername: 'Anderson', licenseplate: 'VJDK91' },
  { id: '16', number: '45', drivername: 'Driver', licenseplate: 'STXR95' },
  { id: '17', number: '62', drivername: 'Driver', licenseplate: 'KDDK41' },
  { id: '18', number: '72', drivername: 'Driver', licenseplate: 'KTXR50' },
  { id: '19', number: '75', drivername: 'Driver', licenseplate: 'KVYH80' },
  { id: '20', number: '83', drivername: 'Driver', licenseplate: 'HWWZ14' },
  { id: '21', number: '84', drivername: 'Driver', licenseplate: 'JSSG22' },
  { id: '22', number: '87', drivername: 'Driver', licenseplate: 'VDCL43' },
  { id: '23', number: '92', drivername: 'Driver', licenseplate: 'KTXR48' },
  { id: '24', number: '125', drivername: 'Driver', licenseplate: 'SRHZ13' },
  { id: '25', number: '152', drivername: 'Driver', licenseplate: 'SRHZ15' },
  { id: '26', number: '18', drivername: 'Driver', licenseplate: 'KYFB78' },
  { id: '27', number: '', drivername: 'Driver', licenseplate: 'JC0708' },
  { id: '28', number: '', drivername: 'Driver', licenseplate: 'KYFB82' },
  { id: '29', number: '', drivername: 'Driver', licenseplate: 'VTTJ27' }
];

type Tab = 'dashboard' | 'register' | 'billing';

// Function to evaluate mathematical expressions
const evaluateExpression = (expression: string): number => {
  try {
    // Remove spaces and validate that only numbers, +, -, *, /, (, ) are present
    const cleanExpression = expression.replace(/\s/g, '');
    if (!/^[0-9+\-*/().]+$/.test(cleanExpression)) {
      return NaN;
    }
    
    // Use Function constructor for safe evaluation (better than eval)
    const result = new Function('return ' + cleanExpression)();
    return typeof result === 'number' && !isNaN(result) ? result : NaN;
  } catch {
    return NaN;
  }
};

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [tolls, setTolls] = useState<Toll[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[new Date().getMonth()]);
  const [editingToll, setEditingToll] = useState<Toll | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [dashboardView, setDashboardView] = useState<'vehicles' | 'highways'>('vehicles');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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

  // Function to sort vehicles with custom order
  const sortVehicles = (vehiclesList: Vehicle[]) => {
    return vehiclesList.sort((a, b) => {
      // Móvil 91 (TDTP10) goes first
      if (a.licenseplate === 'TDTP10') return -1;
      if (b.licenseplate === 'TDTP10') return 1;
      
      // Móvil 44 (HGDR71) goes second
      if (a.licenseplate === 'HGDR71') return -1;
      if (b.licenseplate === 'HGDR71') return 1;
      
      // For other vehicles, sort by vehicle number
      return parseInt(a.number) - parseInt(b.number);
    });
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Always use default vehicles
      setVehicles(DEFAULT_VEHICLES);

      // Try to load from Supabase
      const { data: tollsData, error: tollsError } = await supabase
        .from('tolls')
        .select('*');

      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*');

      if (tollsError || invoicesError) {
        console.warn('Supabase error, using localStorage:', { tollsError, invoicesError });
        // Fall back to localStorage
        const savedTolls = localStorage.getItem('tolls_data');
        const savedInvoices = localStorage.getItem('invoices_data');
        if (savedTolls) setTolls(JSON.parse(savedTolls));
        if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
      } else {
        if (tollsData) {
          setTolls(tollsData);
          localStorage.setItem('tolls_data', JSON.stringify(tollsData));
        }
        if (invoicesData) {
          setInvoices(invoicesData);
          localStorage.setItem('invoices_data', JSON.stringify(invoicesData));
        }
      }

      console.log('Data loaded successfully');
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to localStorage
      const savedTolls = localStorage.getItem('tolls_data');
      const savedInvoices = localStorage.getItem('invoices_data');
      if (savedTolls) setTolls(JSON.parse(savedTolls));
      if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
      setVehicles(DEFAULT_VEHICLES);
    } finally {
      setLoading(false);
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
      // Evaluate the mathematical expression
      const calculatedAmount = evaluateExpression(newToll.amount);
      
      if (isNaN(calculatedAmount)) {
        alert('Por favor ingresa un monto válido o una expresión matemática válida (ej: 1000+2000)');
        return;
      }

      const newTollData = {
        id: editingToll?.id || Date.now().toString(),
        ...newToll,
        amount: calculatedAmount
      };

      const { error } = await supabase
        .from('tolls')
        .upsert(newTollData);

      // Save to local state and localStorage
      const updatedTolls = editingToll
        ? tolls.map(t => t.id === editingToll.id ? newTollData as Toll : t)
        : [...tolls, newTollData as Toll];

      setTolls(updatedTolls);
      localStorage.setItem('tolls_data', JSON.stringify(updatedTolls));

      if (error) {
        console.warn('Supabase error, but saved locally:', error);
      }

      setEditingToll(null);
      // Mantener la autopista y el mes seleccionados, solo limpiar patente y monto
      setNewToll({
        highway: newToll.highway,
        licenseplate: '',
        amount: '',
        month: newToll.month
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

      // Save to local state and localStorage
      const updatedInvoices = editingInvoice
        ? invoices.map(inv => inv.id === editingInvoice.id ? newInvoiceData as Invoice : inv)
        : [...invoices, newInvoiceData as Invoice];

      setInvoices(updatedInvoices);
      localStorage.setItem('invoices_data', JSON.stringify(updatedInvoices));

      if (error) {
        console.warn('Supabase error, but saved locally:', error);
      }

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

  const calculateTotalByHighway = (highway: string) => {
    return tolls
      .filter(toll => toll.highway === highway && toll.month === selectedMonth)
      .reduce((sum, toll) => sum + toll.amount, 0);
  };

  const exportToExcel = () => {
    // Get unique license plates with custom sorting
    const sortedVehicles = sortVehicles(vehicles);
    const uniqueLicensePlates = sortedVehicles.map(v => v.licenseplate);
    
    // Create worksheet data with mobile numbers row
    const wsData = [];

    // First row: Mobile numbers
    const mobileNumbersRow = ['Móvil'];
    sortedVehicles.forEach(vehicle => {
      mobileNumbersRow.push(vehicle.number);
    });
    mobileNumbersRow.push('Total');
    wsData.push(mobileNumbersRow);

    // Second row: License plates
    const licensePlatesRow = ['Patente'];
    uniqueLicensePlates.forEach(plate => {
      licensePlatesRow.push(plate);
    });
    licensePlatesRow.push('Total');
    wsData.push(licensePlatesRow);

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
        .slice(2) // Skip mobile numbers and license plates rows
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
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <button 
            onClick={loadData}
            className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      )}
      
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Cargando datos...</p>
        </div>
      )}
      
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
        {/* Vista por Móviles o Autopistas */}
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
                <>
                  <ToggleLeft className="w-5 h-5" />
                  Ver por Autopistas
                </>
              ) : (
                <>
                  <ToggleRight className="w-5 h-5" />
                  Ver por Móviles
                </>
              )}
            </button>
          </div>

          {dashboardView === 'vehicles' ? (
            // Vista por Móviles
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
            )
          ) : (
            // Vista por Autopistas
            <div className="space-y-4">
              {HIGHWAYS.map(highway => {
                const total = calculateTotalByHighway(highway);
                return (
                  <div key={highway} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{highway}</p>
                        <p className="text-sm text-gray-600">
                          {tolls.filter(toll => toll.highway === highway && toll.month === selectedMonth).length} registros
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
              onChange={(e) => setNewToll({...newToll, amount: e.target.value})}
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
                  {tolls
                    .sort((a, b) => parseInt(b.id) - parseInt(a.id))
                    .map(toll => (
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