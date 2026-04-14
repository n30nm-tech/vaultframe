export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const importScanRunner = new Function('return import("./lib/server/library-scan");') as () => Promise<{
    ensureScanRunnerStarted: () => void;
  }>;
  const { ensureScanRunnerStarted } = await importScanRunner();
  ensureScanRunnerStarted();
}
