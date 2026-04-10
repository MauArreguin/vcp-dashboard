// ============================================================
// DASHBOARD VENDE COMO PRO — THE APPOINTMENT ENGINE
// Apps Script: expone datos del Sheet como JSON para el dashboard
// Pegar en: Extensions > Apps Script > Guardar > Deploy > Web App
// ============================================================

// ID de tu spreadsheet (ya está en la URL)
const SPREADSHEET_ID = '1glJZS_ECarsMjLH-xi0LwNYz4UBk2lTI8B3jaWdYre0';

// Nombres exactos de tus pestañas
const SHEET_META    = 'META Campañas Captación';   // ajusta si el nombre es diferente
const SHEET_GOOGLE  = 'GOOGLE Campañas Captación'; // ajusta si el nombre es diferente
const SHEET_REGS    = 'V1 Regisros Long'; // pestaña de registros

// Presupuesto mensual autorizado (cámbialo aquí cada mes)
const PRESUPUESTO_TOTAL  = 4000;
const PRESUPUESTO_META   = 3500;
const PRESUPUESTO_GOOGLE = 500;
const PRESUPUESTO_SEMANAL = 1000;

// Corte de semanas: miércoles a martes
// Formato: [inicio, fin] en 'YYYY-MM-DD'
const SEMANAS_ABRIL_2026 = [
  { id: 's1', label: 'Sem 1 · mié 1 — mar 7 abr',  inicio: '2026-04-01', fin: '2026-04-07' },
  { id: 's2', label: 'Sem 2 · mié 8 — mar 14 abr', inicio: '2026-04-08', fin: '2026-04-14' },
  { id: 's3', label: 'Sem 3 · mié 15 — mar 21 abr',inicio: '2026-04-15', fin: '2026-04-21' },
  { id: 's4', label: 'Sem 4 · mié 22 — mar 28 abr',inicio: '2026-04-22', fin: '2026-04-28' },
];

