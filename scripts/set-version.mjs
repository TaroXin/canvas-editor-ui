// 统一修改 packages/* 下所有包的版本号：pnpm release:version 1.2.0
import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const version = process.argv[2]
if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version || '')) {
  console.error('用法：pnpm release:version <版本号>，例如 pnpm release:version 1.2.0')
  process.exit(1)
}

const packagesDir = resolve(import.meta.dirname, '../packages')
for (const name of readdirSync(packagesDir)) {
  const file = resolve(packagesDir, name, 'package.json')
  const source = readFileSync(file, 'utf-8')
  const pkg = JSON.parse(source)
  // 只替换 version 字段，保留原有格式
  writeFileSync(
    file,
    source.replace(`"version": "${pkg.version}"`, `"version": "${version}"`)
  )
  console.log(`${pkg.name}: ${pkg.version} -> ${version}`)
}
