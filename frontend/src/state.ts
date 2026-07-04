import type { Citation, Criterion, DeadlineResult, Ingest, TraceEvent } from "./types";

export interface CriterionRun {
  retrievals: any[];
  tools: any[];
  verdict?: any;
}

export interface AppState {
  plan?: { plan: string; ingest: Ingest };
  criteria: Criterion[];
  order: string[];
  perCriterion: Record<string, CriterionRun>;
  currentCriterion?: string;
  deadline?: DeadlineResult;
  deadlineTool?: any;
  decision?: any;
  letterParas: string[];
  letterFull?: string;
  gap?: any;
  citations: Citation[];
  done: boolean;
  error?: string;
}

export const initialState: AppState = {
  criteria: [],
  order: [],
  perCriterion: {},
  letterParas: [],
  citations: [],
  done: false,
};

function ensure(state: AppState, id: string): CriterionRun {
  if (!state.perCriterion[id]) state.perCriterion[id] = { retrievals: [], tools: [] };
  return state.perCriterion[id];
}

export type Action = { type: "reset" } | { type: "event"; event: TraceEvent };

export function reducer(prev: AppState, action: Action): AppState {
  if (action.type === "reset") {
    return { ...initialState, perCriterion: {}, criteria: [], order: [], letterParas: [], citations: [] };
  }
  const { type, payload } = action.event;
  // Shallow clone with fresh mutable sub-structures we touch.
  const state: AppState = {
    ...prev,
    perCriterion: { ...prev.perCriterion },
    order: [...prev.order],
    letterParas: [...prev.letterParas],
    citations: [...prev.citations],
  };

  switch (type) {
    case "plan":
      state.plan = { plan: payload.plan, ingest: payload.ingest };
      break;
    case "criteria":
      state.criteria = payload.criteria;
      break;
    case "criterion_start": {
      const id = payload.criterion_id;
      state.currentCriterion = id;
      if (!state.order.includes(id)) state.order.push(id);
      ensure(state, id);
      break;
    }
    case "retrieval": {
      const id = payload.criterion_id;
      const run = { ...ensure(state, id), retrievals: [...ensure(state, id).retrievals, payload] };
      state.perCriterion[id] = run;
      break;
    }
    case "tool_call": {
      if (payload.tool === "appeal_deadline") {
        state.deadline = payload.outputs;
        state.deadlineTool = payload;
      } else if (state.currentCriterion) {
        const id = state.currentCriterion;
        const run = { ...ensure(state, id), tools: [...ensure(state, id).tools, payload] };
        state.perCriterion[id] = run;
      }
      break;
    }
    case "verdict": {
      const id = payload.criterion_id;
      const run = { ...ensure(state, id), verdict: payload };
      state.perCriterion[id] = run;
      if (Array.isArray(payload.citations)) {
        state.citations = [...state.citations, ...payload.citations];
      }
      break;
    }
    case "decision":
      state.decision = payload;
      break;
    case "letter":
      if (payload.done) state.letterFull = payload.letter;
      else if (typeof payload.delta === "string") state.letterParas = [...state.letterParas, payload.delta];
      break;
    case "gap_report":
      state.gap = payload;
      break;
    case "done":
      state.done = true;
      break;
    case "error":
      state.error = payload.message;
      break;
  }
  return state;
}
