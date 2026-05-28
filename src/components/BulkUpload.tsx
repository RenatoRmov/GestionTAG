import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Check, AlertTriangle, X } from 'lucide-react';
import { Vehicle, Toll, HIGHWAYS, MONTHS } from '../types';

interface ParsedEntry {
  licenseplate: string;
  amount: number;
  recognized: boolean;
  selected: boolean;
}

interface BulkUploadProps {
  vehicles: Vehicle[];
  existingTolls: Toll[];
  onSave: (tolls: Omit<Toll, 'id'>[]) => void;
}

// Handles: Chilean (1.055,13), US (1,055.13), thousands-only (3.800 = 3800), $-prefixed ($ 621)
const parseNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (!value && value !== 0) return 0;
  // Strip currency symbols and whitespace
  const str = String(value).trim().replace(/[$€\s]/g, '');
  if (!str) return 0;

  const hasDot = str.includes('.');
  const hasComma = str.includes(',');

  let normalized: string;

  if (hasComma && hasDot) {
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastComma > lastDot) {
      // Chilean: 1.055,13 → dot=thousands, comma=decimal
      normalized = str.replace(/\./g, '').replace(',', '.');
    } else {
      // US: 1,055.13 → comma=thousands, dot=decimal
      normalized = str.replace(/,/g, '');
    }
  } else if (hasComma && !hasDot) {
    // Comma only: decimal if ≠3 digits after comma, thousands if exactly 3
    const afterComma = str.split(',').slice(-1)[0];
    normalized = afterComma.length === 3
      ? str.replace(/,/g, '')          // thousands: 1,800 → 1800
      : str.replace(',', '.');          // decimal:   351,71 → 351.71
  } else if (hasDot && !hasComma) {
    // Dot only: thousands if ALL groups after dot have exactly 3 digits (3.800, 1.000.000)
    const parts = str.split('.');
    const allThousandGroups = parts.length > 1 && parts.slice(1).every(p => p.length === 3);
    normalized = allThousandGroups
      ? str.replace(/\./g, '')          // thousands: 3.800 → 3800
      : str;                            // decimal:   351.71 stays
  } else {
    normalized = str;                   // plain integer
  }

  const result = parseFloat(normalized);
  return isNaN(result) ? 0 : result;
};

const findColumnIndex = (headers: string[], candidates: string[]): number => {
  const lower = candidates.map(c => c.toLowerCase().trim());
  return headers.findIndex(h => lower.includes(String(h ?? '').toLowerCase().trim()));
};

