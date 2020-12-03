import * as child_process from "child_process";
import * as fs from "fs";
import * as path from "path";

export interface RepositoryInfo {
  path: string;
  commit: string; // Current HEAD
  short: string; // Short ref to HEAD
  master: string; // master reference
  tags: string[];
  pullRequest?: string;
  branch: string; // Current branch or detached
  isDirty: boolean;
  isPushed: boolean;
  isMerged: boolean;
  isAligned: boolean; // Could be merge with ff on master
  repository: string; // Repository information
}

export interface GitConventionalCommit {
  type: "feat" | "chore" | "";
  /**
   * 0 = 'patch'
   * 1 = 'minor'
   * 2 = 'major'
   */
  increase: 0 | 1 | 2;
  version: "patch" | "minor" | "major";
  scope: string;
}

export interface GitPerson {
  email: string;
  name: string;
}
export interface GitCommit {
  ref: string;
  short: string;
  tree: string;
  parents: string;
  author: GitPerson;
  timestamp: number;
  commiter: GitPerson;
  commitTimestamp: number;
  subject: string;
  body: string;
  footers: { [key: string]: string };
  signStatus: string;
  signer: string;
  conventional?: GitConventionalCommit;
  shortSubject?: string;
  paths: string[];
}

export default class GitService {
  /**
   * Compute the repository information of folder
   *
   * @param folder
   */
  static computeRepositoryInfo(folder: string = undefined): RepositoryInfo {
    if (!folder) {
      folder = process.cwd();
    }
    while (!fs.existsSync(path.join(folder, ".git")) && folder !== "/") {
      folder = path.resolve(path.join(folder, ".."));
    }
    if (folder === "/") {
      throw new Error("No git repository found");
    }
    folder = path.resolve(folder);
    let options = { cwd: folder };

    let branch;
    let res = child_process.spawnSync("git symbolic-ref --short HEAD", { shell: true, ...options });
    if (!res.status) {
      branch = res.stdout.toString().trim();
    } else {
      branch = "detached";
    }
    let tags = [];
    res = child_process.spawnSync("git tag --points-at HEAD", { shell: true, ...options });
    if (!res.status) {
      tags = res.stdout
        .toString()
        .trim()
        .split("\n")
        .filter(c => c !== "");
    }
    let repository = child_process
      .execSync("git remote get-url origin", options)
      .toString()
      .trim()
      .replace(/^.*[\/:]([^\/]*)\/([^\/]*)\.git$/g, (f, owner, repo) => `${owner}/${repo}`);
    let commit = child_process.execSync("git rev-parse HEAD", options).toString().trim();
    let short = child_process.execSync("git rev-parse --short HEAD", options).toString().trim();
    let master = child_process.execSync("git rev-parse origin/master", options).toString().trim();
    return {
      path: folder,
      tags,
      commit,
      short,
      master,
      repository,
      branch,
      isAligned:
        child_process.execSync(`git branch -r --contains ${master} | wc -l`, options).toString().trim() !== "0",
      isDirty: child_process.spawnSync("git", "diff --quiet".split(" "), options).status === 1,
      isPushed: child_process.execSync(`git branch -r --contains ${commit} | wc -l`, options).toString().trim() !== "0",
      isMerged:
        child_process.execSync(`git log origin/master | grep ${commit} | wc -l`, options).toString().trim() === "1"
    };
  }

  /**
   *
   * @param gitRepositoryPath folder containing a .git
   * @param selector git log arguments
   */
  static getCommits(gitRepositoryPath: string, selector: string = ""): GitCommit[] {
    // Prevent selector that would end up launch a 2nd command
    if (selector.indexOf("&") >= 0 || selector.indexOf("|") >= 0 || selector.indexOf(";") >= 0) {
      throw new Error("Not legit selector");
    }
    // Get all commit into readable form
    let res = child_process.spawnSync(
      `git log --format=format:"#%H|%h|%T|%P|%an|%ae|%at|%cn|%ce|%ct|%s|%B|%G?|%GS#" ${selector}`,
      { shell: true, cwd: gitRepositoryPath }
    );
    let output = res.stdout.toString();
    let commits = [];
    let match;
    while (
      (match = /^#(?<ref>[\da-f]+)\|(?<short>[\da-f]+)\|(?<tree>[\da-f]+)\|(?<parents>[\da-f]+)\|(?<authorName>[^\|]*)\|(?<authorEmail>[^\|]*)\|(?<timestamp>\d+)\|(?<commiterName>[^\|]*)\|(?<commiterEmail>[^\|]*)\|(?<commiterTimestamp>\d+)\|(?<subject>[^|]*)\|[^\n]*(?<body>[^\|]*)\|(?<signStatus>[A-Z])\|(?<signerName>[^|]*)#$/gm.exec(
        output
      ))
    ) {
      let commit: any = { ...match.groups };
      let cmatch = /^((?<conventional>feat|fix|chore|ci|build|docs|style|refactor|perf|test)(\((?<scope>.*)\))?(?<breaking>!)?: )?((?<jira>[A-Z]{3}-\d+):? ?)?(?<shortSubject>.+)$/g.exec(
        commit.subject
      );
      if (cmatch) {
        commit = { ...commit, ...cmatch.groups };
      }
      // Follow same as git --pretty="%h"
      commit.short = commit.short;
      res = child_process.spawnSync(`git diff-tree --no-commit-id --name-only -r ${commit.short}`, {
        shell: true,
        cwd: gitRepositoryPath
      });
      commit.paths = res.stdout.toString().split("\n");
      commit.body = commit.body.trim();
      if (commit.conventional) {
        let increase = commit.conventional === "feat" ? 1 : 0;
        let increaseVersion = ["patch", "minor", "major"];
        if (commit.body.match(/^BREAKING CHANGE/g) || commit.breaking) {
          increase = 2;
        }
        commit.conventional = {
          type: commit.conventional,
          increase,
          version: increaseVersion[increase]
        };
        if (commit.scope) {
          commit.conventional.scope = commit.scope;
        }
        commit.author = {
          name: commit.authorName,
          email: commit.authorEmail
        };
        commit.commiter = {
          name: commit.commiterName,
          email: commit.commiterEmail
        };
        // Some cleanup
        delete commit.authorName;
        delete commit.authorEmail;
        delete commit.commiterName;
        delete commit.commiterEmail;
        delete commit.scope;
        delete commit.breaking;
      }
      commits.push(commit);
      output = output.substr(match[0].length);
    }
    return commits;
  }
}
