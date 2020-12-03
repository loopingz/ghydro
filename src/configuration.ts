import { Versionner } from "./versionners";
import { Processor } from "./processors";
import { GitCommit } from "./git";
/*
projects: {
    "docs/test": {
      name: "",
      type: ""
    }
  },
  config: {
      unifiedChangeLog: "",
    defaultType: "javascript",
    changeLogPath: "${path}/CHANGELOG.md",
    plugins: []
  }
*/

export interface ProjectConfiguration {
  /**
   * Bump version
   */
  versionBumper?: { type: string };
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
  versionners?: (Versionner | string)[];
  /**
   * Define processors
   *
   * @default []
   */
  processors?: (Processor | string)[];
  /**
   * Commit filter
   *
   * @default new ProjectFilter()
   */
  //filter?: CommitFilter;
  subprojects?: { [key: string]: ProjectConfiguration };

  subconfig?: ProjectConfiguration;
  /**
   * Skip this project
   */
  skip?: boolean;
}

export interface Configuration {
  /**
   * Contains project definition in this repo
   */
  projects: { [key: string]: ProjectConfiguration };
  /**
   * Global configuration for ghydro
   */
  config: {
    /**
     * Generate a repository changelog
     * Path to this changelog
     */
    unifiedChangeLog?: string;
    /**
     * Default type of project if not defined
     */
    defaultType?: string;
    /**
     * Tag to use
     * @default "${name}/${version}"
     */
    tagName?: string;
    /**
     * Plugins to install before running
     */
    plugins?: string[];
  };
}