const BulkUpload: React.FC<BulkUploadProps> = ({ vehicles, existingTolls, onSave }) => {
  const [highway, setHighway] = useState(HIGHWAYS[0]);
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const [entries, setEntries] = useState<ParsedEntry[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const alreadyHasData = entries.length > 0 &&
    existingTolls.some(t => t.highway === highway && t.month === month);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError('');
    setEntries([]);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        const SKIP_KEYWORDS = ['total', 'subtotal', 'grand', 'suma', 'etiqueta', 'resumen', '(en blanco)'];
        const isTotalRow = (plate: string) =>
          SKIP_KEYWORDS.some(kw => plate.toLowerCase().includes(kw));

        // --- Priority: detect pivot table ("Etiquetas de" + "Suma de") ---
        // Pivot totals are pre-calculated by Excel with correct scale; raw transactions
        // may store integers with custom display format (e.g. 35171 displayed as "351,71").
        let pivotHeaderRow = -1;
        let pivotPlateCol = -1;
        let pivotSumCol = -1;

        for (let i = 0; i < rows.length; i++) {
          const cells = (rows[i] as unknown[]).map(c => String(c ?? '').toLowerCase().trim());
          const etiqIdx = cells.findIndex(c => c.includes('etiqueta'));
          if (etiqIdx === -1) continue;
          // Look for sum column to the right in the same row
          const sumaIdx = cells.findIndex(
            (c, idx) => idx > etiqIdx && (c.includes('suma') || c.includes('monto') || c.includes('total'))
          );
          pivotHeaderRow = i;
          pivotPlateCol = etiqIdx;
          pivotSumCol = sumaIdx !== -1 ? sumaIdx : etiqIdx + 1;
          break;
        }

        if (pivotHeaderRow !== -1) {
          const totals = new Map<string, number>();
          for (let i = pivotHeaderRow + 1; i < rows.length; i++) {
            const row = rows[i] as unknown[];
            const plate = String(row[pivotPlateCol] ?? '').trim().toUpperCase();
            if (!plate || isTotalRow(plate)) continue;
            const amount = parseNumber(row[pivotSumCol]);
            if (amount === 0) continue;
            totals.set(plate, (totals.get(plate) ?? 0) + amount);
          }

          if (totals.size === 0) {
            setParseError('No se encontraron datos válidos en el archivo.');
            return;
          }

          const knownPlates = new Set(vehicles.map(v => v.licenseplate.toUpperCase()));
          const parsed: ParsedEntry[] = Array.from(totals.entries()).map(([plate, amount]) => ({
            licenseplate: plate,
            amount: Math.round(amount * 100) / 100,
            recognized: knownPlates.has(plate),
            selected: knownPlates.has(plate),
          }));
          parsed.sort((a, b) => Number(b.recognized) - Number(a.recognized));
          setEntries(parsed);
          return;
        }

        // --- Fallback: find transaction columns (Patente + Tarifa/Monto) ---
        let headerRowIdx = -1;
        let plateIdx = -1;
        let amountIdx = -1;

        for (let i = 0; i < Math.min(50, rows.length); i++) {
          const cells = (rows[i] as unknown[]).map(String);
          const p = findColumnIndex(cells, ['patente', 'patent']);
          const a = findColumnIndex(cells, ['tarifa', 'monto', 'importe', 'valor', 'mto', 'cobro']);
          if (p !== -1 && a !== -1) {
            plateIdx = p;
            amountIdx = a;
            headerRowIdx = i;
            break;
          }
        }

        if (headerRowIdx === -1) {
          setParseError('No se encontraron columnas "Patente" y "Tarifa"/"Monto" en el archivo. Verifica que el Excel tenga esos encabezados.');
          return;
        }

        const totals = new Map<string, number>();
        for (let i = headerRowIdx + 1; i < rows.length; i++) {
          const row = rows[i] as unknown[];
          const plate = String(row[plateIdx] ?? '').trim().toUpperCase();
          if (!plate || isTotalRow(plate)) continue;
          const amount = parseNumber(row[amountIdx]);
          if (amount === 0) continue;
          totals.set(plate, (totals.get(plate) ?? 0) + amount);
        }

        if (totals.size === 0) {
          setParseError('No se encontraron datos válidos en el archivo.');
          return;
        }

        const knownPlates = new Set(vehicles.map(v => v.licenseplate.toUpperCase()));
        const parsed: ParsedEntry[] = Array.from(totals.entries()).map(([plate, amount]) => ({
          licenseplate: plate,
          amount: Math.round(amount * 100) / 100,
          recognized: knownPlates.has(plate),
          selected: knownPlates.has(plate),
        }));

        // Sort: recognized first, then unknown
        parsed.sort((a, b) => Number(b.recognized) - Number(a.recognized));
        setEntries(parsed);
      } catch {
        setParseError('Error al leer el archivo. Verifica que sea un Excel válido (.xlsx o .xls).');
      }
    };
    reader.readAsBinaryString(file);
  };

  const toggleEntry = (idx: number) => {
    setEntries(prev => prev.map((e, i) => i === idx ? { ...e, selected: !e.selected } : e));
  };

  const toggleAll = () => {
    const allSelected = entries.every(e => e.selected);
    setEntries(prev => prev.map(e => ({ ...e, selected: !allSelected })));
  };

  const reset = () => {
    setEntries([]);
    setFileName('');
    setParseError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleConfirm = () => {
    const selected = entries.filter(e => e.selected);
    if (!selected.length) return;
    onSave(selected.map(e => ({
      highway,
      licenseplate: e.licenseplate,
      amount: e.amount,
      month,
    })));
    reset();
  };

  const selectedEntries = entries.filter(e => e.selected);
  const selectedTotal = selectedEntries.reduce((sum, e) => sum + e.amount, 0);
  const unknownCount = entries.filter(e => !e.recognized).length;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5" />
        Carga Masiva por Excel
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Autopista</label>
          <select
            value={highway}
            onChange={e => { setHighway(e.target.value); setEntries([]); setFileName(''); }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {HIGHWAYS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Mes</label>
          <select
            value={month}
            onChange={e => { setMonth(e.target.value); setEntries([]); setFileName(''); }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Archivo Excel <span className="text-gray-400 font-normal">(.xlsx, .xls)</span>
        </label>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFile}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
        />
        <p className="mt-1 text-xs text-gray-400">
          Compatible con formatos que tengan columnas "Patente" y "Tarifa" o "Monto"
        </p>
      </div>

      {parseError && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {parseError}
        </div>
      )}

      {entries.length > 0 && (
        <>
          {alreadyHasData && (
            <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded mb-4 text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Ya existen registros para <strong>{highway}</strong> en <strong>{month}</strong>.
                Si continúas, se agregarán encima de los existentes.
              </span>
            </div>
          )}

          {unknownCount > 0 && (
            <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded mb-4 text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                <strong>{unknownCount} patente{unknownCount > 1 ? 's' : ''}</strong> no están registradas en el sistema.
                Fueron deseleccionadas automáticamente — puedes incluirlas si corresponde.
              </span>
            </div>
          )}

          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{fileName}</span>
              {' '}— <span className="text-blue-600 font-medium">{entries.length}</span> patentes detectadas
            </p>
            <button onClick={reset} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto rounded border border-gray-200 mb-4">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">
                    <input
                      type="checkbox"
                      checked={entries.every(e => e.selected)}
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Patente</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Móvil</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Total</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {entries.map((entry, i) => {
                  const vehicle = vehicles.find(
                    v => v.licenseplate.toUpperCase() === entry.licenseplate
                  );
                  return (
                    <tr
                      key={i}
                      className={`transition-opacity ${!entry.selected ? 'opacity-40' : ''}`}
                    >
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={entry.selected}
                          onChange={() => toggleEntry(i)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-2 font-mono font-medium">{entry.licenseplate}</td>
                      <td className="px-4 py-2 text-gray-500">
                        {vehicle ? `Móvil ${vehicle.number}` : '—'}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold">
                        ${entry.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-2">
                        {entry.recognized ? (
                          <span className="inline-flex items-center gap-1 text-green-700 text-xs bg-green-50 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" /> Reconocida
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 text-xs bg-amber-50 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" /> No registrada
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-sm font-semibold text-gray-700">
                    Total seleccionado ({selectedEntries.length} patentes)
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-gray-900">
                    ${selectedTotal.toLocaleString()}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          <button
            onClick={handleConfirm}
            disabled={selectedEntries.length === 0}
            className="w-full flex justify-center items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            <Check className="w-4 h-4" />
            Importar {selectedEntries.length} registro{selectedEntries.length !== 1 ? 's' : ''} para {highway} — {month}
          </button>
        </>
      )}
    </div>
  );
};

export default BulkUpload;
