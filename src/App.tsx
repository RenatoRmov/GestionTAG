import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Plus, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from './supabase';
import {
  Vehicle, Toll, Invoice, Tab,
  HIGHWAYS, MONTHS, DEFAULT_VEHICLES,
} from './types';
import { evaluateExpression, sortVehicles } from './lib/utils';
import Dashboard from './components/Dashboard';
import RegisterTab from './components/RegisterTab';
import BillingTab from './components/BillingTab';

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

  const [newVehicle, setNewVehicle] = useState({ number: '', drivername: '', licenseplate: '' });

  const [newToll, setNewToll] = useState({
    highway: HIGHWAYS[0],
    licenseplate: '',
    amount: '',
    month: selectedMonth,
  });

  const [newInvoice, setNewInvoice] = useState({
    highway: HIGHWAYS[0],
    agreementnumber: '',
    amount: '',
    month: selectedMonth,
    billingdate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      setVehicles(DEFAULT_VEHICLES);

      if (!supabase) {
        const savedTolls = localStorage.getItem('tolls_data');
        const savedInvoices = localStorage.getItem('invoices_data');
        if (savedTolls) setTolls(JSON.parse(savedTolls));
        if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
        return;
      }

      const { data: tollsData, error: tollsError } = await supabase.from('tolls').select('*');
      const { data: invoicesData, error: invoicesError } = await supabase.from('invoices').select('*');

      if (tollsError || invoicesError) {
        console.warn('Supabase error, using localStorage:', { tollsError, invoicesError });
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
    } catch (err) {
      console.error('Error loading data:', err);
      const savedTolls = localStorage.getItem('tolls_data');
      const savedInvoices = localStorage.getItem('invoices_data');
      if (savedTolls) setTolls(JSON.parse(savedTolls));
      if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
      setVehicles(DEFAULT_VEHICLES);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMonthData = async () => {
    if (!confirm(`¿Estás seguro que deseas eliminar todos los datos del mes ${selectedMonth}? Esta acción no se puede deshacer.`)) return;
    try {
      if (supabase) {
        await supabase.from('tolls').delete().eq('month', selectedMonth);
        await supabase.from('invoices').delete().eq('month', selectedMonth);
      }
      await loadData();
      alert('Datos eliminados exitosamente');
    } catch (err) {
      console.error('Error deleting data:', err);
      alert('Error al eliminar los datos');
    }
  };

  const saveData = async () => {
    try {
      if (supabase) {
        await supabase.from('vehicles').upsert(vehicles, { onConflict: 'id' });
        await supabase.from('tolls').upsert(tolls, { onConflict: 'id' });
        await supabase.from('invoices').upsert(invoices, { onConflict: 'id' });
      }
      alert('Datos guardados exitosamente');
    } catch (err) {
      console.error('Error saving data:', err);
      alert('Error al guardar los datos');
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newVehicleData: Vehicle = {
        id: editingVehicle?.id || Date.now().toString(),
        ...newVehicle,
      };
      if (supabase) {
        const { error } = await supabase.from('vehicles').upsert(newVehicleData);
        if (error) throw error;
      }
      await loadData();
      setEditingVehicle(null);
      setNewVehicle({ number: '', drivername: '', licenseplate: '' });
    } catch (err) {
      console.error('Error saving vehicle:', err);
      alert('Error al guardar el vehículo');
    }
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setNewVehicle({
      number: vehicle.number,
      drivername: vehicle.drivername,
      licenseplate: vehicle.licenseplate,
    });
    setActiveTab('register');
  };

  const handleCancelEditVehicle = () => {
    setEditingVehicle(null);
    setNewVehicle({ number: '', drivername: '', licenseplate: '' });
  };

  const handleAddToll = async (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedAmount = evaluateExpression(newToll.amount);
    if (isNaN(calculatedAmount)) {
      alert('Por favor ingresa un monto válido o una expresión matemática válida (ej: 1000+2000)');
      return;
    }
    const newTollData: Toll = {
      id: editingToll?.id || Date.now().toString(),
      ...newToll,
      amount: calculatedAmount,
    };
    if (supabase) {
      const { error } = await supabase.from('tolls').upsert(newTollData);
      if (error) console.warn('Supabase error, saved locally:', error);
    }
    const updatedTolls = editingToll
      ? tolls.map(t => t.id === editingToll.id ? newTollData : t)
      : [...tolls, newTollData];
    setTolls(updatedTolls);
    localStorage.setItem('tolls_data', JSON.stringify(updatedTolls));
    setEditingToll(null);
    setNewToll({ highway: newToll.highway, licenseplate: '', amount: '', month: newToll.month });
  };

  const handleEditToll = (toll: Toll) => {
    setEditingToll(toll);
    setNewToll({
      highway: toll.highway,
      licenseplate: toll.licenseplate,
      amount: toll.amount.toString(),
      month: toll.month,
    });
  };

  const handleCancelEditToll = () => {
    setEditingToll(null);
    setNewToll({ highway: HIGHWAYS[0], licenseplate: '', amount: '', month: selectedMonth });
  };

  const handleBulkSave = async (newTolls: Omit<Toll, 'id'>[]) => {
    const baseTime = Date.now();
    const tollsToSave: Toll[] = newTolls.map((t, i) => ({
      ...t,
      id: `${baseTime}-${i}`,
    }));
    if (supabase) {
      const { error } = await supabase.from('tolls').upsert(tollsToSave);
      if (error) console.warn('Supabase error on bulk save:', error);
    }
    const updatedTolls = [...tolls, ...tollsToSave];
    setTolls(updatedTolls);
    localStorage.setItem('tolls_data', JSON.stringify(updatedTolls));
    alert(`${tollsToSave.length} registro${tollsToSave.length !== 1 ? 's' : ''} importados exitosamente`);
  };

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const newInvoiceData: Invoice = {
      id: editingInvoice?.id || Date.now().toString(),
      ...newInvoice,
      amount: Number(newInvoice.amount),
    };
    if (supabase) {
      const { error } = await supabase.from('invoices').upsert(newInvoiceData);
      if (error) console.warn('Supabase error, saved locally:', error);
    }
    const updatedInvoices = editingInvoice
      ? invoices.map(inv => inv.id === editingInvoice.id ? newInvoiceData : inv)
      : [...invoices, newInvoiceData];
    setInvoices(updatedInvoices);
    localStorage.setItem('invoices_data', JSON.stringify(updatedInvoices));
    setEditingInvoice(null);
    setNewInvoice({
      highway: newInvoice.highway,
      agreementnumber: '',
      amount: '',
      month: selectedMonth,
      billingdate: new Date().toISOString().split('T')[0],
    });
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setNewInvoice({
      highway: invoice.highway,
      agreementnumber: invoice.agreementnumber,
      amount: invoice.amount.toString(),
      month: invoice.month,
      billingdate: invoice.billingdate,
    });
  };

  const handleCancelEditInvoice = () => {
    setEditingInvoice(null);
    setNewInvoice({
      highway: HIGHWAYS[0],
      agreementnumber: '',
      amount: '',
      month: selectedMonth,
      billingdate: new Date().toISOString().split('T')[0],
    });
  };

  const exportToExcel = () => {
    const sortedVehicles = sortVehicles(vehicles);
    const uniqueLicensePlates = sortedVehicles.map(v => v.licenseplate);
    const wsData: (string | number)[][] = [];

    const mobileNumbersRow: (string | number)[] = ['Móvil'];
    sortedVehicles.forEach(v => mobileNumbersRow.push(v.number));
    mobileNumbersRow.push('Total');
    wsData.push(mobileNumbersRow);

    const licensePlatesRow: (string | number)[] = ['Patente'];
    uniqueLicensePlates.forEach(plate => licensePlatesRow.push(plate));
    licensePlatesRow.push('Total');
    wsData.push(licensePlatesRow);

    HIGHWAYS.forEach(highway => {
      const row: (string | number)[] = [highway];
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

    const totalRow: (string | number)[] = ['Total'];
    for (let i = 0; i < uniqueLicensePlates.length; i++) {
      const columnTotal = wsData
        .slice(2)
        .reduce((sum, row) => sum + ((row[i + 1] as number) || 0), 0);
      totalRow.push(columnTotal);
    }
    const grandTotal = (totalRow.slice(1) as number[]).reduce((sum, val) => sum + val, 0);
    totalRow.push(grandTotal);
    wsData.push(totalRow);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gastos TAG');
    XLSX.writeFile(wb, `Gastos_TAG_${selectedMonth.replace(' ', '_')}.xlsx`);
  };

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
        {activeTab === 'dashboard' && (
          <Dashboard
            vehicles={vehicles}
            tolls={tolls}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            dashboardView={dashboardView}
            setDashboardView={setDashboardView}
            loading={loading}
            error={error}
            onLoadData={loadData}
            onDeleteMonthData={handleDeleteMonthData}
            onSaveData={saveData}
            onExportExcel={exportToExcel}
            onEditVehicle={handleEditVehicle}
          />
        )}
        {activeTab === 'register' && (
          <RegisterTab
            vehicles={vehicles}
            tolls={tolls}
            selectedMonth={selectedMonth}
            editingVehicle={editingVehicle}
            newVehicle={newVehicle}
            setNewVehicle={setNewVehicle}
            onAddVehicle={handleAddVehicle}
            onCancelEditVehicle={handleCancelEditVehicle}
            editingToll={editingToll}
            newToll={newToll}
            setNewToll={setNewToll}
            onAddToll={handleAddToll}
            onEditToll={handleEditToll}
            onCancelEditToll={handleCancelEditToll}
            onBulkSave={handleBulkSave}
          />
        )}
        {activeTab === 'billing' && (
          <BillingTab
            invoices={invoices}
            selectedMonth={selectedMonth}
            editingInvoice={editingInvoice}
            newInvoice={newInvoice}
            setNewInvoice={setNewInvoice}
            onAddInvoice={handleAddInvoice}
            onEditInvoice={handleEditInvoice}
            onCancelEditInvoice={handleCancelEditInvoice}
          />
        )}
      </main>
    </div>
  );
}

export default App;
