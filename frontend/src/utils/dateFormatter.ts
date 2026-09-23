export function formatarData(dataInfo: string | Date | null | undefined): string {
  if (!dataInfo) return '';

  const data = new Date(dataInfo);

  if (isNaN(data.getTime())) return '';

  const dia = String(data.getUTCDate()).padStart(2, '0');
  const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
  const ano = data.getUTCFullYear();

  return `${dia}/${mes}/${ano}`;
}