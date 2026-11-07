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

  const unidades = venta.VentaItems.reduce((n, it) => n + it.cantidad, 0);

  const filas = venta.VentaItems.map((it) => {
    const precio = Number(it.precio_unitario);
    return `<div class="item">
      <div class="prod">${esc(it.Producto.nombre)}</div>
      <div class="fila"><span class="gris">${it.cantidad} × ${bs(precio)}</span><span class="importe">${bs(it.cantidad * precio)}</span></div>
    </div>`;
  }).join('');

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Comprobante ${venta.id}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000; }
  /* Ancho fluido: se ajusta al área imprimible de la impresora sin cortar el borde derecho. */
  body { width: 100%; max-width: 76mm; margin: 0 auto; padding: 4mm 4mm 8mm; font: 11.5px/1.35 Arial, Helvetica, sans-serif; font-variant-numeric: tabular-nums; }
  .centro { text-align: center; }
  .chico { font-size: 10px; }
  .gris { color: #222; }
  .logo { display: block; max-width: 30mm; max-height: 20mm; margin: 0 auto 2mm; object-fit: contain; filter: grayscale(1); }
  .nombre { font-size: 16px; font-weight: 700; letter-spacing: .3px; }
  .contacto { font-size: 10px; margin-top: .8mm; }
  .linea { border-top: 1px dashed #000; margin: 3mm 0; }
  .banda { background: #000; color: #fff; text-align: center; font-weight: 700; font-size: 12px; letter-spacing: 1.5px; padding: 1.4mm 0; margin-top: 3mm; }
  .numero { text-align: center; font-size: 15px; font-weight: 700; margin: 1.5mm 0 0; letter-spacing: 1px; }
  .fila { display: flex; justify-content: space-between; align-items: baseline; gap: 3mm; }
  .fila > span:last-child { text-align: right; overflow-wrap: anywhere; }
  .rotulo { font-size: 9.5px; text-transform: uppercase; letter-spacing: .6px; white-space: nowrap; }
  .datos .fila { padding: .3mm 0; }
  .cabecera { font-size: 9.5px; text-transform: uppercase; letter-spacing: .6px; border-bottom: 1px solid #000; padding-bottom: 1mm; margin-bottom: .5mm; }
  .item { padding: 1.6mm 0; border-bottom: 1px dotted #000; }
  .item:last-child { border-bottom: 0; }
  .prod { font-weight: 700; }
  .importe { font-weight: 700; white-space: nowrap; }
  .totales .fila { padding: .4mm 0; }
  .total { border-top: 2px solid #000; border-bottom: 2px solid #000; margin: 1.5mm 0; padding: 1.5mm 0 !important; font-size: 17px; font-weight: 700; }
  .pago { display: inline-block; border: 1.5px solid #000; border-radius: 1mm; padding: 0 2mm; font-weight: 700; }
  .gracias { font-size: 13px; font-weight: 700; margin-bottom: .8mm; }
</style></head><body>
  ${logo ? `<img class="logo" src="${esc(logo)}" alt="">` : ''}
  <div class="centro">
    <div class="nombre">${esc(clinica.nombre_consultorio)}</div>
    ${clinica.nit ? `<div class="contacto">NIT ${esc(clinica.nit)}</div>` : ''}
    ${lugar ? `<div class="contacto">${esc(lugar)}</div>` : ''}
    ${clinica.telefono ? `<div class="contacto">Tel. ${esc(clinica.telefono)}</div>` : ''}
  </div>
  <div class="banda">COMPROBANTE DE VENTA</div>
  <div class="numero">N° ${String(venta.id).padStart(6, '0')}</div>
  <div class="linea"></div>
  <div class="datos">
    <div class="fila"><span class="rotulo">Fecha</span><span>${esc(fechaHora(venta))}</span></div>
    <div class="fila"><span class="rotulo">Cliente</span><span>${esc(cliente)}</span></div>
    ${venta.Paciente?.codigo_paciente ? `<div class="fila"><span class="rotulo">Código</span><span>${esc(venta.Paciente.codigo_paciente)}</span></div>` : ''}
    ${venta.Usuario ? `<div class="fila"><span class="rotulo">Atendió</span><span>${esc(venta.Usuario.nombre)}</span></div>` : ''}
  </div>
  <div class="linea"></div>
  <div class="fila cabecera"><span>Detalle (Bs)</span><span>Importe</span></div>
  <div>${filas}</div>
  <div class="linea"></div>
  <div class="totales">
    <div class="fila chico"><span>${unidades} ${unidades === 1 ? 'artículo' : 'artículos'}</span><span></span></div>
    ${porcentaje > 0 ? `<div class="fila"><span>Subtotal</span><span>Bs ${bs(subtotal)}</span></div>
    <div class="fila"><span>Descuento ${esc(porcentaje)} %</span><span>- Bs ${bs(subtotal - total)}</span></div>` : ''}
    <div class="fila total"><span>TOTAL</span><span>Bs ${bs(total)}</span></div>
    <div class="fila"><span>Forma de pago</span><span class="pago">${venta.metodo_pago === 'qr' ? 'QR' : 'EFECTIVO'}</span></div>
  </div>
  <div class="linea"></div>
  <div class="centro gracias">¡Gracias por su compra!</div>
  ${clinica.pie ? `<div class="centro chico" style="letter-spacing:1px">${esc(clinica.pie)}</div>` : ''}
  <div class="centro chico" style="margin-top:2.5mm">Este comprobante no es una factura.</div>
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
