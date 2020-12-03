#!/usr/bin/env node
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
import { Ghydro } from "./index";

const parsed = yargs(hideBin(process.argv)).argv;

Ghydro.init(parsed.path);
(async () => {
  await Ghydro.load();
  await Ghydro.run(parsed);
})();
