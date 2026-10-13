import type { Credito } from './tipos';

// Foto de cada página, por slug. El archivo es public/tratamientos/<slug>.jpg.
// Solo Unsplash License, Pexels License o Wikimedia Commons (CC0 / CC BY / CC BY-SA).
export const CREDITOS: Record<string, Credito> = {
  'microneedling': { autor: 'Hotel Costa Calero - Talaso & Spa', sitio: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:MASAJE_FACIAL.jpg', licencia: 'CC0 1.0' },
  'peelings-medicos': { autor: 'Sérgio (Savaman) Savarese', sitio: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Facial_mask.jpg', licencia: 'CC BY 2.0' },
  'masajes-relajantes': { autor: 'IQP', sitio: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Spa_Picture_2.jpg', licencia: 'CC BY-SA 3.0' },
  'masajes-descontracturantes': { autor: 'gaelx', sitio: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Massage_on_shoulder.jpg', licencia: 'CC BY-SA 2.0' },
  'masajes-reductores': { autor: 'Pattymooney', sitio: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Massage-abdomen.jpg', licencia: 'CC BY-SA 3.0' },
  'terapia-manual': { autor: 'Lubyanka', sitio: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Massage-hand-4.jpg', licencia: 'CC BY-SA 3.0' },
  'rehabilitacion': { autor: 'Kalyanamkaroti', sitio: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Physiotherapy_Centre.jpg', licencia: 'CC BY-SA 4.0' },
  'papanicolau': { autor: 'Mikael Häggström', sitio: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Normal_vaginal_flora_on_Pap_stain.jpg', licencia: 'CC0 1.0' },
  'obstetricia': { autor: 'Joanna Malinowska', sitio: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Expecting_(Unsplash).jpg', licencia: 'CC0 1.0' },
  'control-prenatal': { autor: 'Suhyeon Choi', sitio: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Mom_(Unsplash).jpg', licencia: 'CC0 1.0' },
  'ecografia-ginecologica': { autor: 'Scott', sitio: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Ultrasound_examination_of_woman.JPG', licencia: 'CC BY-SA 3.0' },
  'ecografia-abdominal': { autor: 'Shixart1985', sitio: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Medical_examination_room_with_ultrasound_equipment.jpg', licencia: 'CC BY 2.0' },
  'consulta-ginecologica': { autor: 'Shixart1985', sitio: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Modern_medical_examination_room.jpg', licencia: 'CC BY 2.0' },
  'control-presion-arterial': { autor: 'rawpixel.com', sitio: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Blood_pressure_monitoring.jpg', licencia: 'CC0 1.0' },
  'sueros': { autor: 'BarbariSka88', sitio: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:%D0%98%D0%BD%D1%84%D1%83%D0%B7%D0%B8%D0%BE%D0%BD%D0%BD%D0%B0%D1%8F_%D1%81%D0%B8%D1%81%D1%82%D0%B5%D0%BC%D0%B0.jpg', licencia: 'CC0 1.0' },
};
