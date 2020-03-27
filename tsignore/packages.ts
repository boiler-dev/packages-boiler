import { pathExists, readJson, writeJson } from "fs-extra"

import files from "./files"
import tinyId from "./tinyId"

export interface PackageRecord {
  arg?: string
  id?: string
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
  appendNew?: boolean
  forceNew?: boolean
  matcher?: RecordMatcher
  modify?: RecordModifier
  unique?: boolean
}

export interface LoadOptions {
  dirsOnly?: boolean
  filesOnly?: boolean
  modify?: RecordModifier
}

export interface ReloadOptions {
  modify?: RecordModifier
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
          found = existingRecords.filter((record) =>
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

    this.updateIds(newRecords)

    records = records.concat(newRecords)
    records = await this.reload(cwdPath, records, options)

    if (options.appendNew) {
      this.append(cwdPath, records, {
        onlyNewRecords: true,
      })
    }

    if (options.unique) {
      const found = {}

      records = records.reverse().filter(({ name }) => {
        if (!found[name]) {
          return (found[name] = true)
        }
      })
    }

    return records
  }

  async load(
    cwdPath: string,
    jsonPath: string,
    pkgsPath: string,
    { dirsOnly, filesOnly, modify }: LoadOptions = {}
  ): Promise<PackageRecord[]> {
    let records: PackageRecord[] = []

    if (await pathExists(jsonPath)) {
      records = await readJson(jsonPath)
    } else if (await pathExists(pkgsPath)) {
      const [dirs, paths] = await files.ls(pkgsPath)
      const all = dirs.concat(paths)
      const pkgs = dirsOnly ? dirs : filesOnly ? paths : all
      records = pkgs.sort().map((name) => ({ name }))
    }

    this.updateIds(records)

    this.append(
      cwdPath,
      await this.reload(cwdPath, records, { modify })
    )

    return this.records[cwdPath]
  }

  async reload(
    cwdPath: string,
    records: PackageRecord[],
    { modify }: ReloadOptions = {}
  ): Promise<PackageRecord[]> {
    if (!modify) {
      return records
    }

    return await Promise.all(
      records.map(
        (record: PackageRecord): Promise<PackageRecord> =>
          modify(cwdPath, record)
      )
    )
  }

  remove(
    cwdPath: string,
    ...records: PackageRecord[]
  ): void {
    this.records[cwdPath] = this.records[cwdPath].filter(
      (record) => !records.includes(record)
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
      options
    )

    for (const record of records) {
      delete record.id
    }

    await writeJson(jsonPath, records, {
      spaces: 2,
    })
  }

  updateIds(records: PackageRecord[]): void {
    records.forEach(
      (record) =>
        (record.id = record.id || tinyId.generate())
    )
  }
}

export default new Packages()
