import Layout from '@/components/Layout'
import Link from 'next/link'

export default function ReleasePurchaseNew() {
	return (
		<Layout>
			<div className="min-h-screen pt-24 px-6">
				<div className="max-w-2xl mx-auto text-center bg-dark-800/50 border border-primary-500/20 rounded-2xl p-8">
					<h1 className="text-3xl font-bold text-white mb-4">Release Purchase (New)</h1>
					<p className="text-dark-300 mb-6">
						This page is under construction. Please use the existing release flow instead.
					</p>
					<Link href="/release-purchase" className="text-primary-400 underline">
						Go to Release Purchase
					</Link>
				</div>
			</div>
		</Layout>
	)
}

