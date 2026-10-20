// 统一发布 packages/* 下所有包：pnpm release [--otp=验证码]
// 发布前校验版本号一致，并执行 lint、类型检查和构建
import { execSync } from 'child_process'
import { readFileSync, readdirSync } from 'fs'
import { resolve } from 'path'

const packagesDir = resolve(import.meta.dirname, '../packages')
const pkgList = readdirSync(packagesDir).map(name =>
  JSON.parse(readFileSync(resolve(packagesDir, name, 'package.json'), 'utf-8'))
)
const versions = new Set(pkgList.map(pkg => pkg.version))
if (versions.size !== 1) {
  console.error('各包版本号不一致，请先执行 pnpm release:version <版本号>：')
  pkgList.forEach(pkg => console.error(`  ${pkg.name}: ${pkg.version}`))
  process.exit(1)
}
const [version] = versions

const run = command => execSync(command, { stdio: 'inherit' })
run('pnpm lint')
run('pnpm type:check')
run('pnpm build')
// 预发布版本（如 1.2.0-beta.1）也作为 latest 发布
const tag = version.includes('-') ? ' --tag latest' : ''
const args = process.argv.slice(2).join(' ')
run(`pnpm -r publish${tag} ${args}`.trim())
const action = args.includes('--dry-run') ? '试运行完成' : '已发布'
console.log(`\n${action}：${pkgList.map(pkg => pkg.name).join('、')} @ ${version}`)
