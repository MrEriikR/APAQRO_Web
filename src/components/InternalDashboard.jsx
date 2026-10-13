import { useEffect, useMemo, useRef, useState } from 'react';
import { internalSupabase } from '../../lib/internal-supabase.js';
import useMascotas from '../hooks/useMascotas.js';
import { normalizeSpecies } from '../utils/mascotas.js';
import {
  activeReportFilters, createReportCsv, DATE_FILTERS, DETAIL_FILTERS, EMPTY_REPORT_FILTERS,
  filterReportPets, getReportOptions, MAIN_FILTERS, REPORT_COLUMNS,
  reportFilename, reportValue, sortReportPets, validateReportFilters,
} from '../utils/internalReports.js';
import Icon from './Icon.jsx';
import '../reports.css';

function FilterField({ definition, value, options, onChange }) {
  const { key, label, type } = definition;
  const choices = definition.options || options;
  return (
    <div className="report-field">
      <label htmlFor={`report-${key}`}>{label}</label>
      {choices ? (
        <select id={`report-${key}`} name={key} value={value} onChange={onChange} aria-controls="report-results">
          <option value="">Todos</option>
          {choices.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : <input id={`report-${key}`} name={key} type={type || 'search'} min={type === 'number' ? 0 : undefined} step={type === 'number' ? 1 : undefined} value={value} onChange={onChange} placeholder={type === 'number' ? 'Sin límite' : 'Buscar…'} aria-controls="report-results" />}
    </div>
  );
}

function SelectAllCheckbox({ checked, mixed, onChange, disabled }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = mixed; }, [mixed]);
  return <input ref={ref} type="checkbox" checked={checked} disabled={disabled} onChange={onChange} aria-label="Seleccionar todos los resultados filtrados" />;
}

