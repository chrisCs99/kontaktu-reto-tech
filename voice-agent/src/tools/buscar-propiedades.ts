import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { z } from "zod";
import { tool, dedent } from "@livekit/agents";

// Copia propia dentro de voice-agent/ (no una referencia a ../src/data del
// proyecto Next.js): este paquete se despliega de forma independiente
// (Root Directory separado en Railway) y no tiene acceso al resto del repo
// en tiempo de ejecución.
const KB_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../data/kb-propiedades-voz.json"
);

interface Property {
  ref: string;
  titulo: string;
  operacion: "venta" | "alquiler";
  zona: string;
  precio: number;
  habitaciones: number;
  banos: number;
  m2: number;
  admite_mascotas: boolean;
  descripcion_corta: string;
  horario_visitas: string;
}

interface Kb {
  agency: { name: string; phone: string; horario_oficina: string };
  properties: Property[];
}

// La base de conocimiento es un catálogo estático de 6 propiedades: se carga una
// única vez al arrancar el proceso, no en cada llamada a la tool.
const kb: Kb = JSON.parse(readFileSync(KB_PATH, "utf-8"));

export function agencyInfo() {
  return kb.agency;
}

export const buscarPropiedadesTool = tool({
  name: "buscar_propiedades",
  description: dedent`
    Busca en el catálogo de propiedades de Miralvento por zona, presupuesto máximo
    y/o tipo de operación (venta o alquiler). Úsala en cuanto el cliente haya dado
    al menos la zona o el presupuesto — no hace falta esperar a tener los tres
    datos. Si no hay resultados exactos, prueba a relajar el presupuesto un 10%
    antes de decirle al cliente que no hay nada disponible.
  `,
  parameters: z.object({
    zona: z
      .string()
      .nullable()
      .describe("Zona o municipio buscado, p. ej. 'Majadahonda' o 'Las Rozas'. Null si no se ha dicho."),
    presupuesto_max: z
      .number()
      .nullable()
      .describe("Presupuesto máximo en euros (precio de venta o renta mensual, según operación). Null si no se ha dicho."),
    operacion: z
      .enum(["venta", "alquiler"])
      .nullable()
      .describe("Tipo de operación buscada. Null si no se ha dicho."),
  }),
  execute: async ({ zona, presupuesto_max, operacion }) => {
    const matches = kb.properties.filter((property) => {
      if (operacion && property.operacion !== operacion) return false;
      if (zona && !property.zona.toLowerCase().includes(zona.toLowerCase())) return false;
      if (presupuesto_max && property.precio > presupuesto_max) return false;
      return true;
    });

    if (matches.length > 0) {
      return {
        total: matches.length,
        propiedades: matches.map((p) => ({
          ref: p.ref,
          titulo: p.titulo,
          operacion: p.operacion,
          zona: p.zona,
          precio: p.precio,
          habitaciones: p.habitaciones,
          banos: p.banos,
          m2: p.m2,
          admite_mascotas: p.admite_mascotas,
          descripcion: p.descripcion_corta,
          horario_visitas: p.horario_visitas,
        })),
      };
    }

    // Sin resultados exactos: reintenta con un 10% más de presupuesto antes de rendirse.
    if (presupuesto_max) {
      const relaxed = kb.properties.filter((property) => {
        if (operacion && property.operacion !== operacion) return false;
        if (zona && !property.zona.toLowerCase().includes(zona.toLowerCase())) return false;
        return property.precio <= presupuesto_max * 1.1;
      });

      if (relaxed.length > 0) {
        return {
          total: relaxed.length,
          aviso: "Estas propiedades superan ligeramente (hasta un 10%) el presupuesto indicado.",
          propiedades: relaxed.map((p) => ({
            ref: p.ref,
            titulo: p.titulo,
            operacion: p.operacion,
            zona: p.zona,
            precio: p.precio,
            habitaciones: p.habitaciones,
            banos: p.banos,
            m2: p.m2,
            admite_mascotas: p.admite_mascotas,
            descripcion: p.descripcion_corta,
            horario_visitas: p.horario_visitas,
          })),
        };
      }
    }

    return { total: 0, propiedades: [], aviso: "No hay ninguna propiedad en catálogo que encaje con esos criterios." };
  },
});
