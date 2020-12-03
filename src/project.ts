import { Processor } from "./processors";
import { VersionBumper } from "./bumpers";
import { ProjectConfiguration } from "./configuration";
import { GitCommit } from "./git";
import { Versionner } from "./versionners";
import * as path from "path";
import { Ghydro } from "./index";

export type CommitFilter = (commit: GitCommit) => boolean;

export class Project {
  /**
   * Project name
   *
   * @default basename(path)
   */
  name?: string;
  /**
   * Tag name regexp
   *
   * You can use any property from this object
   * ${name} / ${version} / ...
   *
   * @default global.config.tagName
   */
  tagName?: string;
  /**
   * Description of the project
   *
   * @default ""
   */
  description?: string;
  /**
   * Project path
   *
   * @default key used to define it in Configuration
   */
  path?: string;
  /**
   * Define versionners
   *
   * @default []
   */
  versionners?: Versionner[];

  /**
   * In charge of bumping version
   */
  versionBumper: VersionBumper;
  /**
   * Define processing on your projects
   *
   * @default []
   */
  processors?: Processor[];
  /**
   * Commit filter
   *
   * @default new ProjectFilter()
   */
  filter?: CommitFilter;

  /**
   * Subprojects to this project
   */
  subprojects: Project[];
  /**
   * Subprojects default config
   */
  subconfig: any;

  configuration: ProjectConfiguration;

  commits: GitCommit[];

  constructor(projectPath: string, config: ProjectConfiguration, parentConfig: ProjectConfiguration = {}) {
    this.configuration = Object.assign({}, parentConfig, config);
    this.description = this.configuration.description;
    this.tagName = this.configuration.tagName;
    this.path = projectPath;
    this.name = config.name || path.basename(projectPath);
    this.subprojects = [];
    this.commits = [];
    Object.keys(this.configuration.subprojects || {}).forEach(cfg => {
      this.subprojects.push(
        new Project(
          path.join(projectPath, cfg),
          this.configuration.subprojects[cfg],
          Object.assign(
            {},
            // Exclude any sub... properties
            Object.keys(this.configuration)
              .filter(key => !key.startsWith("sub"))
              .reduce((obj, key) => {
                obj[key] = this.configuration[key];
                return obj;
              }, {}),
            this.configuration.subconfig
          )
        )
      );
    });
    this.subprojects.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
    this.versionners = [];
    this.configuration.versionners ??= [];
    this.configuration.versionners.forEach(versionner => {
      this.versionners.push(Ghydro.getComponent(this, "versionner", versionner));
    });
    this.processors = [];
    this.configuration.processors ??= [];
    this.configuration.processors.forEach(processor => {
      this.processors.push(Ghydro.getComponent(this, "processor", processor));
    });
    this.versionBumper = Ghydro.getComponent(
      this,
      "bumper",
      this.configuration.versionBumper || { type: "conventional" }
    );
    this.filter = this.filter ?? (() => true);
  }

  async computeCommits(since: string = undefined): Promise<GitCommit[]> {
    if (!since) {
      since = await this.getLatestTag();
    }
    const res = Ghydro.getCommits(since, this.path).filter(this.filter.bind(this));
    if (this.commits) {
      this.commits = res;
    }
    return res;
  }

  async getCommits(since: string = undefined): Promise<GitCommit[]> {
    if (!since) {
      return this.commits;
    }
    return this.computeCommits(since);
  }

  async getLatestTag(): Promise<string> {
    const replacements = {
      name: this.name,
      version: await this.getVersion()
    };
    if (replacements.version === "0.0.0") {
      return "";
    }
    return new Function("return `" + this.configuration.tagName.replace(/\$\{/g, "${this.") + "`;").call(replacements);
  }

  getAllSubprojects(): Project[] {
    return [...this.subprojects, ...this.subprojects.map(sub => sub.getAllSubprojects()).flat()];
  }

  async getVersion(): Promise<string> {
    return await this.versionners[0].readVersion();
  }

  async getNextVersion(): Promise<string> {
    return await this.versionBumper.nextVersion(await this.getVersion(), await this.getCommits());
  }

  /**
   * Return path absolute or relative depending if it is starting with a '/'
   * @param subpath
   */
  getPath(subpath: string): string {
    if (!subpath.startsWith("/")) {
      subpath = path.join(this.path, subpath);
    } else {
      subpath = subpath.substr(1);
    }
    return Ghydro.getPath(subpath);
  }

  hasChanged(): boolean {
    return this.commits.length > 0;
  }
}