export default function InternalDashboard() {
  const { mascotas, loading, error, retry } = useMascotas(internalSupabase);
  const [filters, setFilters] = useState(EMPTY_REPORT_FILTERS);
  const [columnKeys, setColumnKeys] = useState(() => REPORT_COLUMNS.map(({ key }) => key));
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [sort, setSort] = useState({ key: 'nombre', direction: 'asc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [format, setFormat] = useState('xlsx');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(() => new Date());
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const options = useMemo(() => Object.fromEntries(MAIN_FILTERS.filter(({ type }) => type === 'category').map(({ key }) => [key, getReportOptions(mascotas, key)])), [mascotas]);
  const filterError = validateReportFilters(filters);
  const activeFilters = activeReportFilters(filters, options);
  const filtered = useMemo(() => sortReportPets(filterReportPets(mascotas, filters, now), sort.key, sort.direction, now), [mascotas, filters, sort, now]);
  const columns = REPORT_COLUMNS.filter(({ key }) => columnKeys.includes(key));
  const selected = filtered.filter(({ id }) => selectedIds.has(id));
  const exportRows = selected.length ? selected : filtered;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * pageSize;
  const visible = filtered.slice(offset, offset + pageSize);
  const unavailable = loading || Boolean(error);
  const locked = unavailable || exporting;
  const stats = [
    { label: 'Resultados', value: filtered.length, icon: 'note', hint: `de ${mascotas.length} registros` },
    { label: 'Perros', value: filtered.filter((pet) => normalizeSpecies(pet.especie) === 'perro').length, icon: 'dog', hint: 'en esta consulta' },
    { label: 'Gatos', value: filtered.filter((pet) => normalizeSpecies(pet.especie) === 'gato').length, icon: 'cat', hint: 'en esta consulta' },
    { label: 'Sin ficha', value: filtered.filter((pet) => !reportValue(pet, 'ficha')).length, icon: 'info', hint: 'en esta consulta' },
  ];

  function changeFilters(next) {
    setFilters(next);
    setPage(1);
    setSelectedIds(new Set());
    setNotice('');
    setExportError('');
  }

  function updateFilter(event) {
    const { name, value } = event.target;
    changeFilters({ ...filters, [name]: value });
  }

  function toggleColumn(key) {
    setColumnKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
    setNotice('');
  }

  function toggleRow(id) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setNotice('');
  }

  function refresh() {
    setSelectedIds(new Set());
    setNotice('');
    setExportError('');
    setNow(new Date());
    retry();
  }

  async function download() {
    if (locked || filterError || !exportRows.length || !columns.length) return;
    setExporting(true);
    setExportError('');
    setNotice('');
    try {
      const data = format === 'csv' ? createReportCsv(exportRows, columnKeys, now)
        : (await import('../utils/reportWorkbook.js')).createReportWorkbook({
          pets: exportRows, columnKeys, format, filters: activeFilters, now,
          scope: selected.length ? 'Filas seleccionadas dentro de los resultados filtrados' : 'Todos los resultados filtrados',
          order: `${REPORT_COLUMNS.find(({ key }) => key === sort.key).label}: ${sort.direction === 'asc' ? 'ascendente' : 'descendente'}`,
        });
      if (!mounted.current) return;
      const mime = { csv: 'text/csv;charset=utf-8', xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }[format];
      const url = URL.createObjectURL(new Blob([data], { type: mime }));
      const link = document.createElement('a');
      link.href = url;
      link.download = reportFilename(format);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30000);
      setNotice(`Descarga preparada: ${exportRows.length} registros y ${columns.length} columnas en ${format.toUpperCase()}.`);
    } catch (cause) {
      if (mounted.current) setExportError(cause instanceof Error ? cause.message : 'No pudimos generar el archivo. Inténtalo de nuevo.');
    } finally {
      if (mounted.current) setExporting(false);
    }
  }

  return (
    <div className="report-dashboard" aria-busy={loading}>
      <div className="report-toolbar">
        <p><Icon name="lock" /> Reportes del equipo · los indicadores siguen tus filtros</p>
        <button type="button" className="secondary-button" onClick={refresh} disabled={loading || exporting}><Icon name="refresh" />{loading ? 'Cargando…' : 'Actualizar datos'}</button>
      </div>

      <div className="report-stats" aria-label="Resumen de resultados filtrados">
        {stats.map((stat) => <div className="report-stat" key={stat.label}><span className="report-stat-icon"><Icon name={stat.icon} /></span><p>{stat.label}</p><strong>{unavailable || filterError ? '—' : stat.value.toLocaleString('es-MX')}</strong><small>{unavailable ? 'Esperando datos' : stat.hint}</small></div>)}
      </div>

      <fieldset className="report-panel report-filters" disabled={locked}>
        <legend className="sr-only">Filtros del reporte</legend>
        <div className="report-panel-heading"><div><h2>Construye tu consulta</h2><p>Combina los filtros; los resultados se actualizan al instante.</p></div><button type="button" className="clear-filters" disabled={!activeFilters.length} onClick={() => changeFilters(EMPTY_REPORT_FILTERS)}><Icon name="refresh" /> Limpiar filtros</button></div>
        <div className="report-filter-grid">
          <FilterField definition={{ key: 'search', label: 'Buscar en todos los campos', type: 'search' }} value={filters.search} onChange={updateFilter} />
          {MAIN_FILTERS.map((definition) => <FilterField key={definition.key} definition={definition} value={filters[definition.key]} options={options[definition.key]} onChange={updateFilter} />)}
        </div>
        <details className="report-details">
          <summary>Más filtros: fechas, datos y archivos <span>{DETAIL_FILTERS.length + DATE_FILTERS.length * 3} opciones</span></summary>
          <div className="report-filter-grid report-detail-fields">
            {DETAIL_FILTERS.map((definition) => <FilterField key={definition.key} definition={definition} value={filters[definition.key]} onChange={updateFilter} />)}
          </div>
          <div className="report-date-grid">
            {DATE_FILTERS.map(({ key, label }) => <fieldset className="report-date-range" key={key}>
              <legend>{label}</legend>
              <div className="report-range-fields">
                <label className="report-field" htmlFor={`report-${key}-desde`}><span>Desde</span><input id={`report-${key}-desde`} type="date" name={`${key}_desde`} value={filters[`${key}_desde`]} max={filters[`${key}_hasta`] || undefined} onChange={updateFilter} aria-describedby={filterError ? 'report-filter-error' : undefined} /></label>
                <label className="report-field" htmlFor={`report-${key}-hasta`}><span>Hasta</span><input id={`report-${key}-hasta`} type="date" name={`${key}_hasta`} value={filters[`${key}_hasta`]} min={filters[`${key}_desde`] || undefined} onChange={updateFilter} aria-describedby={filterError ? 'report-filter-error' : undefined} /></label>
              </div>
              <FilterField definition={{ key: `${key}_estado`, label: 'Datos de fecha', options: [{ value: 'with', label: 'Con fecha válida' }, { value: 'without', label: 'Sin fecha válida' }] }} value={filters[`${key}_estado`]} onChange={updateFilter} />
            </fieldset>)}
          </div>
          <p className="report-help">Los rangos incluyen ambos extremos. La edad se calcula en meses cumplidos; las fechas con hora se filtran según el día local.</p>
        </details>
        {activeFilters.length > 0 && <div className="report-active-filters" aria-label="Filtros activos">{activeFilters.map(({ key, label, value }) => <button key={key} type="button" onClick={() => changeFilters({ ...filters, [key]: '' })} aria-label={`Quitar filtro ${label}: ${value}`}><span>{label}: {value}</span><Icon name="close" /></button>)}</div>}
        {filterError && <p id="report-filter-error" className="field-error" role="alert">{filterError}</p>}
      </fieldset>

      <section className="report-panel report-export" aria-labelledby="report-export-title">
        <div className="report-panel-heading"><div><h2 id="report-export-title">Prepara tu descarga</h2><p>Exporta todos los resultados o marca filas específicas en la tabla.</p></div><span className="report-count">{unavailable ? '—' : exportRows.length} filas · {columns.length} columnas</span></div>
        <fieldset className="report-export-options" disabled={locked}>
          <legend className="sr-only">Opciones de exportación</legend>
          <details className="report-columns">
            <summary>Columnas de la tabla y del archivo <span>{columns.length} de {REPORT_COLUMNS.length}</span></summary>
            <div className="report-column-actions"><button type="button" className="clear-filters" onClick={() => setColumnKeys(REPORT_COLUMNS.map(({ key }) => key))}>Seleccionar todas</button><button type="button" className="clear-filters" onClick={() => setColumnKeys([])}>Quitar todas</button></div>
            <div className="report-column-grid">{REPORT_COLUMNS.map(({ key, label }) => <label key={key}><input type="checkbox" checked={columnKeys.includes(key)} onChange={() => toggleColumn(key)} />{label}</label>)}</div>
          </details>
          <div className="report-download-controls">
            <div className="report-field"><label htmlFor="report-format">Formato de descarga</label><select id="report-format" value={format} onChange={(event) => { setFormat(event.target.value); setExportError(''); setNotice(''); }}><option value="xlsx">Excel (.xlsx)</option><option value="xls">Excel 97–2003 (.xls)</option><option value="csv">CSV (.csv)</option></select></div>
            <button type="button" className="primary-button" onClick={download} disabled={locked || Boolean(filterError) || !exportRows.length || !columns.length}><Icon name="download" />{exporting ? 'Preparando archivo…' : `Descargar ${exportRows.length} ${selected.length ? 'seleccionados' : 'resultados'}`}</button>
          </div>
        </fieldset>
        <p className="report-help">La descarga incluye todas las páginas y respeta los filtros, las columnas y el orden de la tabla. Excel incluye una hoja adicional con los filtros utilizados.</p>
        {!columns.length && <p className="field-error" role="alert">Selecciona al menos una columna para ver la tabla y descargar.</p>}
        {exportError && <p className="field-error" role="alert">{exportError}</p>}
        <p className="report-feedback" role="status">{notice}</p>
      </section>

      <section id="report-results" className="report-panel report-results" aria-labelledby="report-results-title">
        <div className="report-panel-heading"><div><h2 id="report-results-title">Vista previa del reporte</h2><p role="status">{loading ? 'Cargando registros…' : error ? 'Datos no disponibles' : `${filtered.length} coincidencias${selected.length ? ` · ${selected.length} filas seleccionadas` : ' · se exportarán todos los resultados'}`}</p></div>{selected.length > 0 && <button type="button" className="clear-filters" disabled={locked} onClick={() => { setSelectedIds(new Set()); setNotice(''); }}>Quitar selección de filas</button>}</div>
        {loading ? <div className="report-empty" role="status"><Icon name="refresh" /><p>Cargando todas las mascotas…</p></div>
          : error ? <div className="report-empty" role="alert"><Icon name="info" /><h3>No pudimos cargar las mascotas</h3><p>Revisa tu conexión e intenta nuevamente.</p><button type="button" className="secondary-button" onClick={refresh}>Reintentar</button></div>
            : filterError ? <div className="report-empty"><Icon name="info" /><p>Corrige el rango indicado para consultar y descargar resultados.</p></div>
              : !filtered.length ? <div className="report-empty"><Icon name="search" /><h3>{mascotas.length ? 'No hay coincidencias' : 'Aún no hay registros'}</h3><p>{mascotas.length ? 'Ajusta los filtros o límpialos para volver a ver todas las mascotas.' : 'Las mascotas disponibles para el equipo aparecerán aquí.'}</p>{activeFilters.length > 0 && <button type="button" className="secondary-button" onClick={() => changeFilters(EMPTY_REPORT_FILTERS)}>Limpiar filtros</button>}</div>
                : columns.length > 0 && <>
                  <p className="report-table-hint">Pulsa un encabezado para ordenar. Desliza la tabla para ver todas las columnas.</p>
                  <div className="report-table-scroll" tabIndex={0} role="region" aria-label="Tabla de mascotas filtradas, desplazable">
                    <table className="report-table">
                      <caption className="sr-only">Mascotas que cumplen los filtros. La casilla del encabezado selecciona todos los resultados de todas las páginas.</caption>
                      <thead><tr><th className="report-select-cell" scope="col"><SelectAllCheckbox checked={selected.length === filtered.length} mixed={selected.length > 0 && selected.length < filtered.length} disabled={exporting} onChange={() => { setSelectedIds(selected.length === filtered.length ? new Set() : new Set(filtered.map(({ id }) => id))); setNotice(''); }} /></th>{columns.map(({ key, label }) => <th key={key} scope="col" aria-sort={sort.key === key ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button type="button" disabled={exporting} onClick={() => { setSort({ key, direction: sort.key === key && sort.direction === 'asc' ? 'desc' : 'asc' }); setPage(1); setNotice(''); }}>{label}<span aria-hidden="true">{sort.key === key ? sort.direction === 'asc' ? '↑' : '↓' : '↕'}</span></button></th>)}</tr></thead>
                      <tbody>{visible.map((pet) => <tr key={pet.id} className={selectedIds.has(pet.id) ? 'is-selected' : ''}><td className="report-select-cell"><input type="checkbox" checked={selectedIds.has(pet.id)} disabled={exporting} onChange={() => toggleRow(pet.id)} aria-label={`Seleccionar ${pet.nombre || 'mascota'} (${pet.id})`} /></td>{columns.map(({ key }) => <td key={key} className={key === 'nombre' ? 'report-name-cell' : ''}>{key === 'estatus' && reportValue(pet, key, now) ? <span className="report-status">{reportValue(pet, key, now)}</span> : reportValue(pet, key, now) === '' ? <span className="report-missing">Sin dato</span> : reportValue(pet, key, now)}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                  <div className="report-pagination"><label htmlFor="report-page-size">Filas por página<select id="report-page-size" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>{[25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}</select></label><span>{offset + 1}–{Math.min(offset + pageSize, filtered.length)} de {filtered.length}</span><div><button type="button" className="secondary-button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Página anterior"><Icon name="back" /></button><span>Página {currentPage} de {pageCount}</span><button type="button" className="secondary-button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label="Página siguiente"><Icon name="arrow" /></button></div></div>
                </>}
      </section>
    </div>
  );
}
