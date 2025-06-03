import sourceMapSupport from "source-map-support"
sourceMapSupport.install(options)
import type { Argv, BuildCtx } from "./util/ctx"
import type { FilePath, FullSlug } from "./util/path"

import cfg from "../quartz.config"
import { createFileParser, createProcessor } from "./processors/parse"
import { options } from "./util/sourcemap"

// only called from worker thread
export async function parseFiles(argv: Argv, fps: FilePath[], allSlugs: FullSlug[]) {
  const ctx: BuildCtx = {
    cfg,
    argv,
    allSlugs,
  }
  const processor = createProcessor(ctx)
  const parse = createFileParser(ctx, fps)
  return parse(processor)
}
