import * as jsonpath from "jsonpath";
import { Versionner } from ".";
import { ComponentOptions } from "..";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { Project } from "../project";

export interface JsonVersionnerOptions extends ComponentOptions {
  path: string;
  jsonpath?: string;
}

export class JsonVersionner implements Versionner {
  project: Project;
  options: JsonVersionnerOptions;
  loaded: any;

  constructor(project: Project, options: JsonVersionnerOptions) {
    this.project = project;
    this.options = options;
    this.options.jsonpath ??= "$.version";
  }

  init(): any {
    const res = {};
    jsonpath.value(res, this.options.jsonpath, "0.0.0");
    return res;
  }

  load(): any {
    if (this.loaded) {
      return this.loaded;
    }
    const filepath = this.project.getPath(this.options.path);
    if (!existsSync(filepath)) {
      console.warn(
        "File",
        filepath,
        "does not exist for versionner",
        this.options.type,
        "on project",
        this.project.name
      );
      this.loaded = this.init();
    } else {
      this.loaded = this.loadFile(filepath);
    }
    return this.loaded;
  }

  loadFile(filepath: string): any {
    return JSON.parse(readFileSync(filepath).toString());
  }

  save(info: any) {
    writeFileSync(this.project.getPath(this.options.path), JSON.stringify(info, undefined, 2));
  }

  readVersion(): string {
    return jsonpath.value(this.load(), this.options.jsonpath);
  }

  writeVersion(version: string): void {
    let info = this.load();
    jsonpath.value(info, this.options.jsonpath, version);
    this.save(info);
  }

  lockDependencies() {}

  unlockDependencies() {}
}
