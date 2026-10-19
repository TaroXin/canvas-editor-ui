export const PREFIX = 'ceu'

type Attrs = Record<string, string | number | boolean | undefined>

// 创建元素：h('div', { class: 'a', title: 'b' }, child1, 'text')
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: (Node | string | null | undefined | false)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  Object.keys(attrs).forEach(key => {
    const value = attrs[key]
    if (value === undefined || value === false) return
    if (key === 'class') {
      el.className = String(value)
    } else {
      el.setAttribute(key, value === true ? '' : String(value))
    }
  })
  children.forEach(child => {
    if (child === null || child === undefined || child === false) return
    el.append(child)
  })
  return el
}

export function cls(name: string): string {
  return `${PREFIX}-${name}`
}

export function debounce<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number
): ((...args: T) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null
  const debounced = (...args: T) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, delay)
  }
  debounced.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
  }
  return debounced
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = h('a', { href: url, download: fileName })
  a.click()
  URL.revokeObjectURL(url)
}

export function formatDate(date: Date, withTime: boolean): string {
  const pad = (num: number) => String(num).padStart(2, '0')
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`
  if (!withTime) return day
  return `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`
}
