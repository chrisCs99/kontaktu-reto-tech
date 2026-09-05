# Kontaktu — Ficha de contacto

Reto técnico de Kontaktu: la pantalla de detalle de contacto que un agente inmobiliario abriría antes de llamar, construida contra un dataset real de heterogeneidad (`src/data/contactos.json`). Ver el enunciado completo en [`docs/tech-spec-ficha-contactos.md`](docs/tech-spec-ficha-contactos.md).

## Cómo correrlo en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). El listado (`/`) enlaza a cada ficha (`/contactos/[id]`). Ambas páginas consumen `/api/contacts` y `/api/contacts/[id]` — nunca importan el JSON directamente (R8) — con una latencia simulada de ~0.5-0.9s para que los estados de carga sean reales, no cosméticos.

## Stack y por qué es un solo repo

Next.js (App Router) + TypeScript + Tailwind v4, un único proyecto. El propio reto pide servir el JSON "a través de un route handler o server action" — es decir, el "backend" es la capa `src/lib/*` + las route handlers de `src/app/api`, no un servicio aparte. Separar en dos repos (frontend/backend) habría sido sobre-ingeniería para el alcance.

## User stories elegidas: por qué estas 3 y no otras

De las 10 abiertas, elegí **Teléfonos siempre bien**, **Posibles duplicados** y **Cumplimiento** — deliberadamente en ese orden de dependencia, no al azar:

1. **Teléfonos siempre bien** es una extensión barata de algo que ya era obligatorio (R2 pide teléfono legible). Normalizar a E.164 da, de regalo, la base para las otras dos.
2. **Posibles duplicados** depende de tener el teléfono ya normalizado. El dataset trae un caso sembrado a propósito (`c-001` "Carmen Ruiz Delgado", `+34 655 12 34 56` vs `c-009` "carmen ruiz", `655123456` — mismo número, dos formatos). No implementé la fusión real: el enunciado solo pide "proponer cómo sería" (ver el banner en la ficha), y un flujo de fusión con confirmación humana es una pieza de UI grande que no cabía en el tiempo disponible sin dejarla a medias.
3. **Cumplimiento** también reutiliza el teléfono/acciones ya construidos (bloquea el mismo botón de llamar). Lo prioricé sobre *Salud del dato* o *Siguiente mejor acción* porque el dataset trae un caso real con implicación legal/reputacional (`c-013`, tag `no-llamar` + nota explícita pidiendo que dejen de llamarla) — construir el botón de llamar sin resolver esto habría sido, literalmente, invitar al agente a violar una petición explícita del cliente.

Descarté *matching con catálogo*, *resumen LLM* y *siguiente mejor acción* por ser las que más tiempo consumen (prompt design, manejo de errores de LLM) frente al límite de 1-2h del reto — y el propio enunciado premia 3 cosas bien resueltas sobre 10 a medias.

## Decisiones sobre los datos sucios

