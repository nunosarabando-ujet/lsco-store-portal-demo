// Picks the adapter from CONFIG.DATA_SOURCE (or the presenter override in sessionStorage).
import { state } from "../state.js";
import { mock } from "./mock.js";
import { api } from "./api.js";

export const data = new Proxy({}, {
  get(_, prop) {
    const a = state.dataSource === "api" ? api : mock;
    return a[prop];
  }
});

export function sourceLabel() {
  const s = state.dataSource === "api" ? api.source : "mock";
  return { servicenow: "ServiceNow", airtable: "Airtable", mock: "Mock", unavailable: "Unavailable" }[s] || s;
}
export function currentSource() { return state.dataSource === "api" ? api.source : "mock"; }
