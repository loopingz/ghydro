import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { Processor } from ".";
import { ComponentOptions } from "..";

export interface NpmOptions extends ComponentOptions {
    path?: string;
    template?: string;
    yarn?: boolean;
}


export class NpmProcessor extends Processor<NpmOptions> {
    hasStep(step: string) {
        const packageJsonPath = this.project.getPath("package.json");
        if (!existsSync(packageJsonPath)) {
            return false;
        }
        const packageInfo = JSON.parse(readFileSync(packageJsonPath).toString())
        return packageInfo.scripts && packageInfo.scripts[step];
    }

    execute(step: string) {
        if (this.options.yarn) {
            execSync(`yarn run ${step}`);
        } else {
            execSync(`npm run ${step}`);
        }
        return undefined;
    }
}