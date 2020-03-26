import { join } from "path"
import expect from "./expect"
import packages, { RecordMatcher } from "../src/packages"
import tinyId from "../src/tinyId"

describe("packages", () => {
  const cwdPath = join(__dirname, "fixtures")
  const jsonPath = join(cwdPath, "packages.json")
  const pkgsPath = join(cwdPath, "packages")
  const matcher: RecordMatcher = (arg, { name }) =>
    arg === name

  beforeEach(() => {
    packages.reset()
    tinyId.reset()
  })

  it("should load", async () => {
    await packages.load({ cwdPath, jsonPath, pkgsPath })

    expect(packages.records[cwdPath]).toEqual([
      {
        id: "a",
        name: "dir1",
      },
      {
        id: "b",
        name: "dir2",
      },
      {
        id: "c",
        name: "file1.ts",
      },
      {
        id: "d",
        name: "file2.ts",
      },
    ])
  })

  it("should load dirs only", async () => {
    await packages.load({
      cwdPath,
      jsonPath,
      pkgsPath,
      dirsOnly: true,
    })

    expect(packages.records[cwdPath]).toEqual([
      {
        id: "a",
        name: "dir1",
      },
      {
        id: "b",
        name: "dir2",
      },
    ])
  })

  it("should load files only", async () => {
    await packages.load({
      cwdPath,
      jsonPath,
      pkgsPath,
      filesOnly: true,
    })

    expect(packages.records[cwdPath]).toEqual([
      {
        id: "a",
        name: "file1.ts",
      },
      {
        id: "b",
        name: "file2.ts",
      },
    ])
  })

  it("should find without matcher", async () => {
    const results = await packages.find(cwdPath, [
      "file1.ts",
    ])

    expect(results).toEqual([
      { arg: "file1.ts", id: "a", newRecord: true },
    ])
  })

  it("should find with matcher", async () => {
    await packages.load({
      cwdPath,
      jsonPath,
      pkgsPath,
    })

    packages.append(cwdPath, [{ name: "file1.ts" }])

    const args = ["file1.ts", "newFile.ts"]
    const results = await packages.find(cwdPath, args, {
      matcher,
    })

    expect(results).toEqual([
      { name: "file1.ts", id: "c" },
      { name: "file1.ts", id: "e" },
      { arg: "newFile.ts", id: "f", newRecord: true },
    ])
  })

  it("should find with modifier", async () => {
    await packages.load({
      cwdPath,
      jsonPath,
      pkgsPath,
    })

    packages.append(cwdPath, [{ name: "file1.ts" }])

    const args = ["file1.ts", "newFile.ts"]
    const results = await packages.find(cwdPath, args, {
      matcher,
      modify: async (cwdPath, record) => ({
        ...record,
        name: (record.name || record.arg).slice(0, -3),
      }),
    })

    expect(results).toEqual([
      { name: "file1", id: "c" },
      { name: "file1", id: "e" },
      {
        arg: "newFile.ts",
        id: "f",
        name: "newFile",
        newRecord: true,
      },
    ])
  })

  it("should find unique", async () => {
    await packages.load({
      cwdPath,
      jsonPath,
      pkgsPath,
    })

    packages.append(cwdPath, [{ name: "file2.ts" }])

    const args = ["file2.ts"]
    const results = await packages.find(cwdPath, args, {
      matcher: (arg, { name }) => arg === name,
      unique: true,
    })

    expect(results).toEqual([{ name: "file2.ts", id: "d" }])
  })
})
