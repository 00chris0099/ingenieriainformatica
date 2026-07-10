// Ubigeo Peru - API INEI + fallback local

const INEI_API = 'https://ubigeos.api.gob.pe/estaticos/v1';

// Departamentos de Peru (hardcoded como fallback)
const DEPARTAMENTOS_FALLBACK = [
  'Amazonas', 'Ancash', 'Apurimac', 'Arequipa', 'Ayacucho', 'Cajamarca',
  'Cusco', 'Huancavelica', 'Huanuco', 'Ica', 'Junin', 'La Libertad',
  'Lambayeque', 'Lima', 'Loreto', 'Madre de Dios', 'Moquegua', 'Pasco',
  'Piura', 'Puno', 'San Martin', 'Tacna', 'Tumbes', 'Ucayali'
];

export interface Departamento { id: string; nombre: string; }
export interface Provincia { id: string; nombre: string; departamentoId: string; }
export interface Distrito { id: string; nombre: string; provinciaId: string; }

let departamentosCache: Departamento[] | null = null;
let provinciasCache: Record<string, Provincia[]> = {};
let distritosCache: Record<string, Distrito[]> = {};

export async function getDepartamentos(): Promise<Departamento[]> {
  if (departamentosCache) return departamentosCache;
  try {
    const res = await fetch(`${INEI_API}/departamentos`, { next: { revalidate: 86400 } });
    if (res.ok) {
      const data = await res.json();
      departamentosCache = data.data?.map((d: any) => ({ id: d.codigo, nombre: d.nombre })) || [];
      if (departamentosCache!.length > 0) return departamentosCache!;
    }
  } catch {}
  // Fallback
  departamentosCache = DEPARTAMENTOS_FALLBACK.map((d, i) => ({ id: String(i + 1).padStart(2, '0'), nombre: d }));
  return departamentosCache!;
}

export async function getProvincias(departamentoId: string): Promise<Provincia[]> {
  if (provinciasCache[departamentoId]) return provinciasCache[departamentoId];
  try {
    const res = await fetch(`${INEI_API}/provincias?departamento=${departamentoId}`, { next: { revalidate: 86400 } });
    if (res.ok) {
      const data = await res.json();
      provinciasCache[departamentoId] = data.data?.map((p: any) => ({ id: p.codigo, nombre: p.nombre, departamentoId })) || [];
      if (provinciasCache[departamentoId].length > 0) return provinciasCache[departamentoId];
    }
  } catch {}
  provinciasCache[departamentoId] = [];
  return provinciasCache[departamentoId];
}

export async function getDistritos(provinciaId: string): Promise<Distrito[]> {
  if (distritosCache[provinciaId]) return distritosCache[provinciaId];
  try {
    const res = await fetch(`${INEI_API}/distritos?provincia=${provinciaId}`, { next: { revalidate: 86400 } });
    if (res.ok) {
      const data = await res.json();
      distritosCache[provinciaId] = data.data?.map((d: any) => ({ id: d.codigo, nombre: d.nombre, provinciaId })) || [];
      if (distritosCache[provinciaId].length > 0) return distritosCache[provinciaId];
    }
  } catch {}
  distritosCache[provinciaId] = [];
  return distritosCache[provinciaId];
}

// Validate Peru phone: 9 digits starting with 9
export function isValidPeruPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '');
  return /^9\d{8}$/.test(cleaned);
}

// Validate email
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
