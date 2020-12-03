export interface Versionner {
  readVersion: () => string | Promise<string>;
  writeVersion: (version: string) => void | Promise<void>;
  lockDependencies: () => void | Promise<void>;
  unlockDependencies: () => void | Promise<void>;
}
