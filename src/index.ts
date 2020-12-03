import * as process from "process";
import GitService, { GitCommit } from "./git";
import { existsSync } from "fs";
import * as path from "path";
import { ConventionalVersionBumper } from "./bumpers/conventional";
import { JsonVersionner } from "./versionners/json";
import { YamlVersionner } from "./versionners/yaml";
import { Project } from "./project";
import { NpmVersionner } from "./versionners/npm";
import { TextVersionner } from "./versionners/text";
import { ChangeLogProcessor } from "./processors/changelog";

export interface ComponentOptions {
  type?: string;
}

export type ComponentType = "versionner" | "bumper" | "processor";

export class Ghydro {
  static path: string = process.cwd();
  static projects: Project[] = [];
  static configuration: any;
  static registry: {
    [key: string]: { [key: string]: any };
  } = {};

  public static init(path: string = process.cwd()) {
    this.path = path;
  }

  public static getPath(subpath: string) {
    return path.join(this.path, subpath);
  }

  public static async load() {
    if (!existsSync(path.join(this.path, ".ghydro.js"))) {
      throw new Error("This project is not a Ghydro project");
    }
    this.configuration = require(path.join(this.path, ".ghydro.js"));
    this.projects = Object.keys(this.configuration.projects || {}).map(projectPath => {
      return new Project(projectPath, this.configuration.projects[projectPath], this.configuration.config);
    });
    this.projects.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
    const allProjects = this.getAllProjects();
    for (let p in allProjects) {
      if (!allProjects[p].configuration.skip) {
        await allProjects[p].computeCommits();
      }
    }
  }

  static getCommits(since: string, path: string): GitCommit[] {
    let selector = "";
    // `git log --format=format:%h ${source}..${branch} -- ${f}`
    if (since) {
      selector += `${since}..HEAD`;
    }
    selector += ` -- ${path}`;
    return GitService.getCommits(this.path, selector);
  }

  /**
   * Read the configuration from config file
   */
  static getProjects(): Project[] {
    return this.projects;
  }

  static getAllProjects(): Project[] {
    return this.projects.map(p => [p, ...p.getAllSubprojects()]).flat();
  }

  /**
   * Check if commit was made between HEAD and latest tags
   */
  static getUpdatedProjects(): Project[] {
    return this.getAllProjects().filter(p => p.hasChanged());
  }

  static check() {
    const projects = this.getProjects();
    const allProjects = this.getAllProjects();
    console.log(`${projects.length} root projects`);
    console.log(`${allProjects.length} total projects\n`);

    return this.displayTree(project => {
      if (project.description) {
        return `: ${project.description}`;
      }
      return "";
    });
  }

  static async versions() {
    return this.displayTree(async project => {
      if (project.hasChanged()) {
        return ": " + (await project.getVersion()) + " -> " + (await project.getNextVersion());
      }
      return ": " + (await project.getVersion());
    });
  }

  static async displayTree(callback: (project: Project) => string | Promise<string>, skipIgnore: boolean = true) {
    let lines = [];
    this.walkProjects((project, level) => {
      lines.push({
        tree: `${level > 0 ? " |--" : ""}${"--".repeat(level > 0 ? level - 1 : 0)}${project.name}`,
        project
      });
    });
    let maxTreeView = Math.max(...lines.map(l => l.tree.length)) + 1;
    lines = lines.map(l => ({ tree: l.tree.padEnd(maxTreeView), project: l.project }));
    for (let l in lines) {
      const line = lines[l];
      if (skipIgnore && line.project.configuration.skip) {
        console.log(line.tree);
        continue;
      }
      console.log(line.tree, await callback(line.project));
    }
  }

  /**
   * Execute on all projects
   *
   * @param callback
   * @param projects
   * @param level
   */
  static async walkProjects(
    callback: (project: Project, level: number) => void | Promise<void>,
    projects: Project[] = this.projects,
    level: number = 0
  ) {
    for (let p in projects) {
      const project = projects[p];
      callback(project, level);
      this.walkProjects(callback, project.subprojects, level + 1);
    }
  }

  /**
   *
   */
  static async run(argv: any) {
    const step = argv._.pop();
    if (step === "check") {
      await this.check();
      return;
    }
    if (step === "versions") {
      await this.versions();
      return;
    }
    let words = step.split("-");
    let methodName = words.shift() + words.map(w => w.substr(0,1).toUpperCase() + w.substr(1));
    let projects = argv.force ? this.getProjects() : this.getUpdatedProjects();
    for (let p in projects) {
      const project = projects[p];
      await Promise.all(project.processors
        .filter(processor => processor.hasStep(methodName))
        .map(processor => {
          return processor.execute(methodName);
        }));
    }
  }

  static register(name: string, type: ComponentType, component: any) {
    this.registry[type] ??= {};
    this.registry[type][name] = component;
  }

  static getComponent(project: Project, type: ComponentType, options: any) {
    if (options.type === "custom") {
      return options;
    } else if (options.type) {
      if (!this.registry[type] || !this.registry[type][options.type]) {
        throw new Error(`Cannot find component ${type}:${options.type}`);
      }
      return new this.registry[type][options.type](project, options);
    }
  }
}

Ghydro.register("json", "versionner", JsonVersionner);
Ghydro.register("yaml", "versionner", YamlVersionner);
Ghydro.register("npm", "versionner", NpmVersionner);
Ghydro.register("text", "versionner", TextVersionner);
Ghydro.register("conventional", "bumper", ConventionalVersionBumper);
Ghydro.register("changelog", "processor", ChangeLogProcessor);
