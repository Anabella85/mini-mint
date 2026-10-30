/**
 * Fake backend.
 *
 * Behaves like a real HTTP API as far as the frontend can tell:
 *  - every call is async and takes a variable amount of time (bigger flows are slower)
 *  - data is serialized on the way in and out, so you never share objects with the "server"
 *  - errors are thrown as `ApiError` with an HTTP-like `status`
 *
 * Data is kept in localStorage so it survives page reloads. Use `api.resetDemoData()` to start over.
 * You should not need to change this file for the core tasks.
 */
import { createSeedFlows } from "./seed.js";

const STORAGE_KEY = "mini-mint-db-v1";

export class ApiError extends Error {
  constructor(status, message, details = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function loadDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore and fall back to seed data
  }
  return { flows: createSeedFlows() };
}

let db = loadDb();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // storage full or unavailable: keep working in memory
  }
}

const wire = (value) => JSON.parse(JSON.stringify(value));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const jitter = (max) => Math.round(Math.random() * max);

function findFlow(flowId) {
  const flow = db.flows.find((f) => f.id === flowId);
  if (!flow) throw new ApiError(404, `Flow ${flowId} not found`);
  return flow;
}

// --- realtime (simulated) ---------------------------------------------------
const listeners = new Map(); // flowId -> Set<handler>
let collaboratorTimer = null;

function emit(event) {
  const handlers = listeners.get(event.flowId);
  if (!handlers) return;
  handlers.forEach((handler) => {
    // delivery is "at least once": the same event can arrive twice
    setTimeout(() => handler(wire(event)), 50 + jitter(300));
    if (Math.random() < 0.3) setTimeout(() => handler(wire(event)), 400 + jitter(600));
  });
}

function collaboratorTick() {
  const watchedFlowIds = [...listeners.keys()].filter((id) => listeners.get(id).size);
  if (!watchedFlowIds.length) return;
  const flow = db.flows.find((f) => f.id === watchedFlowIds[0]);
  const step = flow?.steps[Math.floor(Math.random() * flow.steps.length)];
  if (!step) return;
  step.displayName = `${step.displayName.replace(/ \(edited by Kari\)$/, "")} (edited by Kari)`;
  flow.version += 1;
  flow.updatedAt = new Date().toISOString();
  persist();
  emit({ type: "flow.updated", flowId: flow.id, version: flow.version, updatedBy: "Kari Nordmann", changedStepIds: [step.id] });
}

// --- public API -------------------------------------------------------------
export const api = {
  async listFlows() {
    await sleep(200 + jitter(200));
    return wire(
      db.flows.map(({ id, name, version, updatedAt, steps }) => ({ id, name, version, updatedAt, stepCount: steps.length }))
    );
  },

  async getFlow(flowId) {
    const flow = findFlow(flowId);
    await sleep(150 + Math.min(flow.steps.length, 30) * 70 + jitter(250));
    return wire(flow);
  },

  /**
   * Saves a flow.
   * Pass `{ ifVersion }` to enable optimistic concurrency: the save is rejected with a 409
   * when the stored version differs. Without it, the last write wins.
   */
  async saveFlow(flowId, flow, { ifVersion } = {}) {
    await sleep(250 + jitter(400));
    const stored = findFlow(flowId);
    if (ifVersion !== undefined && ifVersion !== stored.version) {
      throw new ApiError(409, "Flow was changed by someone else", { currentVersion: stored.version });
    }
    const next = { ...wire(flow), id: flowId, version: stored.version + 1, updatedAt: new Date().toISOString() };
    db.flows = db.flows.map((f) => (f.id === flowId ? next : f));
    persist();
    return wire(next);
  },

  /** Per-step funnel numbers for the last 30 days. */
  async getFlowStats(flowId) {
    const flow = findFlow(flowId);
    await sleep(400 + jitter(600));
    if (Math.random() < 0.15) throw new ApiError(503, "Analytics service is temporarily unavailable");

    let seed = flowId.length * 97;
    const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const started = 1000 + Math.floor(rand() * 4000);
    const stats = [];
    let remaining = started;
    const branchSplit = new Map();

    // walk steps in stored order; good enough for fake numbers
    flow.steps.forEach((step) => {
      const incoming = flow.connections.find((c) => c.targetStepId === step.id);
      let entered = remaining;
      if (incoming && incoming.outcome !== "Done") {
        const share = incoming.outcome === "True" ? 0.62 : 0.38;
        entered = Math.round((branchSplit.get(incoming.sourceStepId) ?? remaining) * share);
      }
      const failed = Math.round(entered * rand() * 0.08);
      const abandoned = Math.round(entered * rand() * 0.1);
      const completed = entered - failed - abandoned;
      stats.push({ stepId: step.id, entered, completed, failed });
      if (step.type === "If") branchSplit.set(step.id, completed);
      if (!incoming || incoming.outcome === "Done") remaining = completed;
    });

    // a step that was deleted from the flow last week still has data
    stats.push({ stepId: "9da3c53d-7536-4e64-ac82-5cf30c3bd8b9", entered: 312, completed: 290, failed: 4 });

    return wire({ flowId, period: "last_30_days", started, steps: stats });
  },

  /**
   * Subscribe to server-pushed events for a flow (think SignalR).
   * @returns {() => void} unsubscribe
   */
  subscribe(flowId, handler) {
    if (!listeners.has(flowId)) listeners.set(flowId, new Set());
    listeners.get(flowId).add(handler);
    return () => listeners.get(flowId)?.delete(handler);
  },

  /** Turns the simulated colleague ("Kari") on or off. When on, Kari edits the open flow every ~15s. */
  setCollaboratorActive(active) {
    clearInterval(collaboratorTimer);
    collaboratorTimer = active ? setInterval(collaboratorTick, 15000) : null;
  },

  resetDemoData() {
    db = { flows: createSeedFlows() };
    persist();
  }
};
