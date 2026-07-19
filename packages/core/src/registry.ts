import type { Engine } from "./types";

/** docs/03 "Health Monitoring" — every Engine exposes one of these; the Dashboard surfaces it live. */
export type EngineHealthStatus = "Healthy" | "Running" | "Waiting" | "Failed" | "Disabled";

type RegisteredEngine = {
  engine: Engine;
  health: EngineHealthStatus;
};

/**
 * Engine Registry (docs/03 "Engine Registration") — every Engine registers at application
 * startup and exposes Engine ID, Name, Version, Description, Dependencies, Supported
 * Validation Types, Health Status. In-memory for now; fine for a single Next.js process, but
 * this is the seam where a real multi-worker deployment would need a shared registry (Redis or
 * a DB-backed table) instead — flagging per docs/10, not solving it before it's needed.
 */
class EngineRegistry {
  private engines = new Map<string, RegisteredEngine>();

  register(engine: Engine): void {
    // Idempotent by design — dev-mode Fast Refresh can re-execute a module's top-level
    // `registerEngine()` call; re-registering the same id should just replace it, not throw.
    this.engines.set(engine.id, { engine, health: "Healthy" });
  }

  get(id: string): Engine | undefined {
    return this.engines.get(id)?.engine;
  }

  getAll(): Engine[] {
    return Array.from(this.engines.values()).map((r) => r.engine);
  }

  setHealth(id: string, health: EngineHealthStatus): void {
    const entry = this.engines.get(id);
    if (entry) entry.health = health;
  }

  getHealth(id: string): EngineHealthStatus | undefined {
    return this.engines.get(id)?.health;
  }

  /** Topological sort by `dependencies` — docs/03 "Execution Strategy": dependency order where
   * a dependency exists, independent engines otherwise free to run in parallel. */
  resolveExecutionOrder(): Engine[] {
    const all = this.getAll();
    const byId = new Map(all.map((e) => [e.id, e]));
    const visited = new Set<string>();
    const order: Engine[] = [];

    function visit(engine: Engine, stack: string[]) {
      if (visited.has(engine.id)) return;
      if (stack.includes(engine.id)) {
        throw new Error(`Circular engine dependency detected: ${stack.join(" -> ")} -> ${engine.id}`);
      }
      for (const depId of engine.dependencies) {
        const dep = byId.get(depId);
        if (!dep) throw new Error(`Engine "${engine.id}" depends on unregistered engine "${depId}".`);
        visit(dep, [...stack, engine.id]);
      }
      visited.add(engine.id);
      order.push(engine);
    }

    for (const engine of all) visit(engine, []);
    return order;
  }
}

/** One shared registry per process — engines call `registerEngine()` once at import time. */
export const engineRegistry = new EngineRegistry();

export function registerEngine(engine: Engine): void {
  engineRegistry.register(engine);
}
