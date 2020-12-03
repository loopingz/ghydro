import { Project } from "../project";
import { JsonVersionner } from "./json";

export class NpmVersionner extends JsonVersionner {
  constructor(project: Project, options: any) {
    super(project, { ...options, path: options.path || "package.json", jsonpath: "$.version" });
  }
}
