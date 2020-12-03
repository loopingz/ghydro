import { JsonVersionner } from "./json";
import { readFileSync, writeFileSync } from "fs";
import * as YAML from "yaml";

export class YamlVersionner extends JsonVersionner {
  loadFile(filepath: string): any {
    return YAML.parse(readFileSync(filepath).toString());
  }

  save(info: any) {
    writeFileSync(this.project.getPath(this.options.path), YAML.stringify(info));
  }
}
