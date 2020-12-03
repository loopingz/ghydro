import { ComponentOptions } from "..";
import { GhydroComponent } from "../main";

export interface ProcessorResult {
    /**
     * Result of the processor
     */
    result: "success" | "neutral" | "error";
    /**
     * Markdown report
     */
    report: string;
  }

export class Processor<T extends ComponentOptions = ComponentOptions> extends GhydroComponent<T> {

    hasStep(step: string) : boolean {
        return this[step] && typeof this[step] === "function";
    }

    execute(step: string) : ProcessorResult | Promise<ProcessorResult> {
        return this[step]();
    }
}