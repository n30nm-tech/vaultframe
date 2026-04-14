import { ensureScanRunnerStarted } from "./lib/server/library-scan";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  ensureScanRunnerStarted();
}
