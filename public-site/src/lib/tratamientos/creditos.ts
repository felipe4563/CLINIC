import type { Credito } from './tipos';

// Foto de cada página, por slug. El archivo es public/tratamientos/<slug>.jpg.
// Solo Unsplash License, Pexels License o Wikimedia Commons (CC0 / CC BY / CC BY-SA).
export const CREDITOS: Record<string, Credito> = {
  'microneedling': { autor: 'Hotel Costa Calero - Talaso & Spa', sitio: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:MASAJE_FACIAL.jpg', licencia: 'CC0 1.0', licenciaUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  'masajes-relajantes': { autor: 'IQP', sitio: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Spa_Picture_2.jpg', licencia: 'CC BY-SA 3.0', licenciaUrl: 'https://creativecommons.org/licenses/by-sa/3.0/' },
  'masajes-descontracturantes': { autor: 'gaelx', sitio: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Massage_on_shoulder.jpg', licencia: 'CC BY-SA 2.0', licenciaUrl: 'https://creativecommons.org/licenses/by-sa/2.0/' },
  'obstetricia': { autor: 'Joanna Malinowska', sitio: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Expecting_(Unsplash).jpg', licencia: 'CC0 1.0', licenciaUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  'control-prenatal': { autor: 'Suhyeon Choi', sitio: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Mom_(Unsplash).jpg', licencia: 'CC0 1.0', licenciaUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  'control-presion-arterial': { autor: 'rawpixel.com', sitio: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Blood_pressure_monitoring.jpg', licencia: 'CC0 1.0', licenciaUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' },
};