- **Teléfonos**: se asume país por defecto **España (+34)** porque todo el dataset opera en zonas españolas (Madrid y área de Barcelona). No es un normalizador de teléfonos genérico — es una decisión de dominio válida para este dataset, documentada en `src/lib/phone.ts`.
- **Nombre con fallback**: `full_name` nulo → teléfono legible → email → `"Contacto sin identificar"`. Nombres en mayúsculas (`"JOSÉ LUIS MARTÍN CABRERA"`) o minúsculas (`"carmen ruiz"`) se normalizan a Title Case respetando conectores (`de`, `del`, `la`...).
- **Fechas heterogéneas**: ISO 8601, `DD/MM/YYYY`, `DD/MM/YYYY HH:mm` y timestamp Unix en segundos (`c-012`) conviven en el mismo dataset. `src/lib/dates.ts` las homogeneiza todas a `Date` para poder ordenar el timeline cronológicamente de verdad.
- **`qualification_data` con 3 formas distintas**: objeto anidado normal, string JSON sin parsear (`c-003` — se hace `JSON.parse` con try/catch, y si falla se degrada a "sin cualificación" en vez de romper la ficha), y claves sueltas fuera de `qualification` (`c-008`: `net_income` + `income_verified` + `income_source` + `income_updated_at` describen **un** hecho, no cuatro — se reagrupan por sufijo de clave hermana en vez de hardcodear `"net_income"`, para que el mismo patrón funcione con cualquier clave futura que llegue así).
- **"Cuando un humano corrige un dato, eso manda"**: cada hecho de cualificación muestra su badge de procedencia (`Dicho por el cliente (IA)` vs `Editado por un humano`) y su fecha. En este dataset cada clave ya viene colapsada a un único valor (el sistema de origen ya resolvió el conflicto), así que la "pista" del enunciado se traduce en **hacer visible** qué mandó, no en resolver conflictos client-side.
- **Multi-tenant en el export**: el dataset mezcla `ORG-0031` (Miralvento, la agencia del reto) con `ORG-0047` (2 contactos, `c-010` y `c-011`, de otra agencia). Un agente de Miralvento no debería ver leads ajenos, así que el repositorio filtra por `organization.id` del propio export.
- **Contactos de prueba**: `is_test: true` (`c-014`, "Prueba Prueba") se excluye por completo del listado y de la ficha (devuelve 404), como haría cualquier bandeja de trabajo real.
- **Duplicados**: señal elegida = mismo teléfono normalizado a dígitos. No crucé por nombre porque con datos tan sucios (mayúsculas, nombres parciales como `"David P."`) da demasiados falsos positivos defendibles en el tiempo disponible.
- **Cumplimiento**: no existe un campo `no_llamar` explícito; la señal está repartida entre `tags` libres (`["no-llamar"]`) y texto libre en `notes` (`"dejen de llamarla"`, `"solo por email"`). Distingo dos niveles: **bloqueo duro** (oculta call/WhatsApp, deja solo email) cuando hay petición explícita de parar, y **preferencia blanda** (`c-005`, "prefiere contacto por email") que solo muestra un aviso sin bloquear nada.
- **Diseño**: el material de diseño adjunto al reto (`guia-diseno-kontaktu.md` + 3 capturas) **no llegó en el paquete recibido**. En vez de inventar una paleta, extraje los tokens reales del bundle CSS público de kontaktuai.com (colores de marca `#ff6b00`/`#0a0a0a`, superficies cálidas `#fafaf7`/`#f4f4ee`/`#ececdf`, tipografías Inter/Outfit/JetBrains Mono, radios de 20px, sombras cálidas) y los apliqué como tokens de Tailwind v4 en `src/app/globals.css`. Es una reconstrucción razonada, no la guía oficial — habría preferido tener el material original.

## Dónde se equivocó la IA y cómo lo cacé

- `create-next-app` se negó a generar el proyecto con el dataset ya en el directorio (solo tolera un puñado de archivos "seguros"). Lo detecté al ver el mensaje de error explícito del CLI y lo resolví moviendo los ficheros fuera, generando el scaffold en directorio limpio, y reintegrándolos después en `src/data/` y `docs/`.
- `Intl.NumberFormat('es-ES', { style: 'currency', ... })` en Node devolvía `"1400 €"` (sin separador de miles) para números de 4 cifras pero sí agrupaba en números de 6 cifras (`"350.000 €"`) — un comportamiento inconsistente del `useGrouping` por defecto. Lo detecté verificando manualmente contra la API con `curl` los casos de presupuesto de varios contactos en vez de asumir que "compila" significaba "correcto", y lo arreglé forzando `useGrouping: true` explícito.
- No pude verificar visualmente el resultado en un navegador real (no hay herramienta de captura de pantalla en este entorno) — la verificación se hizo por tipado estricto (`tsc --noEmit`), lint, y comprobación de la respuesta real de la API contra los casos límite del dataset (duplicados, cumplimiento, fechas, cualificación en sus 3 formas). La fidelidad visual final a la guía de Kontaktu queda pendiente de un vistazo humano en el navegador.

## Qué haría con un día más

- Construir el flujo de fusión de duplicados de verdad (hoy solo se propone en el banner).
- *Salud del dato*: indicador de completitud, barato de añadir ahora que ya se recorren todas las claves dinámicas de cualificación.
- *Siguiente mejor acción* con reglas simples (sin LLM) aprovechando `ai_handoff` (ej. `c-016`, contacto que pidió hablar con un humano tras una visita cancelada) — señal que ya está en el dataset y hoy no se muestra en ningún sitio.
- Tests unitarios para `src/lib/phone.ts`, `dates.ts` y `qualification.ts`, que son la parte con más lógica de casos límite y ningún test todavía.
- El agente de voz de LiveKit (bonus), una vez cerrado lo anterior.
