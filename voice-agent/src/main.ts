import { ServerOptions, cli, defineAgent, inference, voice } from "@livekit/agents";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createAgent } from "./agent.ts";

dotenv.config({ path: ".env.local" });

export default defineAgent({
  entry: async (ctx) => {
    const session = new voice.AgentSession({
      // "auto:es" deja que LiveKit Inference elija el mejor modelo de
      // transcripción disponible para español en cada momento.
      stt: "auto:es",

      // Voz en castellano peninsular (Gradium "Vera").
      tts: new inference.TTS({
        model: "gradium/default",
        voice: "iTQW2xFICXk8riV4",
        language: "es",
      }),

      turnHandling: {
        turnDetection: new inference.TurnDetector(),
      },
    });

    await session.start({
      agent: createAgent(),
      room: ctx.room,
    });

    await ctx.connect();

    session.generateReply({
      instructions: "Saluda como la recepcionista de la inmobiliaria y pregunta en qué puedes ayudar.",
    });
  },
});

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: "miralvento-inmobiliaria",
  })
);
