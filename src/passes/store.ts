import fs from "node:fs";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import type { CreatePassInput, StoredPass } from "../types.js";

export class PassStore {
  private readonly indexPath: string;
  private readonly passesDir: string;

  constructor(dataDir: string) {
    this.indexPath = path.join(dataDir, "index.json");
    this.passesDir = path.join(dataDir, "passes");
    fs.mkdirSync(this.passesDir, { recursive: true });
    if (!fs.existsSync(this.indexPath)) {
      fs.writeFileSync(this.indexPath, "[]", "utf8");
    }
  }

  list(): StoredPass[] {
    const raw = fs.readFileSync(this.indexPath, "utf8");
    const items = JSON.parse(raw) as StoredPass[];
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get(id: string): StoredPass | undefined {
    return this.list().find((p) => p.id === id);
  }

  create(input: CreatePassInput, baseUrl: string): StoredPass {
    const id = uuidv4();
    const serialNumber = `${input.serialPrefix || "WP"}-${id.slice(0, 8).toUpperCase()}`;
    const now = new Date().toISOString();
    const pass: StoredPass = {
      id,
      serialNumber,
      createdAt: now,
      updatedAt: now,
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
    fs.writeFileSync(path.join(this.passesDir, id, "input.json"), JSON.stringify(input, null, 2));
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
    const items = this.list();
    const next = items.filter((p) => p.id !== id);
    if (next.length === items.length) return false;
    this.writeAll(next);
    fs.rmSync(path.join(this.passesDir, id), { recursive: true, force: true });
    return true;
  }

  private writeAll(items: StoredPass[]): void {
    fs.writeFileSync(this.indexPath, JSON.stringify(items, null, 2), "utf8");
  }
}
