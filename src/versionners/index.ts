import { Project } from "../project";

export abstract class Versionner {
  project: Project;
  options: any;

  constructor(project: Project, options: any) {
    this.project = project;
    this.options = options;
  }

  abstract readVersion(): string | Promise<string>;
  abstract writeVersion(version: string): void | Promise<void>;
  abstract lockDependencies(): void | Promise<void>;
  abstract unlockDependencies(): void | Promise<void>;
}