// ============================================================
// PUNTO DE ENTRADA — GET
// ============================================================
function doGet(e) {
  const action = e.parameter.action || 'all';
  let result;

  try {
    switch (action) {
      case 'meta':    result = getMetaData();    break;
      case 'google':  result = getGoogleData();  break;
      case 'regs':    result = getRegistros();   break;
      case 'utms':    result = getUTMs();        break;
      case 'all':
      default:        result = getAllData();      break;
    }
  } catch (err) {
    result = { error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// DATOS COMPLETOS (llamada principal del dashboard)
// ============================================================
function getAllData() {
  const meta   = getMetaData();
  const google = getGoogleData();
  const regs   = getRegistros();
  const utms   = getUTMs();

  // Totales globales
  const invTotal   = meta.mesTotal.inversion + google.mesTotal.inversion;
  const leadsTotal = meta.mesTotal.leads + google.mesTotal.leads;
  const cplGlobal  = leadsTotal > 0 ? +(invTotal / leadsTotal).toFixed(2) : 0;

  return {
    actualizado: new Date().toLocaleDateString('es-MX'),
    presupuesto: {
      total:   PRESUPUESTO_TOTAL,
      meta:    PRESUPUESTO_META,
      google:  PRESUPUESTO_GOOGLE,
      semanal: PRESUPUESTO_SEMANAL,
    },
    global: {
      inversion:  invTotal,
      leads:      leadsTotal,
      cpl:        cplGlobal,
      pctEjecutado: +((invTotal / PRESUPUESTO_TOTAL) * 100).toFixed(1),
    },
    meta,
    google,
    registros: regs,
    utms,
    semanas: SEMANAS_ABRIL_2026,
  };
}

// ============================================================
// META ADS — lee la pestaña de Meta
// ============================================================
function getMetaData() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  // Busca la hoja que contenga "Meta" y "Abril" en el nombre
  const sheet = findSheet(ss, ['Meta', 'Abril']);
  if (!sheet) return { error: 'Pestaña Meta ADS no encontrada' };

  const data  = sheet.getDataRange().getValues();

  // Busca la fila de encabezados (contiene "Fecha" y "Gasto")
  let headerRow = -1;
  for (let i = 0; i < data.length; i++) {
    const row = data[i].map(c => String(c).toLowerCase());
    if (row.includes('fecha') && row.some(c => c.includes('gasto'))) {
      headerRow = i;
      break;
    }
  }
  if (headerRow === -1) return { error: 'Encabezados no encontrados en Meta ADS' };

  const headers = data[headerRow].map(c => String(c).toLowerCase().trim());
  const iDate   = headers.findIndex(h => h === 'fecha');
  const iSpend  = headers.findIndex(h => h.includes('gasto por dia') || h.includes('gasto por día'));
  const iLeads  = headers.findIndex(h => h === 'leads fb');
  const iLeadsCRM = headers.findIndex(h => h === 'leads crm');

  const dias = [];
  let totalInversion = 0;
  let totalLeads = 0;

  for (let i = headerRow + 1; i < data.length; i++) {
    const row = data[i];
    const fechaRaw = row[iDate];
    if (!fechaRaw) continue;

    const fecha = parseFecha(fechaRaw);
    if (!fecha) continue;

    const gasto = parseNum(row[iSpend]);
    const leads = parseNum(row[iLeads]);
    const leadsCRM = parseNum(row[iLeadsCRM]);

    if (gasto === 0 && leads === 0 && leadsCRM === 0) continue; // fila vacía

    totalInversion += gasto;
    totalLeads += leads;

    dias.push({
      fecha:    fecha,
      gasto:    gasto,
      leads:    leads,
      leadsCRM: leadsCRM,
      cpl:      leads > 0 ? +(gasto / leads).toFixed(2) : 0,
    });
  }

  // Agrupa por semana
  const porSemana = agruparPorSemana(dias);

  return {
    mesTotal: {
      inversion: +totalInversion.toFixed(2),
      leads:     totalLeads,
      cpl:       totalLeads > 0 ? +(totalInversion / totalLeads).toFixed(2) : 0,
      pctPresupuesto: +((totalInversion / PRESUPUESTO_META) * 100).toFixed(1),
    },
    dias,
    porSemana,
  };
}

// ============================================================
// GOOGLE ADS — lee la pestaña de Google
// ============================================================
function getGoogleData() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = findSheet(ss, ['Google', 'Abril']);
  if (!sheet) return { mesTotal: { inversion: 0, leads: 0, cpl: 0, pctPresupuesto: 0 }, dias: [], porSemana: {} };

  const data  = sheet.getDataRange().getValues();

  let headerRow = -1;
  for (let i = 0; i < data.length; i++) {
    const row = data[i].map(c => String(c).toLowerCase());
    if (row.some(c => c.includes('day') || c === 'fecha') && row.some(c => c.includes('spent') || c.includes('gasto'))) {
      headerRow = i;
      break;
    }
  }
  if (headerRow === -1) return { mesTotal: { inversion: 0, leads: 0, cpl: 0, pctPresupuesto: 0 }, dias: [], porSemana: {} };

  const headers  = data[headerRow].map(c => String(c).toLowerCase().trim());
  const iDate    = headers.findIndex(h => h === 'day' || h === 'fecha');
  const iSpend   = headers.findIndex(h => h.includes('spent') || h.includes('gasto'));
  const iLeads   = headers.findIndex(h => h === 'leads' || h.includes('leads'));

  const dias = [];
  let totalInversion = 0, totalLeads = 0;

  for (let i = headerRow + 1; i < data.length; i++) {
    const row = data[i];
    const fechaRaw = row[iDate];
    if (!fechaRaw) continue;
    const fecha = parseFecha(fechaRaw);
    if (!fecha) continue;

    const gasto  = parseNum(row[iSpend]);
    const leads  = iLeads >= 0 ? parseNum(row[iLeads]) : 0;

    if (gasto === 0 && leads === 0) continue;

    totalInversion += gasto;
    totalLeads += leads;
    dias.push({ fecha, gasto: +gasto.toFixed(2), leads, cpl: leads > 0 ? +(gasto/leads).toFixed(2) : 0 });
  }

  return {
    mesTotal: {
      inversion: +totalInversion.toFixed(2),
      leads:     totalLeads,
      cpl:       totalLeads > 0 ? +(totalInversion / totalLeads).toFixed(2) : 0,
      pctPresupuesto: +((totalInversion / PRESUPUESTO_GOOGLE) * 100).toFixed(1),
    },
    dias,
    porSemana: agruparPorSemana(dias),
  };
}

// ============================================================
// REGISTROS — conteo por país y por UTM
// ============================================================
function getRegistros() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = findSheet(ss, ['Registro', 'Office']);
  if (!sheet) return { total: 0, porPais: {}, porFecha: {} };

  const data    = sheet.getDataRange().getValues();

  // Encuentra encabezados
  let headerRow = -1;
  for (let i = 0; i < data.length; i++) {
    const row = data[i].map(c => String(c).toLowerCase());
    if (row.some(c => c.includes('numero') || c.includes('número'))) {
      headerRow = i;
      break;
    }
  }
  if (headerRow === -1) return { total: 0, porPais: {}, porFecha: {} };

  const headers  = data[headerRow].map(c => String(c).toLowerCase().trim());
  const iNumero  = headers.findIndex(h => h.includes('numero') || h.includes('número'));
  const iFecha   = headers.findIndex(h => h.includes('fecha'));
  const iCamp    = headers.findIndex(h => h.includes('utm cam'));
  const iConj    = headers.findIndex(h => h.includes('utm con'));
  const iAd      = headers.findIndex(h => h.includes('utm anu'));

  const paisesCodigos = {
    '+52': 'MX', '+57': 'CO', '+1': 'US', '+34': 'ES',
    '+54': 'AR', '+58': 'VE', '+598': 'UY', '+56': 'CL',
    '+593': 'EC', '+1809': 'DO', '+1829': 'DO', '+1849': 'DO',
    '+51': 'PE', '+502': 'GT', '+503': 'SV',
  };

  const porPais  = {};
  const porFecha = {};
  let total = 0;
  const registros = [];

  for (let i = headerRow + 1; i < data.length; i++) {
    const row = data[i];
    const numero = String(row[iNumero] || '').trim();
    const fecha  = iFecha >= 0 ? parseFecha(row[iFecha]) : null;
    const camp   = String(row[iCamp] || '').trim();
    const conj   = String(row[iConj] || '').trim();
    const ad     = String(row[iAd]   || '').trim();

    if (!numero && !fecha && !camp) continue;

    // Detectar país por prefijo
    let pais = 'otros';
    const limpio = numero.replace(/[\s\-\(\)]/g, '');
    if (limpio && limpio !== '#ERROR!') {
      // Ordena por longitud de prefijo (más largo primero para evitar falsos positivos)
      const prefijos = Object.keys(paisesCodigos).sort((a, b) => b.length - a.length);
      for (const pref of prefijos) {
        if (limpio.startsWith(pref)) {
          pais = paisesCodigos[pref];
          break;
        }
      }
    }

    porPais[pais] = (porPais[pais] || 0) + 1;
    if (fecha) porFecha[fecha] = (porFecha[fecha] || 0) + 1;
    total++;

    if (camp || conj || ad) {
      registros.push({ fecha, camp, conj, ad, pais });
    }
  }

  // Agrupa registros por semana
  const porSemana = {};
  SEMANAS_ABRIL_2026.forEach(sem => {
    const ini = new Date(sem.inicio);
    const fin = new Date(sem.fin);
    const regsEnSemana = registros.filter(r => {
      if (!r.fecha) return false;
      const d = new Date(r.fecha);
      return d >= ini && d <= fin;
    });

    // Conteo de países en la semana
    const paises = {};
    regsEnSemana.forEach(r => { paises[r.pais] = (paises[r.pais] || 0) + 1; });
    porSemana[sem.id] = { total: regsEnSemana.length, porPais: paises };
  });

  return { total, porPais, porFecha, porSemana };
}

