import fs from "node:fs";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import type { CreatePassInput, StoredPass } from "../types.js";

/** Test passes are valid for exactly 7 days from creation. */
export const PASS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function resolveExpiresAt(pass: Pick<StoredPass, "createdAt" | "expiresAt">): string {
  if (pass.expiresAt) return pass.expiresAt;
  return new Date(new Date(pass.createdAt).getTime() + PASS_TTL_MS).toISOString();
}

export function isPassExpired(
  pass: Pick<StoredPass, "createdAt" | "expiresAt">,
  now = Date.now(),
): boolean {
  return new Date(resolveExpiresAt(pass)).getTime() <= now;
}

export class PassStore {
  private readonly indexPath: string;
  private readonly passesDir: string;

  constructor(dataDir: string) {
    this.indexPath = path.join(dataDir, "index.json");
    this.passesDir = path.join(dataDir, "passes");
    fs.mkdirSync(this.passesDir, { recursive: true });
    if (!fs.existsSync(this.indexPath)) {
      this.writeJsonAtomic(this.indexPath, []);
    }
  }

  /** Remove expired test passes from the index and disk. Returns how many were deleted. */
  purgeExpired(now = Date.now()): number {
    const items = this.readAll();
    const kept: StoredPass[] = [];
    const expired: StoredPass[] = [];
    let needsRewrite = false;
    for (const pass of items) {
      const normalized = this.normalizePass(pass);
      if (pass.expiresAt !== normalized.expiresAt) needsRewrite = true;
      if (isPassExpired(normalized, now)) expired.push(normalized);
      else kept.push(normalized);
    }
    if (expired.length === 0) {
      if (needsRewrite) this.writeAll(kept);
      return 0;
    }
    this.writeAll(kept);
    for (const pass of expired) {
      fs.rmSync(path.join(this.passesDir, pass.id), { recursive: true, force: true });
    }
    return expired.length;
  }

  list(): StoredPass[] {
    this.purgeExpired();
    return this.readAll()
      .map((p) => this.normalizePass(p))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get(id: string): StoredPass | undefined {
    this.purgeExpired();
    const pass = this.readAll().find((p) => p.id === id);
    return pass ? this.normalizePass(pass) : undefined;
  }

  create(input: CreatePassInput, baseUrl: string): StoredPass {
    const id = uuidv4();
    const serialNumber = `${input.serialPrefix || "WP"}-${id.slice(0, 8).toUpperCase()}`;
    const now = new Date();
    const createdAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + PASS_TTL_MS).toISOString();
    const pass: StoredPass = {
      id,
      serialNumber,
      createdAt,
      updatedAt: createdAt,
      expiresAt,
      input,
      appleReady: false,
      googleReady: false,
      appleDownloadPath: `/api/passes/${id}/apple.pkpass`,
      googleSavePath: `/api/passes/${id}/google`,
      statusPagePath: `/p/${id}`,
    };
    void baseUrl;
    const items = this.list();
    items.unshift(pass);
    this.writeAll(items);
    fs.mkdirSync(path.join(this.passesDir, id), { recursive: true });
    this.writeJsonAtomic(path.join(this.passesDir, id, "input.json"), input);
    return pass;
  }

  update(id: string, patch: Partial<StoredPass>): StoredPass {
    const items = this.list();
    const idx = items.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error(`Pass ${id} not found`);
    items[idx] = { ...items[idx], ...patch, updatedAt: new Date().toISOString() };
    this.writeAll(items);
    return items[idx];
  }

  passDir(id: string): string {
    return path.join(this.passesDir, id);
  }

  delete(id: string): boolean {
    const items = this.readAll();
    const next = items.filter((p) => p.id !== id);
    if (next.length === items.length) return false;
    this.writeAll(next);
    fs.rmSync(path.join(this.passesDir, id), { recursive: true, force: true });
    return true;
  }

  private normalizePass(pass: StoredPass): StoredPass {
    const expiresAt = resolveExpiresAt(pass);
    if (pass.expiresAt === expiresAt) return pass;
    return { ...pass, expiresAt };
  }

  private readAll(): StoredPass[] {
    const raw = fs.readFileSync(this.indexPath, "utf8");
    return JSON.parse(raw) as StoredPass[];
  }

  private writeAll(items: StoredPass[]): void {
    this.writeJsonAtomic(this.indexPath, items);
  }

  /** Write via temp file + rename so a crash mid-write cannot corrupt the index. */
  private writeJsonAtomic(filePath: string, value: unknown): void {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    const tmp = path.join(
      dir,
      `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`,
    );
    fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    fs.renameSync(tmp, filePath);
  }
}
