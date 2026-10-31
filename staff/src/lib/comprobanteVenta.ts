import { api, API_URL } from './api';

// Comprobante de venta para impresora térmica de 80 mm (área imprimible ~72 mm).
// Se arma en un iframe oculto con su propia hoja, así no imprime el menú del panel.

type ItemComprobante = { cantidad: number; precio_unitario: string; Producto: { nombre: string; codigo: string | null } };
type DatosComprobante = {
  venta: {
    id: number;
    fecha: string;
    subtotal: string | null;
    descuento_porcentaje: string;
    total: string;
    metodo_pago: 'efectivo' | 'qr';
    cliente_nombre: string | null;
    createdAt?: string;
    created_at?: string;
    Usuario: { nombre: string } | null;
    Paciente: { nombre_completo: string; codigo_paciente: string | null } | null;
    VentaItems: ItemComprobante[];
  };
  clinica: {
    nombre_consultorio: string;
    nit: string | null;
    direccion: string | null;
    ciudad: string | null;
    telefono: string | null;
    logo_url: string | null;
    pie: string | null;
  };
};

const esc = (texto: unknown) =>
  String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const bs = (monto: number) => monto.toFixed(2);

function fechaHora(venta: DatosComprobante['venta']) {
  const creada = venta.createdAt || venta.created_at;
  const d = creada ? new Date(creada) : new Date(`${venta.fecha}T00:00:00`);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function htmlComprobante({ venta, clinica }: DatosComprobante) {
  // Dirección completa: en producción API_URL es relativa (/api) y el ticket se arma aparte.
  const logo = clinica.logo_url
    ? new URL(clinica.logo_url.startsWith('/uploads/') ? `${API_URL}${clinica.logo_url}` : clinica.logo_url, window.location.href).href
    : null;
  const subtotal = venta.subtotal !== null ? Number(venta.subtotal) : Number(venta.total);
  const porcentaje = Number(venta.descuento_porcentaje) || 0;
  const total = Number(venta.total);
  const cliente = venta.Paciente?.nombre_completo || venta.cliente_nombre || 'Cliente mostrador';
  const lugar = [clinica.direccion, clinica.ciudad?.trim()].filter(Boolean).join(', ');

  const filas = venta.VentaItems.map((it) => {
    const precio = Number(it.precio_unitario);
    return `<tr><td colspan="3" class="prod">${esc(it.Producto.nombre)}</td></tr>
      <tr><td>${it.cantidad} x ${bs(precio)}</td><td></td><td class="der">${bs(it.cantidad * precio)}</td></tr>`;
  }).join('');

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Comprobante ${venta.id}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000; }
  body { width: 72mm; margin: 0 auto; padding: 3mm 0 6mm; font: 12px/1.35 Arial, Helvetica, sans-serif; }
  .centro { text-align: center; }
  .der { text-align: right; white-space: nowrap; }
  .logo { display: block; max-width: 40mm; max-height: 22mm; margin: 0 auto 2mm; object-fit: contain; filter: grayscale(1); }
  .nombre { font-size: 15px; font-weight: 700; }
  .chico { font-size: 10.5px; }
  .linea { border-top: 1px dashed #000; margin: 2.5mm 0; }
  .titulo { font-size: 13px; font-weight: 700; letter-spacing: .5px; }
  table { width: 100%; border-collapse: collapse; font: inherit; }
  td { padding: .4mm 0; vertical-align: top; }
  .prod { font-weight: 600; padding-top: 1.2mm; }
  .total td { font-size: 15px; font-weight: 700; padding-top: 1mm; }
  .dato { display: flex; justify-content: space-between; gap: 2mm; }
  .dato span:last-child { text-align: right; }
</style></head><body>
  ${logo ? `<img class="logo" src="${esc(logo)}" alt="">` : ''}
  <div class="centro">
    <div class="nombre">${esc(clinica.nombre_consultorio)}</div>
    ${clinica.nit ? `<div class="chico">NIT ${esc(clinica.nit)}</div>` : ''}
    ${lugar ? `<div class="chico">${esc(lugar)}</div>` : ''}
    ${clinica.telefono ? `<div class="chico">Tel. ${esc(clinica.telefono)}</div>` : ''}
  </div>
  <div class="linea"></div>
  <div class="centro titulo">COMPROBANTE DE VENTA</div>
  <div class="centro">N° ${String(venta.id).padStart(6, '0')}</div>
  <div class="linea"></div>
  <div class="dato"><span>Fecha</span><span>${esc(fechaHora(venta))}</span></div>
  <div class="dato"><span>Cliente</span><span>${esc(cliente)}</span></div>
  ${venta.Paciente?.codigo_paciente ? `<div class="dato"><span>Código</span><span>${esc(venta.Paciente.codigo_paciente)}</span></div>` : ''}
  ${venta.Usuario ? `<div class="dato"><span>Atendió</span><span>${esc(venta.Usuario.nombre)}</span></div>` : ''}
  <div class="linea"></div>
  <table>
    <tr class="chico"><td>Cant. x P/U (Bs)</td><td></td><td class="der">Importe</td></tr>
    ${filas}
  </table>
  <div class="linea"></div>
  <table>
    ${porcentaje > 0 ? `<tr><td>Subtotal</td><td class="der">Bs ${bs(subtotal)}</td></tr>
    <tr><td>Descuento ${esc(porcentaje)} %</td><td class="der">- Bs ${bs(subtotal - total)}</td></tr>` : ''}
    <tr class="total"><td>TOTAL</td><td class="der">Bs ${bs(total)}</td></tr>
    <tr><td>Pago</td><td class="der">${venta.metodo_pago === 'qr' ? 'QR' : 'Efectivo'}</td></tr>
  </table>
  <div class="linea"></div>
  <div class="centro">¡Gracias por su compra!</div>
  ${clinica.pie ? `<div class="centro chico">${esc(clinica.pie)}</div>` : ''}
  <div class="centro chico" style="margin-top:2mm">Este comprobante no es una factura.</div>
</body></html>`;
}

export async function imprimirComprobanteVenta(ventaId: number) {
  const datos: DatosComprobante = await api.getComprobanteVenta(ventaId);

  const marco = document.createElement('iframe');
  marco.setAttribute('aria-hidden', 'true');
  marco.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
  document.body.appendChild(marco);
  const doc = marco.contentDocument!;
  doc.open();
  doc.write(htmlComprobante(datos));
  doc.close();

  // Espera el logo (si no carga en 3 s, imprime igual sin él).
  const imagenes = Array.from(doc.images);
  await Promise.race([
    Promise.all(imagenes.map((img) => (img.complete ? null : new Promise((ok) => { img.onload = ok; img.onerror = ok; })))),
    new Promise((ok) => setTimeout(ok, 3000)),
  ]);

  const win = marco.contentWindow!;
  win.focus();
  win.print();
  // El diálogo de impresión bloquea hasta cerrarse; luego se quita el marco.
  setTimeout(() => marco.remove(), 1000);
}
