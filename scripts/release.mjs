// 统一发布：版本号以根目录 package.json 为准，自动递增并同步到 packages/* 后发布
//   pnpm release patch|minor|major   按类型递增
//   pnpm release 1.2.0               指定版本
//   pnpm release minor --dry-run     试运行：构建并打包，不发布、不提交
// 发布成功后自动提交 "chore: release x.y.z"、打 tag 并推送；失败时还原版本号
// 中途失败（如部分包已发布）时用同一版本号重跑即可，已发布的包会自动跳过
import { execSync } from 'child_process'
import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { createInterface } from 'readline/promises'

const root = resolve(import.meta.dirname, '..')
const rootPkgPath = resolve(root, 'package.json')
const packagesDir = resolve(root, 'packages')
const pkgPathList = readdirSync(packagesDir).map(name =>
  resolve(packagesDir, name, 'package.json')
)

const run = command => execSync(command, { cwd: root, stdio: 'inherit' })
const read = command => execSync(command, { cwd: root }).toString().trim()
const fail = message => {
  console.error(message)
  process.exit(1)
}

const [bump, ...restArgs] = process.argv.slice(2)
const isDryRun = restArgs.includes('--dry-run')

// 计算新版本号
const currentVersion = JSON.parse(readFileSync(rootPkgPath, 'utf-8')).version
const match = /^(\d+)\.(\d+)\.(\d+)/.exec(currentVersion || '')
if (!match) fail(`根目录 package.json 的 version 无效：${currentVersion}`)
const [major, minor, patch] = match.slice(1).map(Number)
const nextVersion = {
  major: `${major + 1}.0.0`,
  minor: `${major}.${minor + 1}.0`,
  patch: `${major}.${minor}.${patch + 1}`
}[bump] || bump
if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(nextVersion || '')) {
  fail('用法：pnpm release <patch|minor|major|版本号> [--dry-run]')
}

// 工作区必须干净且在 main 分支
if (!isDryRun) {
  if (read('git status --porcelain')) fail('工作区有未提交的改动，请先提交')
  const branch = read('git rev-parse --abbrev-ref HEAD')
  if (branch !== 'main') fail(`请在 main 分支发布（当前 ${branch}）`)
}

// 写入版本号（只替换 version 字段，保留原有格式）
const setVersion = version => {
  for (const file of [rootPkgPath, ...pkgPathList]) {
    const source = readFileSync(file, 'utf-8')
    const { version: oldVersion } = JSON.parse(source)
    writeFileSync(
      file,
      source.replace(`"version": "${oldVersion}"`, `"version": "${version}"`)
    )
  }
}

console.log(`\n版本 ${currentVersion} -> ${nextVersion}\n`)
setVersion(nextVersion)
try {
  run('pnpm lint')
  run('pnpm type:check')
  run('pnpm build')
  // 预发布版本（如 1.2.0-beta.1）也作为 latest 发布
  const tag = nextVersion.includes('-') ? ' --tag latest' : ''
  if (isDryRun) {
    run(`pnpm -r publish${tag} --dry-run --no-git-checks`)
  } else {
    // 构建完成后再输入验证码，避免等待期间过期
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const otp = (await rl.question('\nnpm 验证码（未开启两步验证直接回车）：')).trim()
    rl.close()
    run(`pnpm -r publish${tag} --no-git-checks${otp ? ` --otp=${otp}` : ''}`)
  }
} catch {
  setVersion(currentVersion)
  fail(`\n发布失败，版本号已还原为 ${currentVersion}`)
}

if (isDryRun) {
  setVersion(currentVersion)
  console.log(`\n试运行完成：${nextVersion}（版本号已还原，未发布）`)
} else {
  // 重跑已发布的版本时没有改动，不再提交；tag 已存在时不重复创建
  if (read('git status --porcelain')) {
    run(`git commit -am "chore: release ${nextVersion}"`)
  }
  if (!read(`git tag --list v${nextVersion}`)) {
    run(`git tag v${nextVersion}`)
  }
  run('git push --follow-tags')
  console.log(`\n已发布并推送 ${nextVersion}`)
}
