# Kontaktu — Ficha de contacto

Reto técnico de Kontaktu: la pantalla de detalle de contacto que un agente inmobiliario abriría antes de llamar, construida contra un dataset real de heterogeneidad (`web/src/data/contactos.json`). Ver el enunciado completo en [`docs/tech-spec-ficha-contactos.md`](docs/tech-spec-ficha-contactos.md).

## Estructura del repo

Un único repo, dos proyectos hermanos, cada uno con su propio `package.json` y su propio destino de despliegue:

- **[`web/`](web/)** — la app Next.js, el entregable principal (R1-R9 + user stories). Se despliega en Vercel.
- **[`voice-agent/`](voice-agent/)** — el bonus opcional, un agente de voz de LiveKit. Se despliega en Railway (ver su propio [README](voice-agent/README.md)).

Ninguno de los dos vive en la raíz del repo a propósito: al principio la app Next.js sí estaba en la raíz y `voice-agent/` anidada dentro, y esa asimetría causó dos bugs reales de despliegue (el `tsconfig` de la raíz intentaba compilar `voice-agent/` en el build de Vercel; luego, al fijar un Root Directory en Railway, `voice-agent` dejó de tener acceso a archivos de la app Next que referenciaba por ruta relativa). Ponerlos como carpetas hermanas, cada una autocontenida, elimina el problema de raíz en vez de parchearlo.

## Cómo correrlo en local

