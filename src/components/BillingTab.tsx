import React from 'react';
import { FileText, ClipboardList, PencilLine, Plus, X } from 'lucide-react';
import { Invoice, HIGHWAYS, MONTHS } from '../types';

interface BillingTabProps {
  invoices: Invoice[];
  selectedMonth: string;

  editingInvoice: Invoice | null;
  newInvoice: {
    highway: string;
    agreementnumber: string;
    amount: string;
    month: string;
    billingdate: string;
  };
  setNewInvoice: (inv: {
    highway: string;
    agreementnumber: string;
    amount: string;
    month: string;
    billingdate: string;
  }) => void;
  onAddInvoice: (e: React.FormEvent) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onCancelEditInvoice: () => void;
}

const BillingTab: React.FC<BillingTabProps> = ({
  invoices, selectedMonth,
  editingInvoice, newInvoice, setNewInvoice,
  onAddInvoice, onEditInvoice, onCancelEditInvoice,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Formulario de Facturación */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {editingInvoice ? 'Editar Facturación Autopista' : 'Registrar Facturación Autopista'}
        </h2>
        <form onSubmit={onAddInvoice} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Autopista</label>
            <select
              value={newInvoice.highway}
              onChange={(e) => setNewInvoice({ ...newInvoice, highway: e.target.value })}
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
              onChange={(e) => setNewInvoice({ ...newInvoice, agreementnumber: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Monto Factura</label>
            <input
              type="number"
              value={newInvoice.amount}
              onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Ingrese el monto"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mes</label>
            <select
              value={newInvoice.month}
              onChange={(e) => setNewInvoice({ ...newInvoice, month: e.target.value })}
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
              onChange={(e) => setNewInvoice({ ...newInvoice, billingdate: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 flex justify-center items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {editingInvoice ? (
                <><PencilLine className="w-4 h-4" /> Actualizar Facturación</>
              ) : (
                <><Plus className="w-4 h-4" /> Guardar Facturación</>
              )}
            </button>
            {editingInvoice && (
              <button
                type="button"
                onClick={onCancelEditInvoice}
                className="flex justify-center items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                <X className="w-4 h-4" /> Cancelar
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
        {invoices.filter(inv => inv.month === selectedMonth).length > 0 ? (
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
                  .filter(inv => inv.month === selectedMonth)
                  .map(invoice => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{invoice.highway}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{invoice.agreementnumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap">${invoice.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(invoice.billingdate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => onEditInvoice(invoice)}
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
};

export default BillingTab;
