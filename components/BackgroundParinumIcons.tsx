import React from 'react'

// Import the dark Parinum SVG as a static asset URL
// We intentionally use a plain <img> for minimal overhead.
// The type is declared as `any` in types/global.d.ts, so this resolves to a URL string.
import ParinumDark from '../icons/parinum dark.svg'
import ParinumLight from '../icons/parinum.svg'

type IconSpec = {
	id: number
	size: number // px
	top: number // px
	left: number // px
	rotate: number // deg
	blur: number // px
	opacity: number
	src: string
	jitterX: number // px
	jitterY: number // px
	rotAmp: number // deg
	duration: number // s
	delay: number // s
}

// Map a value from one range to another
const map = (v: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
	const clamped = Math.max(inMin, Math.min(inMax, v))
	const ratio = (clamped - inMin) / (inMax - inMin)
	return outMin + ratio * (outMax - outMin)
}

// Generate a deterministic-ish seed per session so re-renders don't reshuffle
const sessionSeed = (() => Math.floor(Math.random() * 1e9))()

// Simple PRNG so we can reproduce values across the render of a single mount
const rand = (() => {
	let s = sessionSeed
	return () => {
		// Xorshift32
		s ^= s << 13
		s ^= s >>> 17
		s ^= s << 5
		// Convert to [0,1)
		return ((s >>> 0) % 1_000_000) / 1_000_000
	}
})()

// Support both string URL and Next static image object shapes
const resolveStaticUrl = (val: any): string => {
	if (typeof val === 'string') return val
	if (val && typeof val === 'object' && typeof val.src === 'string') return val.src
	return ''
}

const URL_DARK = resolveStaticUrl(ParinumDark)
const URL_LIGHT = resolveStaticUrl(ParinumLight)

// Build a shuffled list of srcs with a strict 50/50 split (if odd, we drop one)
const buildSrcList = (count: number): string[] => {
	// Build a list using only the dark icon (visible on light backgrounds)
	// as requested by the user to replace white tokens.
	const list = Array(count).fill(URL_DARK)
	
	// Fisher–Yates shuffle (redundant if all same, but keeping structure if we add back mixed icons)
	for (let i = list.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1))
		;[list[i], list[j]] = [list[j], list[i]]
	}
	return list
}

const generateIcons = (count: number, viewportWidth: number, viewportHeight: number): IconSpec[] => {
	const minSize = 20
	const maxSize = 100
	const maxBlur = 10// px on the smallest icons
	const minSpacing = 12 // px padding between icon edges

	const icons: IconSpec[] = []
	const srcList = buildSrcList(count)
	let attempts = 0
	const maxAttempts = count * 120

	const fitsWithoutOverlap = (left: number, top: number, size: number) => {
		for (const placed of icons) {
			const dx = left - placed.left
			const dy = top - placed.top
			const minDist = (size + placed.size) / 2 + minSpacing
			if (dx * dx + dy * dy < minDist * minDist) {
				return false
			}
		}
		return true
	}

	while (icons.length < count && attempts < maxAttempts) {
		attempts++
		const size = Math.round(minSize + rand() * (maxSize - minSize))

		// Keep icons away from edges; margin scales with size
		const margin = size * 0.75 + 12
		const usableWidth = Math.max(viewportWidth - margin * 2, size)
		const usableHeight = Math.max(viewportHeight - margin * 2, size)

		const left = margin + rand() * usableWidth
		const top = margin + rand() * usableHeight

		if (!fitsWithoutOverlap(left, top, size)) continue

		// Rotation between -30 and 30 degrees
		const rotate = Math.round(-30 + rand() * 60)

		// Bigger = clearer (less blur). Map size inversely to blur.
		const blur = Number(map(size, minSize, maxSize, maxBlur, 1).toFixed(2))

		// Subtle opacity; slightly higher when larger
		const opacity = Number(map(size, minSize, maxSize, 0.12, 0.2).toFixed(2))

		// Small, gentle jitter and rotation amplitude scaled by size
		// Smaller icons wander more; larger ones stay steadier
		const jitterMax = map(size, minSize, maxSize, 12, 4)
		const jitterMin = 2
		const jitterX = Number((jitterMin + rand() * (jitterMax - jitterMin)).toFixed(2))
		const jitterY = Number((jitterMin + rand() * (jitterMax - jitterMin)).toFixed(2))
		const rotAmp = Number(map(size, minSize, maxSize, 8, 2).toFixed(2))
		const duration = Number((6 + rand() * 6).toFixed(2)) // 6–12s
		const delay = Number((-rand() * duration).toFixed(2)) // negative to desync starts

		const src = srcList[icons.length % srcList.length] || URL_DARK

		icons.push({ id: icons.length, size, top, left, rotate, blur, opacity, src, jitterX, jitterY, rotAmp, duration, delay })
	}
	return icons
}

