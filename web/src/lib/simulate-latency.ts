/** R8 pide latencia simulada para que los estados de carga sean reales, no cosméticos. */
export function simulateLatency(ms = 500 + Math.random() * 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
