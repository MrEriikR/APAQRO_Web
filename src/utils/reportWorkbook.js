import { utils, write } from 'xlsx';
import { REPORT_COLUMNS, reportMatrix } from './internalReports.js';

export function createReportWorkbook({ pets, columnKeys, format, filters = [], now = new Date(), scope = 'Todos los resultados filtrados', order = 'Nombre: ascendente' }) {
  if (!['xls', 'xlsx'].includes(format)) throw new Error('Formato de Excel no válido.');
  const limit = format === 'xls' ? 65535 : 1048575;
  if (pets.length > limit) throw new Error(`El formato ${format.toUpperCase()} admite hasta ${limit.toLocaleString('es-MX')} registros. Usa ${format === 'xls' ? 'XLSX o CSV' : 'CSV'} o reduce los resultados.`);
  const matrix = reportMatrix(pets, columnKeys, now);
  if (matrix.some((row) => row.some((cell) => String(cell).length > 32767))) throw new Error('Hay un campo demasiado largo para Excel. Descarga el reporte en CSV para conservar el texto completo.');
  const workbook = utils.book_new();
  const sheet = utils.aoa_to_sheet(matrix);
  sheet['!cols'] = REPORT_COLUMNS.filter(({ key }) => columnKeys.includes(key)).map(({ width }) => ({ wch: width }));
  sheet['!autofilter'] = { ref: sheet['!ref'] };
  utils.book_append_sheet(workbook, sheet, 'Mascotas');
  const summary = utils.aoa_to_sheet([
    ['Reporte APAQRO', 'Detalle'],
    ['Generado', now.toISOString()],
    ['Registros exportados', pets.length],
    ['Selección', scope],
    ['Orden', order],
    ['Columnas', matrix[0].join(', ')],
    ['Edad', 'Meses cumplidos a la fecha de generación; vacío cuando no se puede calcular.'],
    ['Fechas', 'Valores originales. Los filtros por día usan la zona horaria del navegador.'],
    [], ['Filtro', 'Valor'],
    ...(filters.length ? filters.map(({ label, value }) => [label, String(value)]) : [['Sin filtros', 'Todos los registros disponibles']]),
  ]);
  summary['!cols'] = [{ wch: 30 }, { wch: 85 }];
  utils.book_append_sheet(workbook, summary, 'Filtros');
  return write(workbook, { type: 'array', bookType: format === 'xls' ? 'biff8' : 'xlsx', compression: true });
}
