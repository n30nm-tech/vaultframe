export function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) {
    return "Unknown duration";
  }

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainder = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }

  return `${minutes}m ${String(remainder).padStart(2, "0")}s`;
}

export function formatFileSize(sizeBytes: bigint | null) {
  if (sizeBytes === null) {
    return "Unknown size";
  }

  const value = Number(sizeBytes);

  if (!Number.isFinite(value) || value <= 0) {
    return "Unknown size";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size >= 10 || unitIndex === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
}

export function getFolderBreadcrumbLabel(folderPath: string, libraryPath: string) {
  const normalizedFolder = normalizeSlashes(folderPath);
  const normalizedLibrary = normalizeSlashes(libraryPath);

  if (normalizedFolder.startsWith(`${normalizedLibrary}/`)) {
    const relative = normalizedFolder.slice(normalizedLibrary.length + 1);
    const parts = relative.split("/").filter(Boolean);

    if (parts.length <= 3) {
      return relative;
    }

    return ["...", ...parts.slice(-3)].join(" / ");
  }

  const parts = normalizedFolder.split("/").filter(Boolean);

  if (parts.length <= 3) {
    return parts.join(" / ");
  }

  return ["...", ...parts.slice(-3)].join(" / ");
}

function normalizeSlashes(value: string) {
  return value.replace(/\\/g, "/").replace(/\/+$/, "");
}
