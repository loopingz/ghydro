import { Versionner } from ".";
import { readFileSync, writeFileSync } from "fs";

export class TextVersionner extends Versionner {
  writeVersion(version: string): void | Promise<void> {
    writeFileSync(this.project.getPath(this.options.path), version);
  }

  lockDependencies: () => void | Promise<void>;
  unlockDependencies: () => void | Promise<void>;

  readVersion(): string {
    return readFileSync(this.project.getPath(this.options.path)).toString();
  }
}
