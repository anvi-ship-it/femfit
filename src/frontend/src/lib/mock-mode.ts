import runtimeConfig from "../../env.json";

const hasConfiguredCanister = (value: unknown) =>
  typeof value === "string" &&
  value.trim() !== "" &&
  value.trim().toLowerCase() !== "undefined";

const hasBackendCanister =
  hasConfiguredCanister(runtimeConfig.backend_canister_id) ||
  hasConfiguredCanister(process.env.CANISTER_ID_BACKEND);

export const MOCK_MODE =
  import.meta.env.VITE_MOCK_MODE === "true" ||
  import.meta.env.VITE_USE_MOCK === "true" ||
  !hasBackendCanister;