/**
 * BackgroundParinumIcons
 * Renders a lightly animated layer of Parinum icons at random
 * positions/sizes/rotations. High-performance: computed once on mount,
 * pointer-events disabled.
 */
export default function BackgroundParinumIcons() {
	const [icons, setIcons] = React.useState<IconSpec[] | null>(null)

	// Only generate on client to avoid SSR mismatches
	React.useEffect(() => {
		// Heuristic: fewer icons on small screens
		const isSmall = typeof window !== 'undefined' && window.innerWidth < 768
		const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280
		const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 720
		const requested = isSmall ? 18 : 24
		// Keep it strictly 50/50 by ensuring an even count
		const evenCount = requested % 2 === 0 ? requested : requested - 1
		setIcons(generateIcons(evenCount, viewportWidth, viewportHeight))
		// We intentionally ignore resize to keep it static (and cheaper)
	}, [])

		if (!icons) return null

	return (
		<div
			aria-hidden
			className="absolute inset-0 select-none pointer-events-none"
			style={{ zIndex: 1 }}
		>
			{icons.map((icon) => (
				<div
					key={icon.id}
					style={{
						position: 'absolute',
						top: `${icon.top}px`,
						left: `${icon.left}px`,
						width: `${icon.size}px`,
						height: `${icon.size}px`,
						transform: 'translate(-50%, -50%)',
					}}
				>
					<img
						src={icon.src}
						alt=""
						decoding="async"
						loading="eager"
						draggable={false}
						style={{
							width: '100%',
							height: '100%',
							filter: `blur(${icon.blur}px)`,
							opacity: icon.opacity,
							imageRendering: 'auto',
							transformOrigin: 'center',
							animation: `wobbleSpin ${icon.duration}s ease-in-out infinite alternate`,
							animationDelay: `${icon.delay}s`,
							// Per-icon motion variables
							'--base-rot': `${icon.rotate}deg`,
							'--jitter-x': `${icon.jitterX}px`,
							'--jitter-y': `${icon.jitterY}px`,
							'--rot-amp': `${icon.rotAmp}deg`,
						} as any}
					/>
				</div>
			))}
			<style jsx global>{`
				@keyframes wobbleSpin {
					0% {
						transform: translate(calc(var(--jitter-x) * -0.6), calc(var(--jitter-y) * -0.5))
							rotate(calc(var(--base-rot) - var(--rot-amp)));
					}
					25% {
						transform: translate(calc(var(--jitter-x) * 0.8), calc(var(--jitter-y) * -1))
							rotate(calc(var(--base-rot) + var(--rot-amp) * 0.4));
					}
					50% {
						transform: translate(calc(var(--jitter-x)), calc(var(--jitter-y) * 0.9))
							rotate(calc(var(--base-rot) + var(--rot-amp)));
					}
					75% {
						transform: translate(calc(var(--jitter-x) * -0.8), calc(var(--jitter-y)))
							rotate(calc(var(--base-rot) - var(--rot-amp) * 0.5));
					}
					100% {
						transform: translate(calc(var(--jitter-x) * -0.6), calc(var(--jitter-y) * -0.5))
							rotate(calc(var(--base-rot) - var(--rot-amp)));
					}
				}
			`}</style>
		</div>
	)
}
