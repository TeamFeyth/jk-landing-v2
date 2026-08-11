export type Vehicle = {
  stock: string;
  title: string;
  specs: string;
  termMonths: number | null;
  aprPercent: number | null;
  downPayment: string;
  biweekly: number | null;
  photos: string[];
  photoFallback: string;
  detailsUrl: string;
};

// La ruta del CDN se copia tal cual aparece en la pagina del vehiculo.
// Ese thumbor solo sirve las transformaciones ya generadas: cambiar el tamano
// o la calidad devuelve 404.

const cdn = (vehicleId: string, file: string) =>
  `https://cdn-thumbor.autodealersdigital.com/unsafe/fit-in/1000x750/filters:upscale():max_bytes(500000):quality(100):fill(blur):sharpen(0.7,0.5,true):format(jpg)/104878/${vehicleId}/${file}`;

export const vehicles: Vehicle[] = [
  {
    stock: '212255',
    title: '2017 Honda Accord LX CVT',
    specs: '84,325 mi · FWD · Sedan',
    termMonths: null,
    aprPercent: null,
    downPayment: '$2,800',
    biweekly: null,
    photos: [cdn('11713907', '420741776533779.jpg')],
    photoFallback: '/images/vehicles/212255.svg',
    detailsUrl: 'https://jkamalcars.com/vehicles/11713907-2017-Honda-Accord/',
  },
  {
    stock: '843051',
    title: '2018 Nissan Rogue FWD SL',
    specs: '88,486 mi · FWD · SUV',
    termMonths: null,
    aprPercent: null,
    downPayment: '$2,200',
    biweekly: null,
    photos: [cdn('8352207', '597931731543715.jpg')],
    photoFallback: '/images/vehicles/843051.svg',
    detailsUrl: 'https://jkamalcars.com/vehicles/8352207-2018-Nissan-Rogue/',
  },
  {
    stock: 'A62810',
    title: '2022 Ford Expedition Platinum',
    specs: '53,560 mi · 4x2 · SUV',
    termMonths: null,
    aprPercent: null,
    downPayment: 'Call for details',
    biweekly: null,
    photos: [cdn('11899161', '132241782400942.jpg')],
    photoFallback: '/images/vehicles/A62810.svg',
    detailsUrl: 'https://jkamalcars.com/vehicles/11899161-2022-Ford-Expedition/',
  },
];
