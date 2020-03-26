import { pathExists, readJson, writeJson } from "fs-extra"

import files from "./files"

export interface PackageRecord {
  arg?: string
  id?: number
  name?: string
  newRecord?: boolean
}

export type RecordModifier = (
  cwdPath: string,
  record: PackageRecord
) => Promise<PackageRecord>

export type RecordMatcher = (
  arg: string,
  record: PackageRecord
) => boolean

export interface AppendOptions {
  onlyNewRecords?: boolean
}

export interface FindOptions {
  forceNew?: boolean
  matcher?: RecordMatcher
  modify?: RecordModifier
  unique?: boolean
}

export interface SaveOptions {
  modify?: RecordModifier
}

export class Packages {
  records: Record<string, PackageRecord[]> = {}

  append(
    cwdPath: string,
    records: PackageRecord[],
    options: AppendOptions = {}
  ): void {
    if (options.onlyNewRecords) {
      records = records.filter(({ newRecord }) => newRecord)
    }

    this.records[cwdPath] = (
      this.records[cwdPath] || []
    ).concat(records)

    this.updateIds(this.records[cwdPath])
  }

  async find(
    cwdPath: string,
    args: string[],
    options: FindOptions = {}
  ): Promise<PackageRecord[]> {
    let records: PackageRecord[] = []
    const newRecords: PackageRecord[] = []
    const existingRecords = this.records[cwdPath] || []

    if (args.length) {
      for (const arg of args) {
        let found = []

        if (!options.forceNew && options.matcher) {
          found = existingRecords.filter(record =>
            options.matcher(arg, record)
          )
        }

        records = records.concat(found)

        if (!found.length) {
          newRecords.push({ arg, newRecord: true })
        }
      }
    } else {
      records = existingRecords
    }

    this.updateIds(
      newRecords,
      records.length
        ? records[records.length - 1].id + 1
        : 0
    )

    records = records.concat(newRecords)
    records = await this.reload(
      cwdPath,
      records,
      options.modify
    )

    if (options.unique) {
      const found = {}

      records = records.filter(({ name }) => {
        if (!found[name]) {
          return (found[name] = true)
        }
      })
    }

    return records
  }

  async load({
    cwdPath,
    jsonPath,
    pkgsPath,
    dirsOnly,
    filesOnly,
  }: {
    cwdPath: string
    jsonPath: string
    pkgsPath: string
    dirsOnly?: boolean
    filesOnly?: boolean
  }): Promise<PackageRecord[]> {
    let records: PackageRecord[] = []

    if (await pathExists(jsonPath)) {
      records = await readJson(jsonPath)
    } else if (await pathExists(pkgsPath)) {
      const [dirs, paths] = await files.ls(pkgsPath)
      const all = dirs.concat(paths)
      const pkgs = dirsOnly ? dirs : filesOnly ? paths : all
      records = pkgs.sort().map(name => ({ name }))
    }

    this.append(cwdPath, records)
    return this.records[cwdPath]
  }

  async reload(
    cwdPath: string,
    records: PackageRecord[],
    modifier: RecordModifier
  ): Promise<PackageRecord[]> {
    if (!modifier) {
      return records
    }

    const modify = (
      record: PackageRecord
    ): Promise<PackageRecord> => modifier(cwdPath, record)

    return await Promise.all(records.map(modify))
  }

  remove(
    cwdPath: string,
    ...records: PackageRecord[]
  ): void {
    this.records[cwdPath] = this.records[cwdPath].filter(
      record => !records.includes(record)
    )
  }

  reset(): void {
    this.records = {}
  }

  async save(
    cwdPath: string,
    jsonPath: string,
    options: SaveOptions = {}
  ): Promise<void> {
    const records = await this.reload(
      cwdPath,
      this.records[cwdPath],
      options.modify
    )

    for (const record of records) {
      delete record.id
    }

    await writeJson(jsonPath, records, {
      spaces: 2,
    })
  }

  updateIds(records: PackageRecord[], start = 0): void {
    records.forEach(
      (record, index) => (record.id = start + index)
    )
  }
}

export default new Packages()
