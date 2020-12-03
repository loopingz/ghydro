import { ComponentOptions } from ".";
import { Project } from "./project";

export class GhydroComponent<T extends ComponentOptions = ComponentOptions> {
  options: T;
  project: Project;
  constructor(project: Project, options: T) {
    this.project = project;
    this.options = options;
  }
}
