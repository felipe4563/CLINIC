import type { Metadata } from 'next';
import MarcoTratamiento from '@/components/tratamiento/MarcoTratamiento';
import PerfilProfesional from '@/components/equipo/PerfilProfesional';
import { TRATAMIENTOS } from '@/lib/tratamientos';

type Props = { params: Promise<{ slug: string }> };

// El título lo pone el perfil al cargar (con el nombre del profesional).
export const metadata: Metadata = {
  description: 'Conoce a los profesionales de Clinic NovagED, medicina estética en Cochabamba.',
};

// El perfil se carga desde la API en el navegador (lo edita el panel). Aquí solo se
// pasa la lista liviana de tratamientos para enlazar los servicios que atiende.
export default async function PaginaProfesional({ params }: Props) {
  const { slug } = await params;
  const tratamientos = TRATAMIENTOS.map((t) => ({ nombre: t.nombre, slug: t.slug }));
  return (
    <MarcoTratamiento>
      <PerfilProfesional slug={slug} tratamientos={tratamientos} />
    </MarcoTratamiento>
  );
}
