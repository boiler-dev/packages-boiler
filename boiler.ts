import { join } from "path"
import {
  ActionBoiler,
  PromptBoiler,
  BoilerAction,
  BoilerPrompt,
  fs,
} from "boiler-dev"

export const prompt: PromptBoiler = async () => {
  const prompts: BoilerPrompt[] = []

  // prompts.push({
  //   type: "input",
  //   name: "someValue",
  //   message: "some message",
  //   default: "some default",
  // })

  return prompts
}

export const install: ActionBoiler = async ({ paths }) => {
  const actions: BoilerAction[] = []

  actions.push({
    action: "npmInstall",
    source: ["fs-extra"],
  })

  actions.push({
    action: "generate",
    source: ["git@github.com:boiler-dev/files-boiler.git"],
  })

  await fs.ensureFile(
    join(
      paths.cwdPath,
      "test/fixtures/packages/dir1/.gitkeep"
    )
  )

  await fs.ensureFile(
    join(
      paths.cwdPath,
      "test/fixtures/packages/dir2/.gitkeep"
    )
  )

  await fs.ensureFile(
    join(paths.cwdPath, "test/fixtures/packages/file1.ts")
  )

  await fs.ensureFile(
    join(paths.cwdPath, "test/fixtures/packages/file2.ts")
  )

  return actions
}

export const uninstall: ActionBoiler = async ({
  paths,
}) => {
  const actions: BoilerAction[] = []

  actions.push({
    action: "npmInstall",
    source: ["fs-extra"],
    uninstall: true,
  })

  await fs.rmdir(
    join(paths.cwdPath, "test/fixtures/packages")
  )

  return actions
}

export const generate: ActionBoiler = async () => {
  const actions: BoilerAction[] = []

  actions.push({
    action: "write",
    path: "src/packages.ts",
    sourcePath: "tsignore/packages.ts",
  })

  actions.push({
    action: "write",
    path: "test/packages.spec.ts",
    sourcePath: "tsignore/packages.spec.ts",
  })

  return actions
}

export const absorb: ActionBoiler = async ({ writes }) => {
  return writes.map(({ path, sourcePath }) => ({
    action: "write",
    sourcePath: path,
    path: sourcePath,
    // modify: (src: string): string => src,
  }))
}
