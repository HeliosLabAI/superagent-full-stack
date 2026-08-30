import { getState, update } from "@/lib/store";

export type FileToolName =
  | "list_files"
  | "read_file"
  | "write_file"
  | "edit_file"
  | "delete_file";

export const FILE_TOOLS: FileToolName[] = [
  "list_files",
  "read_file",
  "write_file",
  "edit_file",
  "delete_file",
];

export function isFileTool(name: string): name is FileToolName {
  return (FILE_TOOLS as string[]).includes(name);
}

export function getFiles(taskId: string): Record<string, string> {
  return getState().tasks.find((t) => t.id === taskId)?.files ?? {};
}

function setFiles(taskId: string, files: Record<string, string>) {
  update((s) => ({
    ...s,
    tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, files, updatedAt: Date.now() } : t)),
  }));
}

const norm = (p: string) => p.trim().replace(/^\.?\//, "");

function lineCount(content: string) {
  return content ? content.split("\n").length : 0;
}

/**
 * Runs a file tool against the task's real workspace (persisted with the task).
 * Executed on the client so the agent's edits are durable and inspectable.
 */
export function runFileTool(
  taskId: string,
  tool: FileToolName,
  input: Record<string, unknown>,
): Record<string, unknown> {
  const files = { ...getFiles(taskId) };
  const path = typeof input.path === "string" ? norm(input.path) : "";

  switch (tool) {
    case "list_files": {
      const paths = Object.keys(files).sort();
      return {
        files: paths.map((p) => ({ path: p, lines: lineCount(files[p]), bytes: files[p].length })),
        count: paths.length,
      };
    }
    case "read_file": {
      if (!(path in files)) {
        return { path, error: `File not found: ${path || "(empty path)"}` };
      }
      return { path, lines: lineCount(files[path]), content: files[path] };
    }
    case "write_file": {
      const content = typeof input.content === "string" ? input.content : "";
      const existed = path in files;
      if (!path) return { error: "A path is required." };
      files[path] = content;
      setFiles(taskId, files);
      return {
        path,
        action: existed ? "overwritten" : "created",
        lines: lineCount(content),
        bytes: content.length,
        content,
      };
    }
    case "edit_file": {
      const find = typeof input.find === "string" ? input.find : "";
      const replace = typeof input.replace === "string" ? input.replace : "";
      if (!(path in files)) return { path, error: `File not found: ${path}` };
      const before = files[path];
      if (!find || !before.includes(find)) {
        return { path, error: `Text to replace was not found in ${path}.`, find };
      }
      const after = before.replace(find, replace);
      files[path] = after;
      setFiles(taskId, files);
      return { path, action: "edited", find, replace, lines: lineCount(after), content: after };
    }
    case "delete_file": {
      if (!(path in files)) return { path, error: `File not found: ${path}` };
      delete files[path];
      setFiles(taskId, files);
      return { path, action: "deleted" };
    }
    default:
      return { error: "Unknown tool" };
  }
}
