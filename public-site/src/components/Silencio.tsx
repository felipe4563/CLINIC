'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

const imagenes = [
  '/novaged-assets/espacioNovaged1-QkEOIec4.png',
  '/novaged-assets/espacioNovaged2-LdioIfWD.png',
  '/novaged-assets/espacioNovaged3-DleDOZPB.png',
  '/novaged-assets/espacioNovaged4-C69PBbY7.png',
];

export default function Silencio() {
  const [activo, setActivo] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActivo((v) => (v + 1) % imagenes.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="nuestros-espacios" className="relative flex h-screen items-center justify-center overflow-hidden text-cream text-center">
      {imagenes.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt="Espacios de Clinic NovagED"
          fill
          className={`object-cover transition-opacity duration-1000 ${i === activo ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 px-6">
        <h2 className="font-serif text-7xl md:text-8xl xl:text-[128px] leading-none">Silencio</h2>
        <p className="mt-4 text-cream/90">El primer tratamiento comienza antes de entrar al box</p>
      </div>
      <div className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {imagenes.map((src, i) => (
          <button
            key={src}
            onClick={() => setActivo(i)}
            aria-label={`Ver imagen ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === activo ? 'w-6 bg-cream' : 'w-1.5 bg-cream/50'}`}
          />
        ))}
      </div>
    </section>
  );
}
