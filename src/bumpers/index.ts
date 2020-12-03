import { GitCommit } from "../git";

export interface VersionBumper {
  nextVersion(currentVersion: string, commits: GitCommit[]): string;
}
