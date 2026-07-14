import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Check, AlertTriangle, X, FileWarning } from 'lucide-react';
import { Vehicle, Toll, HIGHWAYS, MONTHS } from '../types';

interface ParsedEntry {
  licenseplate: string;
  amount: number;
  recognized: boolean;
  selected: boolean;
}

interface LoadedFile {
  name: string;
  totals: Map<string, number>;
  error?: string;
}

interface BulkUploadProps {
  vehicles: Vehicle[];
  existingTolls: Toll[];
  onSave: (tolls: Omit<Toll, 'id'>[]) => void;
}

const SKIP_KEYWORDS = ['total', 'subtotal', 'grand', 'suma', 'etiqueta', 'resumen', '(en blanco)'];
const isTotalRow = (plate: string) => SKIP_KEYWORDS.some(kw => plate.toLowerCase().includes(kw));

// Handles: Chilean (1.055,13), US (1,055.13), thousands-only (3.800 = 3800), $-prefixed ($ 621)
const parseNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (!value && value !== 0) return 0;
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
    const afterComma = str.split(',').slice(-1)[0];
    normalized = afterComma.length === 3
      ? str.replace(/,/g, '')          // thousands: 1,800 → 1800
      : str.replace(',', '.');          // decimal:   351,71 → 351.71
  } else if (hasDot && !hasComma) {
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

const findAllColumnIndices = (headers: string[], candidates: string[]): number[] => {
  const lower = candidates.map(c => c.toLowerCase().trim());
  const out: number[] = [];
  headers.forEach((h, idx) => {
    if (lower.includes(String(h ?? '').toLowerCase().trim())) out.push(idx);
  });
  return out;
};

// Some formats (e.g. Canopsa) repeat a header like "Tarifa" for both a rate-code
// column ("TBP") and the actual amount column ("3900"). Pick whichever candidate
// column actually contains numbers, instead of blindly taking the first match.
const pickNumericColumn = (rows: unknown[][], startRow: number, candidates: number[]): number => {
  if (candidates.length <= 1) return candidates[0] ?? -1;
  let best = candidates[0];
  let bestScore = -1;
  for (const idx of candidates) {
    let score = 0;
    const end = Math.min(rows.length, startRow + 200);
    for (let i = startRow; i < end; i++) {
      if (parseNumber(rows[i][idx]) > 0) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = idx;
    }
  }
  return best;
};

const parseSheetRows = (rows: unknown[][]): Map<string, number> | null => {
  // --- Priority: detect pivot table ("Etiquetas de" + "Suma de") ---
  let pivotHeaderRow = -1;
  let pivotPlateCol = -1;
  let pivotSumCol = -1;

  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].map(c => String(c ?? '').toLowerCase().trim());
    const etiqIdx = cells.findIndex(c => c.includes('etiqueta'));
    if (etiqIdx === -1) continue;
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
      const row = rows[i];
      const plate = String(row[pivotPlateCol] ?? '').trim().toUpperCase();
      if (!plate || isTotalRow(plate)) continue;
      const amount = parseNumber(row[pivotSumCol]);
      if (amount === 0) continue;
      totals.set(plate, (totals.get(plate) ?? 0) + amount);
    }
    if (totals.size > 0) return totals;
  }

  // --- Fallback: find transaction columns (Patente + Tarifa/Monto/Importe/Valor) ---
  let headerRowIdx = -1;
  let plateIdx = -1;
  let amountIdx = -1;

  for (let i = 0; i < Math.min(50, rows.length); i++) {
    const cells = rows[i].map(c => String(c ?? ''));
    const plateCandidates = findAllColumnIndices(cells, ['patente', 'patent']);
    const amountCandidates = findAllColumnIndices(cells, ['tarifa', 'monto', 'importe', 'valor', 'mto', 'cobro']);
    if (plateCandidates.length && amountCandidates.length) {
      headerRowIdx = i;
      plateIdx = plateCandidates[0];
      amountIdx = pickNumericColumn(rows, i + 1, amountCandidates);
      break;
    }
  }

  if (headerRowIdx === -1) return null;

  const totals = new Map<string, number>();
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const plate = String(row[plateIdx] ?? '').trim().toUpperCase();
    if (!plate || isTotalRow(plate)) continue;
    const amount = parseNumber(row[amountIdx]);
    if (amount === 0) continue;
    totals.set(plate, (totals.get(plate) ?? 0) + amount);
  }
  return totals.size > 0 ? totals : null;
};

