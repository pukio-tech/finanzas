// Bancos y billeteras donde puede estar una cuenta de ahorro.
// El "logo" es una insignia con los colores de cada banco. Si pones su imagen en
// public/bancos/<id>.svg y la indicas en `imagen`, se usa esa en su lugar.

export type Banco = {
  nombre: string;
  sigla: string;
  fondo: string;
  texto: string;
  imagen?: string;
};

export const BANCOS = {
  bcp: { nombre: "BCP", sigla: "BCP", fondo: "#002A8D", texto: "#FF7800" },
  bbva: { nombre: "BBVA", sigla: "BBVA", fondo: "#001391", texto: "#FFFFFF" },
  interbank: { nombre: "Interbank", sigla: "IBK", fondo: "#00843D", texto: "#FFFFFF" },
  scotiabank: { nombre: "Scotiabank", sigla: "S", fondo: "#D8131B", texto: "#FFFFFF" },
  nacion: { nombre: "Banco de la Nación", sigla: "BN", fondo: "#A6192E", texto: "#FFFFFF" },
  banbif: { nombre: "BanBif", sigla: "BIF", fondo: "#0B3B8C", texto: "#8DC63F" },
  pichincha: { nombre: "Banco Pichincha", sigla: "P", fondo: "#FFDD00", texto: "#0F265C" },
  mibanco: { nombre: "Mibanco", sigla: "MI", fondo: "#00753A", texto: "#FFD100" },
  arequipa: { nombre: "Caja Arequipa", sigla: "CA", fondo: "#C8102E", texto: "#FFFFFF" },
  huancayo: { nombre: "Caja Huancayo", sigla: "CH", fondo: "#E2001A", texto: "#FFFFFF" },
  yape: { nombre: "Yape", sigla: "Y", fondo: "#6C1D74", texto: "#00D3C5" },
  plin: { nombre: "Plin", sigla: "plin", fondo: "#00B5B8", texto: "#FFFFFF" },
  efectivo: { nombre: "Efectivo", sigla: "S/", fondo: "#E7F3EC", texto: "#1F6B45" },
  otro: { nombre: "Otro", sigla: "…", fondo: "#ECEEF1", texto: "#5B6470" },
} satisfies Record<string, Banco>;

export type BancoId = keyof typeof BANCOS;
export const IDS_BANCOS = Object.keys(BANCOS) as BancoId[];

export function esBanco(valor: unknown): valor is BancoId {
  return typeof valor === "string" && valor in BANCOS;
}
