import {
  BaseDirectory,
  readTextFile,
  writeTextFile,
  mkdir,
  exists,
} from '@tauri-apps/plugin-fs';

const DATA_DIR = 'data';

export const DATA_FILES = {
  incomes: `${DATA_DIR}/incomes.json`,
  expenses: `${DATA_DIR}/expenses.json`,
  categories: `${DATA_DIR}/categories.json`,
  goals: `${DATA_DIR}/goals.json`,
  events: `${DATA_DIR}/events.json`,
  settings: `${DATA_DIR}/settings.json`,
} as const;

export type DataFileName = keyof typeof DATA_FILES;

export async function ensureDataDir(): Promise<void> {
  try {
    const dirExists = await exists(DATA_DIR, { baseDir: BaseDirectory.AppLocalData });
    if (!dirExists) {
      await mkdir(DATA_DIR, { baseDir: BaseDirectory.AppLocalData, recursive: true });
    }
  } catch (err) {
    console.warn('[Storage] ensureDataDir error:', err);
  }
}

export async function readJson<T>(fileName: string, defaultValue: T): Promise<T> {
  try {
    const fileExists = await exists(fileName, { baseDir: BaseDirectory.AppLocalData });
    if (!fileExists) return defaultValue;
    const text = await readTextFile(fileName, { baseDir: BaseDirectory.AppLocalData });
    return JSON.parse(text) as T;
  } catch (err) {
    console.warn(`[Storage] Failed to read ${fileName}:`, err);
    return defaultValue;
  }
}

export async function writeJson<T>(fileName: string, data: T): Promise<void> {
  try {
    await writeTextFile(fileName, JSON.stringify(data, null, 2), {
      baseDir: BaseDirectory.AppLocalData,
    });
  } catch (err) {
    console.error(`[Storage] Failed to write ${fileName}:`, err);
  }
}

export async function loadDomain<T>(domain: DataFileName, defaultValue: T): Promise<T> {
  return readJson<T>(DATA_FILES[domain], defaultValue);
}

export async function saveDomain<T>(domain: DataFileName, data: T): Promise<void> {
  return writeJson<T>(DATA_FILES[domain], data);
}