```bash
cd web
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). El listado (`/`) enlaza a cada ficha (`/contactos/[id]`). Ambas páginas consumen `/api/contacts` y `/api/contacts/[id]` — nunca importan el JSON directamente (R8) — con una latencia simulada de ~0.5-0.9s para que los estados de carga sean reales, no cosméticos.

## Stack

Next.js (App Router) + TypeScript + Tailwind v4. El propio reto pide servir el JSON "a través de un route handler o server action" — es decir, el "backend" es la capa `web/src/lib/*` + las route handlers de `web/src/app/api`, no un servicio aparte.

## User stories elegidas: por qué estas 3 y no otras

De las 10 abiertas, elegí **Teléfonos siempre bien**, **Posibles duplicados** y **Cumplimiento** — deliberadamente en ese orden de dependencia, no al azar:

1. **Teléfonos siempre bien** es una extensión barata de algo que ya era obligatorio (R2 pide teléfono legible). Normalizar a E.164 da, de regalo, la base para las otras dos.
2. **Posibles duplicados** depende de tener el teléfono ya normalizado. El dataset trae un caso sembrado a propósito (`c-001` "Carmen Ruiz Delgado", `+34 655 12 34 56` vs `c-009` "carmen ruiz", `655123456` — mismo número, dos formatos). No implementé la fusión real: el enunciado solo pide "proponer cómo sería" (ver el banner en la ficha), y un flujo de fusión con confirmación humana es una pieza de UI grande que no cabía en el tiempo disponible sin dejarla a medias.
3. **Cumplimiento** también reutiliza el teléfono/acciones ya construidos (bloquea el mismo botón de llamar). Lo prioricé sobre *Salud del dato* o *Siguiente mejor acción* porque el dataset trae un caso real con implicación legal/reputacional (`c-013`, tag `no-llamar` + nota explícita pidiendo que dejen de llamarla) — construir el botón de llamar sin resolver esto habría sido, literalmente, invitar al agente a violar una petición explícita del cliente.

Descarté *matching con catálogo*, *resumen LLM* y *siguiente mejor acción* por ser las que más tiempo consumen (prompt design, manejo de errores de LLM) frente al límite de 1-2h del reto — y el propio enunciado premia 3 cosas bien resueltas sobre 10 a medias.

## Decisiones sobre los datos sucios

- **Teléfonos**: se asume país por defecto **España (+34)** porque todo el dataset opera en zonas españolas (Madrid y área de Barcelona). No es un normalizador de teléfonos genérico — es una decisión de dominio válida para este dataset, documentada en `web/src/lib/phone.ts`.
- **Nombre con fallback**: `full_name` nulo → teléfono legible → email → `"Contacto sin identificar"`. Nombres en mayúsculas (`"JOSÉ LUIS MARTÍN CABRERA"`) o minúsculas (`"carmen ruiz"`) se normalizan a Title Case respetando conectores (`de`, `del`, `la`...).
- **Fechas heterogéneas**: ISO 8601, `DD/MM/YYYY`, `DD/MM/YYYY HH:mm` y timestamp Unix en segundos (`c-012`) conviven en el mismo dataset. `src/lib/dates.ts` las homogeneiza todas a `Date` para poder ordenar el timeline cronológicamente de verdad.
- **`qualification_data` con 3 formas distintas**: objeto anidado normal, string JSON sin parsear (`c-003` — se hace `JSON.parse` con try/catch, y si falla se degrada a "sin cualificación" en vez de romper la ficha), y claves sueltas fuera de `qualification` (`c-008`: `net_income` + `income_verified` + `income_source` + `income_updated_at` describen **un** hecho, no cuatro — se reagrupan por sufijo de clave hermana en vez de hardcodear `"net_income"`, para que el mismo patrón funcione con cualquier clave futura que llegue así).
- **"Cuando un humano corrige un dato, eso manda"**: cada hecho de cualificación muestra su badge de procedencia (`Dicho por el cliente (IA)` vs `Editado por un humano`) y su fecha. En este dataset cada clave ya viene colapsada a un único valor (el sistema de origen ya resolvió el conflicto), así que la "pista" del enunciado se traduce en **hacer visible** qué mandó, no en resolver conflictos client-side.
- **Multi-tenant en el export**: el dataset mezcla `ORG-0031` (Miralvento, la agencia del reto) con `ORG-0047` (2 contactos, `c-010` y `c-011`, de otra agencia). Un agente de Miralvento no debería ver leads ajenos, así que el repositorio filtra por `organization.id` del propio export.
- **Contactos de prueba**: `is_test: true` (`c-014`, "Prueba Prueba") se excluye por completo del listado y de la ficha (devuelve 404), como haría cualquier bandeja de trabajo real.
- **Duplicados**: señal elegida = mismo teléfono normalizado a dígitos. No crucé por nombre porque con datos tan sucios (mayúsculas, nombres parciales como `"David P."`) da demasiados falsos positivos defendibles en el tiempo disponible.
- **Cumplimiento**: no existe un campo `no_llamar` explícito; la señal está repartida entre `tags` libres (`["no-llamar"]`) y texto libre en `notes` (`"dejen de llamarla"`, `"solo por email"`). Distingo dos niveles: **bloqueo duro** (oculta call/WhatsApp, deja solo email) cuando hay petición explícita de parar, y **preferencia blanda** (`c-005`, "prefiere contacto por email") que solo muestra un aviso sin bloquear nada.
- **Diseño**: el material de diseño adjunto al reto (`guia-diseno-kontaktu.md` + 3 capturas) **no llegó en el paquete recibido**. En vez de inventar una paleta, extraje los tokens reales del bundle CSS público de kontaktuai.com (colores de marca `#ff6b00`/`#0a0a0a`, superficies cálidas `#fafaf7`/`#f4f4ee`/`#ececdf`, tipografías Inter/Outfit/JetBrains Mono, radios de 20px, sombras cálidas) y los apliqué como tokens de Tailwind v4 en `web/src/app/globals.css`. Es una reconstrucción razonada, no la guía oficial — habría preferido tener el material original.

## Dónde se equivocó la IA y cómo lo cacé

- `create-next-app` se negó a generar el proyecto con el dataset ya en el directorio (solo tolera un puñado de archivos "seguros"). Lo detecté al ver el mensaje de error explícito del CLI y lo resolví moviendo los ficheros fuera, generando el scaffold en directorio limpio, y reintegrándolos después en `src/data/` y `docs/`.
- `Intl.NumberFormat('es-ES', { style: 'currency', ... })` en Node devolvía `"1400 €"` (sin separador de miles) para números de 4 cifras pero sí agrupaba en números de 6 cifras (`"350.000 €"`) — un comportamiento inconsistente del `useGrouping` por defecto. Lo detecté verificando manualmente contra la API con `curl` los casos de presupuesto de varios contactos en vez de asumir que "compila" significaba "correcto", y lo arreglé forzando `useGrouping: true` explícito.
- No pude verificar visualmente el resultado en un navegador real (no hay herramienta de captura de pantalla en este entorno) — la verificación se hizo por tipado estricto (`tsc --noEmit`), lint, y comprobación de la respuesta real de la API contra los casos límite del dataset (duplicados, cumplimiento, fechas, cualificación en sus 3 formas). La fidelidad visual final a la guía de Kontaktu queda pendiente de un vistazo humano en el navegador.
- Al añadir `voice-agent/` como carpeta anidada dentro de lo que entonces era la raíz del proyecto Next.js, el `tsconfig.json` de la raíz (con `include: ["**/*.ts", ...]`) se lo tragó sin que yo lo notara — pasó desapercibido en local porque nunca corrí `npm run build` completo tras añadirlo, solo `tsc --noEmit` puntual antes de que existiera esa carpeta. Lo cazó el propio build de Vercel en producción ("Cannot find module '@livekit/agents'"). Igual pasó al desplegar `voice-agent/` en Railway con un Root Directory propio: la tool `buscar_propiedades` referenciaba `kb-propiedades-voz.json` por ruta relativa fuera de su propia carpeta, cosa que funcionaba en local (todo convive en el mismo disco) pero no en un contenedor que solo empaqueta esa subcarpeta (`ENOENT` en los logs de Railway). Los dos son la misma lección repetida: verificar "compila en mi máquina" no es lo mismo que verificar "funciona en el límite real de despliegue" — la corrección estructural fue sacar ambos proyectos como carpetas hermanas autocontenidas en vez de uno anidado dentro del otro.

