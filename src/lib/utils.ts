import { Vehicle } from '../types';

export const evaluateExpression = (expression: string): number => {
  try {
    const cleanExpression = expression.replace(/\s/g, '');
    if (!/^[0-9+\-*/().]+$/.test(cleanExpression)) return NaN;
    const result = new Function('return ' + cleanExpression)();
    return typeof result === 'number' && !isNaN(result) ? result : NaN;
  } catch {
    return NaN;
  }
};

export const sortVehicles = (vehiclesList: Vehicle[]): Vehicle[] => {
  return [...vehiclesList].sort((a, b) => {
    if (a.licenseplate === 'TDTP10') return -1;
    if (b.licenseplate === 'TDTP10') return 1;
    if (a.licenseplate === 'HGDR71') return -1;
    if (b.licenseplate === 'HGDR71') return 1;
    return parseInt(a.number) - parseInt(b.number);
  });
};
