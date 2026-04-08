import { readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";

export type AllowedRoot = {
  name: string;
  path: string;
};

export type FolderEntry = {
  name: string;
  path: string;
};

export type FolderBreadcrumb = {
  name: string;
  path: string;
};

export type FolderBrowseResponse =
  | {
      mode: "roots";
      roots: AllowedRoot[];
      message?: string;
    }
  | {
      mode: "folder";
      currentPath: string;
      rootPath: string;
      canGoUp: boolean;
      parentPath: string | null;
      breadcrumbs: FolderBreadcrumb[];
      folders: FolderEntry[];
      message?: string;
    };

export class FolderBrowserError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "FolderBrowserError";
    this.status = status;
  }
}

export function parseAllowedMediaRoots(value = process.env.ALLOWED_MEDIA_ROOTS ?? "") {
  const roots = value
    .split(path.delimiter)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => path.isAbsolute(entry))
    .map((entry) => path.normalize(entry));

  return Array.from(new Set(roots)).sort((a, b) => a.localeCompare(b));
}

export async function browseFolders(requestedPath?: string): Promise<FolderBrowseResponse> {
  const configuredRoots = parseAllowedMediaRoots();

  if (configuredRoots.length === 0) {
    return {
      mode: "roots",
      roots: [],
      message: "No allowed media roots are configured. Set ALLOWED_MEDIA_ROOTS to enable folder browsing.",
    };
  }

  if (!requestedPath) {
    return {
      mode: "roots",
      roots: configuredRoots.map(toAllowedRoot),
    };
  }

  const { currentPath, rootPath } = await resolvePathWithinAllowedRoots(requestedPath, configuredRoots);
  const directories = await listSubdirectories(currentPath);
  const parentPath = currentPath === rootPath ? null : path.dirname(currentPath);

  return {
    mode: "folder",
    currentPath,
    rootPath,
    canGoUp: Boolean(parentPath),
    parentPath,
    breadcrumbs: buildBreadcrumbs(rootPath, currentPath),
    folders: directories,
    message: directories.length === 0 ? "This folder has no subfolders." : undefined,
  };
}

export async function validateLibraryPath(pathValue: string) {
  const configuredRoots = parseAllowedMediaRoots();

  if (configuredRoots.length === 0) {
    throw new FolderBrowserError(
      "No allowed media roots are configured. Set ALLOWED_MEDIA_ROOTS before saving libraries.",
      500,
    );
  }

  const trimmedPath = pathValue.trim();

  if (!trimmedPath) {
    throw new FolderBrowserError("Path is required.");
  }

  const { currentPath } = await resolvePathWithinAllowedRoots(trimmedPath, configuredRoots);
  return currentPath;
}

export async function validateMediaFilePath(filePath: string, libraryPath: string) {
  const resolvedLibraryPath = await validateLibraryPath(libraryPath);
  const trimmedPath = filePath.trim();

  if (!trimmedPath || !path.isAbsolute(trimmedPath)) {
    throw new FolderBrowserError("An absolute media file path is required.");
  }

  let fileStats;

  try {
    fileStats = await stat(trimmedPath);
  } catch {
    throw new FolderBrowserError("The requested media file does not exist.", 404);
  }

  if (!fileStats.isFile()) {
    throw new FolderBrowserError("Only media files can be streamed.", 400);
  }

  const resolvedFilePath = await realpath(trimmedPath);

  if (!isInsideRoot(resolvedFilePath, resolvedLibraryPath)) {
    throw new FolderBrowserError("The requested media file is outside the saved library path.", 403);
  }

  return resolvedFilePath;
}

async function resolvePathWithinAllowedRoots(requestedPath: string, configuredRoots: string[]) {
  const normalizedPath = normalizeRequestedPath(requestedPath);
  const currentPath = await resolveExistingDirectory(normalizedPath, "The selected folder does not exist.");

  const candidates = await Promise.all(
    configuredRoots.map(async (root) => {
      try {
        const resolvedRoot = await resolveExistingDirectory(root, undefined, false);
        return isInsideRoot(currentPath, resolvedRoot)
          ? {
              configuredRoot: root,
              resolvedRoot,
            }
          : null;
      } catch {
        return null;
      }
    }),
  );

  const matches = candidates.filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));

  if (matches.length === 0) {
    throw new FolderBrowserError("The requested folder is outside the configured allowed roots.", 403);
  }

  matches.sort((a, b) => b.resolvedRoot.length - a.resolvedRoot.length);

  return {
    currentPath,
    rootPath: matches[0].configuredRoot,
  };
}

async function listSubdirectories(currentPath: string) {
  try {
    const entries = await readdir(currentPath);
    const directories = await Promise.all(
      entries.map(async (entryName) => {
        const entryPath = path.join(currentPath, entryName);

        try {
          const entryStats = await stat(entryPath);

          if (entryStats.isDirectory()) {
            return {
              name: entryName,
              path: entryPath,
            };
          }
        } catch {
          return null;
        }

        return null;
      }),
    );

    return directories
      .filter((entry): entry is { name: string; path: string } => Boolean(entry))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    throw new FolderBrowserError("This folder could not be read.", 500);
  }
}

function normalizeRequestedPath(requestedPath: string) {
  const trimmedPath = requestedPath.trim();

  if (!trimmedPath || !path.isAbsolute(trimmedPath)) {
    throw new FolderBrowserError("An absolute folder path is required.");
  }

  return path.normalize(trimmedPath);
}

async function resolveExistingDirectory(
  targetPath: string,
  missingMessage = "The requested folder does not exist.",
  requireDirectory = true,
) {
  let stats;

  try {
    stats = await stat(targetPath);
  } catch {
    const parentPath = path.dirname(targetPath);
    const entryName = path.basename(targetPath);

    try {
      const parentEntries = await readdir(parentPath, { withFileTypes: true });
      const matchingEntry = parentEntries.find((entry) => entry.name === entryName);

      if (matchingEntry && (!requireDirectory || matchingEntry.isDirectory())) {
        return path.resolve(targetPath);
      }
    } catch {
      // Fall through to the standard missing-folder error below.
    }

    throw new FolderBrowserError(missingMessage, 404);
  }

  if (requireDirectory && !stats.isDirectory()) {
    throw new FolderBrowserError("Only directories can be selected.", 400);
  }

  try {
    return await realpath(targetPath);
  } catch {
    return path.resolve(targetPath);
  }
}

function isInsideRoot(candidatePath: string, rootPath: string) {
  return candidatePath === rootPath || candidatePath.startsWith(`${rootPath}${path.sep}`);
}

function buildBreadcrumbs(rootPath: string, currentPath: string) {
  const relative = path.relative(rootPath, currentPath);

  if (!relative || relative === ".") {
    return [toAllowedRoot(rootPath)];
  }

  const segments = relative.split(path.sep).filter(Boolean);

  return [
    toAllowedRoot(rootPath),
    ...segments.map((segment, index) => ({
      name: segment,
      path: path.join(rootPath, ...segments.slice(0, index + 1)),
    })),
  ];
}

function toAllowedRoot(rootPath: string): AllowedRoot {
  const name = path.basename(rootPath);

  return {
    name: name || rootPath,
    path: rootPath,
  };
}
