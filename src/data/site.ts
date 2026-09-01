export const LANDING_ID = 'lp2';

/* Nombre de evento propio de esta landing.
   Las dos landings mandan el mismo evento estandar Lead al mismo dataset, y
   hasta ahora solo se distinguian por la URL o por un parametro personalizado.
   Meta descarta ambas cosas en datasets con restricciones de categoria, asi
   que ese criterio dejo de funcionar. El NOMBRE del evento si sobrevive. */
export const LEAD_EVENT_NAME = `${LANDING_ID}_lead`;

// Negocio

export const site = {
  name: 'John Kamal Cars',

  phone: {
    display: '(832) 447-1511',
    tel: '+18324471511',
  },

  address: {
    street: '13141 Bissonnet St #C',
    locality: 'Houston',
    region: 'Texas',
    postalCode: '77099',
  },

  hours: [
    { days: 'Mon–Fri', time: '9 AM – 7 PM' },
    { days: 'Saturday', time: '9 AM – 5 PM' },
    { days: 'Sunday', time: 'Closed' },
  ],

  links: {
    inventory: 'https://jkamalcars.com/all-inventory/',
    privacy: 'https://jkamalcars.com/privacy-policy/',
    terms: 'https://jkamalcars.com/terms-of-service/',
  },
};

// Marca

export const brand = {
  monogram: 'JK',
  wordmark: 'JOHN KAMAL CARS',
};

// Imágenes del hero

export const heroImages = {
  mobile: '/images/brand/hero_image_mobile.webp',
  desktop: '/images/brand/hero_image_desktop.webp',
};

// Comportamiento

export const behavior = {
  popupScrollTrigger: 0.5,
  popupMaxViewportWidth: 767,
};

// Metadatos

export const meta = {
  title: 'John Kamal Cars — In-House Financing in Houston, TX',
  description:
    'Bad credit or no credit, we still say yes. In-house financing in Houston for 25+ years. No credit check to apply.',
  ogImage: '/images/brand/hero_image_desktop.webp',
};

// Pagina de gracias

// Con esto en false el formulario muestra el mensaje de exito en la misma
// pagina, como pedia el documento original, en vez de redirigir.
export const redirectToThankYou = true;

export const thankYouPath = '/thank-you/';
