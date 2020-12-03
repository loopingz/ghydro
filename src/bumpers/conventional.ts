import { VersionBumper } from ".";
import { GitCommit } from "../git";
import * as semver from "semver";
import { GhydroComponent } from "../main";
import { Project } from "../project";

export class ConventionalVersionBumper extends GhydroComponent implements VersionBumper {
  constructor(project: Project, options: any) {
    super(project, options);
  }

  nextVersion(currentVersion: string, commits: GitCommit[]) {
    const increases = ["patch", "minor", "major"];
    return semver.inc(
      currentVersion,
      increases[Math.max(...commits.filter(c => c.conventional).map(c => c.conventional.increase))]
    );
  }
}
