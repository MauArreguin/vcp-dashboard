# 📊 Dashboard — The Appointment Engine
### Vende Como Pro · Meta ADS + Google ADS

Dashboard dinámico de desempeño publicitario para el funnel **The Appointment Engine**. Muestra inversión, leads, CPL, registros por país y rendimiento de UTMs por semana (miércoles a martes) y mes completo.

---

## 🗂️ Estructura del repositorio

```
vcp-dashboard/
├── index.html              ← Dashboard completo (abre en cualquier navegador)
├── scripts/
│   └── appsscript.gs       ← Backend: Google Apps Script (Web App)
├── docs/
│   └── setup.md            ← Guía de instalación paso a paso
└── README.md
```

---

## 🚀 Instalación rápida

### 1. Dashboard (frontend)
- Descarga `index.html`
- Ábrelo directo en el navegador **o** súbelo a GitHub Pages
- Sin dependencias externas — todo está incluido

### 2. Conectar datos reales (Apps Script)
1. Abre tu Google Sheet → **Extensions → Apps Script**
2. Pega el contenido de `scripts/appsscript.gs`
3. Ajusta los nombres de tus pestañas en las constantes del inicio
4. Ejecuta `testLocal()` para verificar que los datos salen bien
5. **Deploy → New deployment → Web App** → Anyone → Deploy
6. Copia la URL generada
7. En `index.html` pega la URL en la variable `APPS_SCRIPT_URL`

---

## 📋 Secciones del dashboard

| Sección | Datos |
|---|---|
| Resumen del mes | Inversión + leads por plataforma (globales, Meta, Google) |
| Rendimiento diario | Gasto y leads día a día con gráfica |
| Presupuesto semanal | % ejecutado vs $1,000/semana |
| Tabla por plataforma | Inversión, leads y CPL desglosado |
| CPL diario | Tendencia real vs meta ($1.90) |
| Registros por país | Lista + donut — México, Colombia, USA, etc. |
| Top 5 UTMs | Mejor combinación campaña + conjunto + anuncio |

Cada sección responde al selector de periodo: **Sem 1 / Sem 2 / Sem 3 / Sem 4 / Todo el mes**

---

## ⚙️ Configuración

Las semanas van de **miércoles a martes**. Para cambiar el mes o el presupuesto edita estas constantes en `appsscript.gs`:

```javascript
const PRESUPUESTO_TOTAL   = 4000;
const PRESUPUESTO_META    = 3500;
const PRESUPUESTO_GOOGLE  = 500;
const PRESUPUESTO_SEMANAL = 1000;
```

---

## 🔧 Stack

- **Frontend**: HTML + CSS + Chart.js (sin frameworks)
- **Backend**: Google Apps Script (Web App como API JSON)
- **Datos**: Google Sheets (Meta ADS, Google ADS, Registros)
- **Hosting opcional**: GitHub Pages (gratis)

---

## 📁 Pestañas del Google Sheet esperadas

| Pestaña | Uso |
|---|---|
| `Meta ADS Abril` | Gasto diario, leads FB, leads CRM |
| `Google ADS Abril` | Gasto diario, leads |
| `V1 Registros The Office` | Registros con UTMs y números de teléfono |

---

*Proyecto: Vende Como Pro — The Appointment Engine*
