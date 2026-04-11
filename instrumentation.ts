export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { ensureScanRunnerStarted } = await import("@/lib/server/library-scan");
  ensureScanRunnerStarted();
}
