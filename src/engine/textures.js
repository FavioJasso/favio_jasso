import * as THREE from 'three'

function canvas(size) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  return c
}

/** Seeded so the plastic grain is identical on every load. */
function rng(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** Fine injection-moulded grain, as a tangent-space normal map. */
export function grainNormal(size = 256, strength = 1.2, seed = 7) {
  const r = rng(seed)
  const h = new Float32Array(size * size)
  // Two octaves of value noise so the grain is not uniform TV static.
  for (let i = 0; i < h.length; i++) h[i] = r()
  const blur = new Float32Array(size * size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let s = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          s += h[((y + dy + size) % size) * size + ((x + dx + size) % size)]
        }
      }
      blur[y * size + x] = s / 9
    }
  }
  const c = canvas(size)
  const ctx = c.getContext('2d')
  const img = ctx.createImageData(size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const at = (xx, yy) => blur[((yy + size) % size) * size + ((xx + size) % size)]
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength
      const i = (y * size + x) * 4
      img.data[i] = (dx * 0.5 + 0.5) * 255
      img.data[i + 1] = (dy * 0.5 + 0.5) * 255
      img.data[i + 2] = 255
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.NoColorSpace
  t.anisotropy = 4
  return t
}

/** Soft radial blob, used for painted contact shadows and glows. */
export function radialTexture(stops, size = 256) {
  const c = canvas(size)
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  stops.forEach(([at, col]) => g.addColorStop(at, col))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null) // A missing image only loses a label's art.
    img.src = src
  })
}

/**
 * Printed disc label: gradient, optional project art, curved-feel typography.
 * Returns immediately with a usable texture; art is drawn in when it arrives.
 */
export function discLabel({ title, sub, colors, image }) {
  const size = 1024
  const c = canvas(size)
  const ctx = c.getContext('2d')
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8

  let art = null
  const paint = (img) => {
    art = img
    ctx.clearRect(0, 0, size, size)
    const g = ctx.createLinearGradient(0, 0, size, size)
    colors.forEach((col, i) => g.addColorStop(i / (colors.length - 1), col))
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)

    if (img) {
      // Kept inside the printable band so the disc's hub never bites into the art.
      ctx.save()
      ctx.beginPath()
      ctx.arc(size / 2, size * 0.155, size * 0.14, 0, Math.PI * 2)
      ctx.clip()
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, size, size)
      const s = size * 0.28
      ctx.drawImage(img, size / 2 - s / 2, size * 0.155 - s / 2, s, s)
      ctx.restore()
    }

    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const fit = (text, weight, max, y) => {
      let px = max
      do {
        ctx.font = `${weight} ${px}px "M PLUS Rounded 1c", system-ui, sans-serif`
        px -= 2
      } while (ctx.measureText(text).width > size * 0.72 && px > 18)
      ctx.fillText(text, size / 2, y)
    }
    fit(title, 800, 74, size * 0.725)
    ctx.globalAlpha = 0.85
    fit(sub, 500, 38, size * 0.8)
    ctx.globalAlpha = 1
    tex.needsUpdate = true
  }

  paint(null)
  if (image) {
    loadImage(image).then((img) => {
      if (img) paint(img)
    })
  }
  // The first paint may predate the webfont; repaint once it has arrived.
  document.fonts?.load('800 74px "M PLUS Rounded 1c"').then(() => paint(art)).catch(() => {})
  return tex
}

/** Face texture for a skill cube: soft-white tile with the skill's icon. */
export function iconTile(src, accent) {
  const size = 256
  const c = canvas(size)
  const ctx = c.getContext('2d')
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  const base = () => {
    ctx.fillStyle = '#f5f2fb'
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = accent
    ctx.fillRect(0, size - 12, size, 12)
  }
  base()
  loadImage(src).then((img) => {
    if (!img) return
    base()
    // Fit by the icon's own aspect ratio; several are not square.
    const box = size * 0.62
    const k = box / Math.max(img.naturalWidth || 1, img.naturalHeight || 1)
    const w = (img.naturalWidth || box) * k
    const h = (img.naturalHeight || box) * k
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2 - 4, w, h)
    tex.needsUpdate = true
  })
  return tex
}