// ============================================================
// UTMs — top 5 combinaciones por leads (registros)
// ============================================================
function getUTMs() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = findSheet(ss, ['Registro', 'Office']);
  if (!sheet) return { mesTop5: [], porSemana: {} };

  const data    = sheet.getDataRange().getValues();

  let headerRow = -1;
  for (let i = 0; i < data.length; i++) {
    const row = data[i].map(c => String(c).toLowerCase());
    if (row.some(c => c.includes('utm cam'))) { headerRow = i; break; }
  }
  if (headerRow === -1) return { mesTop5: [], porSemana: {} };

  const headers = data[headerRow].map(c => String(c).toLowerCase().trim());
  const iFecha  = headers.findIndex(h => h.includes('fecha'));
  const iCamp   = headers.findIndex(h => h.includes('utm cam'));
  const iConj   = headers.findIndex(h => h.includes('utm con'));
  const iAd     = headers.findIndex(h => h.includes('utm anu'));

  // Acumula combinaciones
  const acumulaMapa = (mapa, camp, conj, ad) => {
    if (!camp || camp === 'utm' || camp === '') return;
    const key = `${camp}|||${conj}|||${ad}`;
    if (!mapa[key]) mapa[key] = { camp, conj, ad, leads: 0 };
    mapa[key].leads++;
  };

  const mapaTotal = {};
  const mapasSemana = {};
  SEMANAS_ABRIL_2026.forEach(s => { mapasSemana[s.id] = {}; });

  for (let i = headerRow + 1; i < data.length; i++) {
    const row  = data[i];
    const fecha = iFecha >= 0 ? parseFecha(row[iFecha]) : null;
    const camp  = String(row[iCamp] || '').trim();
    const conj  = String(row[iConj] || '').trim();
    const ad    = String(row[iAd]   || '').trim();

    acumulaMapa(mapaTotal, camp, conj, ad);

    // Por semana
    if (fecha) {
      const d = new Date(fecha);
      SEMANAS_ABRIL_2026.forEach(sem => {
        if (d >= new Date(sem.inicio) && d <= new Date(sem.fin)) {
          acumulaMapa(mapasSemana[sem.id], camp, conj, ad);
        }
      });
    }
  }

  const top5 = (mapa) => Object.values(mapa)
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 5)
    .map(item => ({
      camp: limpiarUTM(item.camp),
      conj: limpiarUTM(item.conj),
      ad:   limpiarUTM(item.ad),
      campFull: item.camp,
      conjFull: item.conj,
      adFull:   item.ad,
      leads:    item.leads,
    }));

  const porSemana = {};
  SEMANAS_ABRIL_2026.forEach(s => { porSemana[s.id] = top5(mapasSemana[s.id]); });

  return {
    mesTop5: top5(mapaTotal),
    porSemana,
  };
}