const parseFile = (file: File): Promise<LoadedFile> => {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onerror = () => resolve({ name: file.name, totals: new Map(), error: 'No se pudo leer el archivo.' });
    reader.onload = evt => {
      try {
        // raw: false is critical — some exports (both .csv and legacy .xls pivot
        // tables) store a display-formatted number (e.g. "351,71") whose actual
        // cell value is a different, wrongly-scaled number (e.g. 35171). Using
        // the formatted text and re-parsing it with our own locale-aware logic
        // avoids that silent 100x inflation.
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        for (const sheetName of wb.SheetNames) {
          const ws = wb.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '', raw: false });
          const totals = parseSheetRows(rows);
          if (totals) {
            resolve({ name: file.name, totals });
            return;
          }
        }
        resolve({
          name: file.name,
          totals: new Map(),
          error: 'No se encontraron columnas "Patente" y "Tarifa"/"Monto"/"Importe" reconocibles.',
        });
      } catch {
        resolve({ name: file.name, totals: new Map(), error: 'Error al leer el archivo. Verifica que sea un Excel o CSV válido.' });
      }
    };
    reader.readAsBinaryString(file);
  });
};

const buildEntries = (files: LoadedFile[], vehicles: Vehicle[]): ParsedEntry[] => {
  const totals = new Map<string, number>();
  for (const f of files) {
    if (f.error) continue;
    for (const [plate, amount] of f.totals) {
      totals.set(plate, (totals.get(plate) ?? 0) + amount);
    }
  }
  const knownPlates = new Set(vehicles.map(v => v.licenseplate.toUpperCase()));
  const parsed: ParsedEntry[] = Array.from(totals.entries()).map(([plate, amount]) => ({
    licenseplate: plate,
    amount: Math.round(amount),
    recognized: knownPlates.has(plate),
    selected: knownPlates.has(plate),
  }));
  parsed.sort((a, b) => Number(b.recognized) - Number(a.recognized));
  return parsed;
};

const BulkUpload: React.FC<BulkUploadProps> = ({ vehicles, existingTolls, onSave }) => {
  const [highway, setHighway] = useState(HIGHWAYS[0]);
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [entries, setEntries] = useState<ParsedEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const alreadyHasData = entries.length > 0 &&
    existingTolls.some(t => t.highway === highway && t.month === month);

  const resetAll = () => {
    setFiles([]);
    setEntries([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleHighwayChange = (h: string) => { setHighway(h); resetAll(); };
  const handleMonthChange = (m: string) => { setMonth(m); resetAll(); };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;
    setLoading(true);
    const results = await Promise.all(Array.from(selected).map(parseFile));
    const updated = [...files, ...results];
    setFiles(updated);
    setEntries(buildEntries(updated, vehicles));
    setLoading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeFile = (name: string) => {
    const updated = files.filter(f => f.name !== name);
    setFiles(updated);
    setEntries(buildEntries(updated, vehicles));
  };

  const toggleEntry = (idx: number) => {
    setEntries(prev => prev.map((e, i) => i === idx ? { ...e, selected: !e.selected } : e));
  };

  const toggleAll = () => {
    const allSelected = entries.every(e => e.selected);
    setEntries(prev => prev.map(e => ({ ...e, selected: !allSelected })));
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
    resetAll();
  };

  const selectedEntries = entries.filter(e => e.selected);
  const selectedTotal = selectedEntries.reduce((sum, e) => sum + e.amount, 0);
  const unknownCount = entries.filter(e => !e.recognized).length;
  const filesWithErrors = files.filter(f => f.error);

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
            onChange={e => handleHighwayChange(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {HIGHWAYS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Mes</label>
          <select
            value={month}
            onChange={e => handleMonthChange(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Archivo(s) <span className="text-gray-400 font-normal">(.xlsx, .xls, .csv — puedes elegir varios a la vez)</span>
        </label>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          multiple
          onChange={handleFiles}
          disabled={loading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer disabled:opacity-50"
        />
        <p className="mt-1 text-xs text-gray-400">
          Todos los archivos que subas aquí se sumarán para <strong>{highway}</strong> — <strong>{month}</strong>. Cambia autopista o mes para empezar una carga distinta.
        </p>
      </div>

      {loading && (
        <div className="text-sm text-gray-500 mb-4">Procesando archivo(s)...</div>
      )}

      {files.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {files.map(f => (
            <span
              key={f.name}
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
                f.error ? 'bg-red-50 border-red-300 text-red-700' : 'bg-gray-50 border-gray-300 text-gray-700'
              }`}
            >
              {f.error ? <FileWarning className="w-3 h-3 shrink-0" /> : <Check className="w-3 h-3 shrink-0" />}
              {f.name}
              {!f.error && <span className="text-gray-400">({f.totals.size} patentes)</span>}
              <button onClick={() => removeFile(f.name)} className="text-gray-400 hover:text-gray-700">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {filesWithErrors.length > 0 && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4 text-sm space-y-1">
          {filesWithErrors.map(f => (
            <div key={f.name}><strong>{f.name}:</strong> {f.error}</div>
          ))}
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
              <span className="text-blue-600 font-medium">{entries.length}</span> patentes detectadas en total
            </p>
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
                        ${entry.amount}
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
                    ${selectedTotal}
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
