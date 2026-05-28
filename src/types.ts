export type Vehicle = {
  id: string;
  number: string;
  drivername: string;
  licenseplate: string;
};

export type Toll = {
  id: string;
  highway: string;
  licenseplate: string;
  amount: number;
  month: string;
};

export type Invoice = {
  id: string;
  highway: string;
  agreementnumber: string;
  amount: number;
  month: string;
  billingdate: string;
};

export type Tab = 'dashboard' | 'register' | 'billing';

export const HIGHWAYS = [
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
  'Ruta Sur',
];

const generateMonths = (): string[] => {
  const months: string[] = [];
  const currentYear = new Date().getFullYear();

  months.push(`Diciembre ${currentYear - 1}`);

  for (let year = currentYear; year <= currentYear + 1; year++) {
    ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].forEach(month => {
      months.push(`${month} ${year}`);
    });
  }
  return months;
};

export const MONTHS = generateMonths();

export const DEFAULT_VEHICLES: Vehicle[] = [
  { id: '1',  number: '91',  drivername: 'Driver',   licenseplate: 'TDTP10'  },
  { id: '2',  number: '44',  drivername: 'Driver',   licenseplate: 'HGDR71'  },
  { id: '3',  number: '07',  drivername: 'Driver',   licenseplate: 'JWDL16'  },
  { id: '4',  number: '15',  drivername: 'Driver',   licenseplate: 'KFHX32'  },
  { id: '5',  number: '19',  drivername: 'Driver',   licenseplate: 'KDDV91'  },
  { id: '6',  number: '20',  drivername: 'Driver',   licenseplate: 'KYFB66'  },
  { id: '7',  number: '27',  drivername: 'Driver',   licenseplate: 'TBZB28'  },
  { id: '8',  number: '32',  drivername: 'Driver',   licenseplate: 'SSGW45'  },
  { id: '9',  number: '34',  drivername: 'Driver',   licenseplate: 'LZRV27'  },
  { id: '10', number: '37',  drivername: 'Driver',   licenseplate: 'LTYB54'  },
  { id: '11', number: '38',  drivername: 'Driver',   licenseplate: 'KDDK25'  },
  { id: '12', number: '44-2',drivername: 'Driver',   licenseplate: 'PSLW21'  },
  { id: '13', number: '44-3',drivername: 'Driver',   licenseplate: 'PJSH64'  },
  { id: '14', number: '44-4',drivername: 'Driver',   licenseplate: 'VDCH69'  },
  { id: '15', number: '44',  drivername: 'Anderson', licenseplate: 'VJDK91'  },
  { id: '16', number: '45',  drivername: 'Driver',   licenseplate: 'STXR95'  },
  { id: '17', number: '62',  drivername: 'Driver',   licenseplate: 'KDDK41'  },
  { id: '18', number: '72',  drivername: 'Driver',   licenseplate: 'KTXR50'  },
  { id: '19', number: '75',  drivername: 'Driver',   licenseplate: 'KVYH80'  },
  { id: '20', number: '83',  drivername: 'Driver',   licenseplate: 'HWWZ14'  },
  { id: '21', number: '84',  drivername: 'Driver',   licenseplate: 'JSSG22'  },
  { id: '22', number: '87',  drivername: 'Driver',   licenseplate: 'VDCL43'  },
  { id: '23', number: '92',  drivername: 'Driver',   licenseplate: 'KTXR48'  },
  { id: '24', number: '125', drivername: 'Driver',   licenseplate: 'SRHZ13'  },
  { id: '25', number: '152', drivername: 'Driver',   licenseplate: 'SRHZ15'  },
  { id: '26', number: '18',  drivername: 'Driver',   licenseplate: 'KYFB78'  },
  { id: '27', number: '',    drivername: 'Driver',   licenseplate: 'JC0708'  },
  { id: '28', number: '',    drivername: 'Driver',   licenseplate: 'KYFB83'  },
  { id: '29', number: '',    drivername: 'Driver',   licenseplate: 'VTTJ27'  },
];
