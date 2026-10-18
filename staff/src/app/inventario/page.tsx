'use client';

import InventarioPorLugar from './InventarioPorLugar';

// Inventario = material de la oficina por lugar (planillas de la clínica).
// Los productos (para vender, activos y mantenimiento) están en Ventas.
export default function InventarioPage() {
  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Inventario</h1>
      <InventarioPorLugar />
    </div>
  );
}
