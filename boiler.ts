import {
  ActionBoiler,
  PromptBoiler,
  BoilerAction,
  BoilerPrompt,
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

export const install: ActionBoiler = async () => {
  const actions: BoilerAction[] = []

  actions.push({
    action: "npmInstall",
    source: ["fs-extra"],
  })

  return actions
}

export const uninstall: ActionBoiler = async () => {
  const actions: BoilerAction[] = []

  actions.push({
    action: "npmInstall",
    source: ["fs-extra"],
    uninstall: true,
  })

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
