import { Processor } from ".";
import { ComponentOptions } from "..";

export interface ChangeLogOptions extends ComponentOptions {
    path?: string;
    template?: string;
}


export class ChangeLogProcessor extends Processor<ChangeLogOptions> {
    async prepareRelease() {
        let commits = await this.project.getCommits();
        console.log(this.project.getPath(this.options.path || "./CHANGELOG.md") );
    }
}