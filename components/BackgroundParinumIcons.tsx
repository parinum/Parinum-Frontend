import React from 'react'

// Import the dark Parinum SVG as a static asset URL
// We intentionally use a plain <img> for minimal overhead.
// The type is declared as `any` in types/global.d.ts, so this resolves to a URL string.
import ParinumDark from '../icons/parinum dark.svg'
import ParinumLight from '../icons/parinum.svg'

type IconSpec = {
	id: number
	size: number // px
	topVh: number
	leftVw: number
	rotate: number // deg
	blur: number // px
	opacity: number
	src: string
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
	const evenCount = count % 2 === 0 ? count : count - 1
	const half = evenCount / 2
	const list = [
		...Array(half).fill(URL_DARK),
		...Array(half).fill(URL_LIGHT),
	]
	// Fisher–Yates shuffle using our PRNG
	for (let i = list.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1))
		;[list[i], list[j]] = [list[j], list[i]]
	}
	return list
}

const generateIcons = (count: number): IconSpec[] => {
	const minSize = 20
	const maxSize = 100
	const maxBlur = 10// px on the smallest icons

	const icons: IconSpec[] = []
	const srcList = buildSrcList(count)
	for (let i = 0; i < count; i++) {
		const size = Math.round(minSize + rand() * (maxSize - minSize))

		// Position in viewport units, clamped away from edges to keep visible
		const topVh = Math.round(5 + rand() * 90)
		const leftVw = Math.round(5 + rand() * 90)

		// Rotation between -30 and 30 degrees
		const rotate = Math.round(-30 + rand() * 60)

		// Bigger = clearer (less blur). Map size inversely to blur.
		const blur = Number(map(size, minSize, maxSize, maxBlur, 1).toFixed(2))

		// Subtle opacity; slightly higher when larger
			const opacity = Number(map(size, minSize, maxSize, 0.12, 0.2).toFixed(2))

			const src = srcList[i % srcList.length] || URL_DARK

			icons.push({ id: i, size, topVh, leftVw, rotate, blur, opacity, src })
	}
	return icons
}

/**
 * BackgroundParinumIcons
 * Renders a static, non-animated layer of Parinum icons at random
 * positions/sizes/rotations. High-performance: computed once on mount,
 * no timers, no animations, pointer-events disabled.
 */
export default function BackgroundParinumIcons() {
	const [icons, setIcons] = React.useState<IconSpec[] | null>(null)

	// Only generate on client to avoid SSR mismatches
	React.useEffect(() => {
		// Heuristic: fewer icons on small screens
		const isSmall = typeof window !== 'undefined' && window.innerWidth < 768
		const requested = isSmall ? 18 : 24
		// Keep it strictly 50/50 by ensuring an even count
		const evenCount = requested % 2 === 0 ? requested : requested - 1
		setIcons(generateIcons(evenCount))
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
								<img
					key={icon.id}
									src={icon.src}
					alt=""
							decoding="async"
							loading="eager"
					draggable={false}
					style={{
						position: 'absolute',
						top: `${icon.topVh}vh`,
						left: `${icon.leftVw}vw`,
						width: `${icon.size}px`,
						height: 'auto',
						transform: `translate(-50%, -50%) rotate(${icon.rotate}deg)`,
						filter: `blur(${icon.blur}px)`,
						opacity: icon.opacity,
						// Avoid expensive composition hints; keep it simple
						imageRendering: 'auto',
					}}
				/>
			))}
		</div>
	)
}