// ============================================================
// UTILIDADES
// ============================================================

// Encuentra la hoja que contenga todas las palabras clave
function findSheet(ss, keywords) {
  const sheets = ss.getSheets();
  return sheets.find(sh => {
    const name = sh.getName().toLowerCase();
    return keywords.every(kw => name.includes(kw.toLowerCase()));
  }) || null;
}

// Convierte fecha de distintos formatos a 'YYYY-MM-DD'
function parseFecha(raw) {
  if (!raw) return null;
  if (raw instanceof Date) {
    if (isNaN(raw)) return null;
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, '0');
    const d = String(raw.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(raw).trim();
  // Formato DD/MM/YYYY
  const dm = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dm) return `${dm[3]}-${dm[2].padStart(2,'0')}-${dm[1].padStart(2,'0')}`;
  // Formato YYYY-MM-DD
  const ym = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ym) return s;
  return null;
}

// Convierte valor a número (elimina $, comas, etc.)
function parseNum(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const n = parseFloat(String(val).replace(/[$,\s]/g, ''));
  return isNaN(n) ? 0 : n;
}

// Agrupa array de {fecha, gasto, leads} por semana definida en SEMANAS_ABRIL_2026
function agruparPorSemana(dias) {
  const resultado = {};
  SEMANAS_ABRIL_2026.forEach(sem => {
    const ini = new Date(sem.inicio);
    const fin = new Date(sem.fin);
    const diasEnSemana = dias.filter(d => {
      const f = new Date(d.fecha);
      return f >= ini && f <= fin;
    });
    const inversion = diasEnSemana.reduce((a, d) => a + d.gasto, 0);
    const leads     = diasEnSemana.reduce((a, d) => a + d.leads, 0);
    resultado[sem.id] = {
      dias:      diasEnSemana,
      inversion: +inversion.toFixed(2),
      leads,
      cpl:       leads > 0 ? +(inversion / leads).toFixed(2) : 0,
      pctPresupuesto: +((inversion / PRESUPUESTO_SEMANAL) * 100).toFixed(1),
    };
  });
  return resultado;
}

// Acorta el string UTM para mostrar en el dashboard (máx 40 chars)
function limpiarUTM(utm) {
  if (!utm || utm === 'utm') return '—';
  // Extrae la parte legible después del último '|'
  const partes = utm.split('|').map(p => p.trim()).filter(Boolean);
  if (partes.length === 0) return utm;
  // Regresa las últimas 2 partes como label corto
  return partes.slice(-2).join(' · ');
}

// ============================================================
// TEST — ejecuta esto manualmente para probar sin deploy
// ============================================================
function testLocal() {
  const result = getAllData();
  Logger.log(JSON.stringify(result, null, 2));
}