## Bonus: agente de voz (LiveKit)

Implementado en [`voice-agent/`](voice-agent/) como paquete Node/TypeScript separado (un agente de voz es un worker de larga duración, no encaja en el modelo request-response de las route handlers de Next). Usa `kb-propiedades-voz.json` como base de conocimiento a través de la tool `buscar_propiedades(zona, presupuesto_max, operacion)`, habla en español de España, y se despide y cuelga solo (`beta.createEndCallTool()`) — el punto extra que pide el enunciado. Todo el STT/LLM/TTS corre sobre LiveKit Inference, incluido en el plan free de LiveKit Cloud, sin necesidad de dar de alta claves sueltas de otros proveedores.

Ver [`voice-agent/README.md`](voice-agent/README.md) para cómo configurarlo y probarlo — necesita credenciales de un proyecto de LiveKit Cloud que solo tú puedes crear. El paquete completo compila (`tsc --noEmit`) contra los tipos reales de `@livekit/agents@1.8.0`, y la lógica de búsqueda del catálogo se probó de forma aislada; lo que no pude verificar es la conversación de voz de extremo a extremo, al no tener ni las credenciales ni micrófono/altavoz en este entorno.

## Qué haría con un día más

- Construir el flujo de fusión de duplicados de verdad (hoy solo se propone en el banner).
- *Salud del dato*: indicador de completitud, barato de añadir ahora que ya se recorren todas las claves dinámicas de cualificación.
- *Siguiente mejor acción* con reglas simples (sin LLM) aprovechando `ai_handoff` (ej. `c-016`, contacto que pidió hablar con un humano tras una visita cancelada) — señal que ya está en el dataset y hoy no se muestra en ningún sitio.
- Tests unitarios para `web/src/lib/phone.ts`, `dates.ts` y `qualification.ts`, que son la parte con más lógica de casos límite y ningún test todavía.
- Conectar el agente de voz a un número de teléfono real vía telefonía SIP de LiveKit (Twilio u otro trunk), que es la pieza que falta para que "atienda la llamada de la agencia" de verdad y no solo una room de WebRTC.
