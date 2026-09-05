# Bonus: agente de voz (LiveKit)

Agente de voz que atiende llamadas como recepcionista de Miralvento Gestión Inmobiliaria, usa `kb-propiedades-voz.json` como base de conocimiento a través de la tool `buscar_propiedades(zona, presupuesto_max, operacion)`, y se despide y cuelga solo al terminar la conversación (`EndCallTool`).

Es un paquete Node/TypeScript **separado** del proyecto Next.js: un agente de LiveKit es un worker de larga duración que se mantiene conectado esperando trabajos, algo que no encaja en el modelo serverless/request-response de las route handlers de Next.

## Por qué esta arquitectura

- **LLM, STT y TTS vía LiveKit Inference** (`inference.LLM/TTS`, `stt: "auto:es"`): no hace falta dar de alta ni pagar Deepgram/OpenAI/ElevenLabs por separado — todo se sirve a través del proyecto de LiveKit Cloud y entra dentro del plan free, tal como pide el enunciado.
- **Voz en español de España**: `gradium/default` con la voz "Vera" (`es-ES`), en vez de una voz por defecto en inglés o español de México.
- **`beta.createEndCallTool()`**: es una tool ya construida por LiveKit específicamente para esto — el agente decide cuándo la conversación ha terminado, genera una despedida y cuelga (borra la room), en vez de dejar la llamada abierta en silencio. Es el "punto extra" que pide el enunciado.

## Configurar

1. Crea una cuenta gratuita en [LiveKit Cloud](https://cloud.livekit.io/) y un proyecto.
2. Copia `LIVEKIT_URL`, `LIVEKIT_API_KEY` y `LIVEKIT_API_SECRET` del proyecto a un archivo `.env.local` (usa `.env.example` como plantilla). No hace falta ninguna otra clave: la LLM/STT/TTS se sirven desde el propio proyecto de LiveKit.
3. Instala dependencias:

```bash
cd voice-agent
npm install
```

4. Arranca el agente en modo desarrollo:

```bash
npm run dev
```

Esto conecta el worker a tu proyecto de LiveKit y lo deja escuchando llamadas.

## Probarlo

La forma más rápida sin montar telefonía real: abre el **Agent Console** de tu proyecto en [cloud.livekit.io](https://cloud.livekit.io/) (pestaña Agents), o el [Agents Playground](https://agents-playground.livekit.io/) conectando con la URL/API key de tu proyecto, y usa el micrófono del navegador para hablar con el agente como si fuera la llamada de la agencia.

Prueba, por ejemplo: *"Hola, busco un piso de alquiler en Las Rozas por unos 1.300 euros"* — debería llamar a `buscar_propiedades`, encontrar el piso reformado de Las Rozas (o avisar de que se pasa un poco de presupuesto si el número no encaja exacto), y ofrecer una visita. Al despedirte, debería colgar solo.

## Qué falta para ser el flujo real del enunciado ("atienda la llamada de la agencia")

Esto corre sobre una room de LiveKit (WebRTC), no sobre una línea telefónica real. Conectarlo a un número de teléfono de verdad requiere la integración de telefonía SIP de LiveKit (trunk entrante con un proveedor tipo Twilio, reglas de dispatch) — es una pieza de infraestructura grande, con su propio proveedor externo, que no entraba en el tiempo disponible del reto. Con más tiempo, el siguiente paso sería justo ese: `docs.livekit.io/telephony`.

## Verificación

- El paquete completo (`tsc --noEmit`) pasa contra los tipos reales de `@livekit/agents@1.8.0` instalado — no es código adivinado, compila contra el SDK real.
- La lógica de `buscar_propiedades` (filtro por zona/presupuesto/operación, y el margen del 10% cuando no hay match exacto) se probó de forma aislada con casos del propio catálogo antes de integrarla en el agente.
- **No verificado**: la conversación de voz de extremo a extremo (STT → LLM → TTS → colgar solo) requiere credenciales de un proyecto de LiveKit Cloud que no tengo, y micrófono/altavoz reales — eso lo tienes que probar tú siguiendo los pasos de arriba.
