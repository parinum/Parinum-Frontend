import Layout from '@/components/Layout'
import { motion } from 'framer-motion'

export default function PrivacyPolicy() {
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="min-h-screen pt-20 pb-12"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-2">
              Parinum Privacy Policy
            </h1>
            <p className="text-secondary-600 dark:text-dark-300 mb-8">
              Last modified: 15 January 2026
            </p>

            <div className="space-y-8 text-secondary-800 dark:text-gray-200">
              <section>
                <p className="mb-4">
                  This Privacy Policy (the “Policy”) explains how Parinum (“Parinum,” “we,” “us,” or “our”) collects, uses, and shares data in connection with the Parinum protocol, the Parinum web application (including app.parinum.com), www.parinum.com, and all related products, services, and interfaces (collectively, the “Services”).
                </p>
                <p>
                  Your use of the Services is subject to this Policy and our Terms of Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">High-Level Summary</h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Parinum is a decentralized payment protocol designed to facilitate trust-minimized crypto transfers using smart contracts and bilateral collateralization.</li>
                  <li>Parinum does not custody user funds and does not control the underlying smart contracts once deployed.</li>
                  <li>Parinum’s payment protocol does not collect or store personal identifying information such as names, physical addresses, dates of birth, or government-issued identifiers.</li>
                  <li>Parinum interacts with public blockchain data, which is inherently transparent and not created or assigned by Parinum.</li>
                  <li>If you voluntarily provide information (such as an email address), it will only be used for the purpose disclosed and will not be linked to your wallet address.</li>
                  <li>Parinum does not sell personal data. Any information provided when signing up to the mailing list is used solely to deliver Parinum-related updates and informational content.</li>
                  <li>Any material changes to this Policy will be reflected in an updated version.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-4">Data We Collect</h2>
                <p className="mb-4">Privacy is a core principle of Parinum. We aim to minimize data collection wherever necessary.</p>
                
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">1. Public Blockchain Data</h3>
                <p className="mb-2">When you interact with the Services using a non-custodial blockchain wallet, we may collect and process publicly available blockchain information, including:</p>
                <ul className="list-disc pl-5 space-y-2 mb-2">
                  <li>Wallet addresses</li>
                  <li>Transaction hashes</li>
                  <li>Smart-contract interactions</li>
                </ul>
                <p className="mb-2">This data is publicly available by design and is not personally identifying on its own.</p>
                <p className="mb-4">We may screen wallet addresses using third-party blockchain analytics providers to help detect and prevent fraudulent or illicit activity, comply with legal obligations, and protect the integrity of the protocol.</p>

                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">2. Technical and Usage Data</h3>
                <p className="mb-2">We and our service providers may collect limited, non-identifying technical information, including:</p>
                <ul className="list-disc pl-5 space-y-2 mb-2">
                  <li>Browser type and version</li>
                  <li>Device type and operating system</li>
                  <li>General usage metrics and interaction data</li>
                </ul>
                <p className="mb-2">This information is used in aggregate to:</p>
                <ul className="list-disc pl-5 space-y-2 mb-2">
                  <li>Maintain functionality of the Services</li>
                  <li>Improve usability and performance</li>
                  <li>Diagnose bugs and technical issues</li>
                </ul>
                <p className="mb-4">We do not attempt to identify individual users through this data.</p>

                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">3. Information You Voluntarily Provide</h3>
                <p className="mb-2">You may choose to provide information directly to us, including:</p>
                <ul className="list-disc pl-5 space-y-2 mb-2">
                  <li>Email address (e.g., for updates or announcements)</li>
                  <li>Communications sent via email, social platforms, or support channels</li>
                  <li>Survey or feedback responses</li>
                </ul>
                <p className="mb-4">We will not attempt to link this information to your wallet address, transaction history, or blockchain identity.</p>

                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">4. Employment and Business Inquiries</h3>
                <p className="mb-2">If you apply for a role or engage with Parinum in a professional capacity, we may collect information you submit, such as:</p>
                <ul className="list-disc pl-5 space-y-2 mb-4">
                  <li>Name</li>
                  <li>Contact details</li>
                  <li>Resume or professional background</li>
                </ul>
                <p className="mb-4">This information is used solely for recruitment or business purposes.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-4">How We Use Data</h2>
                <p className="mb-2">We use collected data only as necessary and in accordance with applicable laws, including for:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Providing the Services – operating, maintaining, and improving functionality</li>
                  <li>Security and integrity – preventing fraud, abuse, and malicious activity</li>
                  <li>Customer support – responding to inquiries and requests</li>
                  <li>Legal compliance – complying with applicable laws, regulations, and lawful requests</li>
                  <li>Aggregated analytics – understanding overall usage trends without identifying individuals</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-4">How We Share Data</h2>
                <p className="mb-4">We may share limited data only in the following circumstances:</p>

                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">1. Business Transitions</h3>
                <p className="mb-4">In the event of a merger, acquisition, restructuring, or similar transaction, data may be transferred as part of that process, subject to applicable law.</p>

                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">2. Legal and Regulatory Obligations</h3>
                <p className="mb-2">We may disclose data where required to:</p>
                <ul className="list-disc pl-5 space-y-2 mb-4">
                  <li>Comply with applicable laws or regulations</li>
                  <li>Respond to lawful requests from courts, regulators, or law enforcement</li>
                  <li>Enforce our Terms of Service or protect users and the ecosystem</li>
                </ul>

                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">3. With Your Consent</h3>
                <p className="mb-2">We may share information when you explicitly consent to such sharing.</p>
                <p className="mb-4">We do not sell personal data and do not share data for advertising or marketing purposes.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-4">Third-Party Links</h2>
                <p>The Services may contain links to third-party websites or services not operated by Parinum. We are not responsible for the privacy practices of those third parties. Please review their policies independently.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-4">Security</h2>
                <p className="mb-2">We implement reasonable administrative, technical, and organizational safeguards to protect data. However, no system is completely secure.</p>
                <p>You are responsible for safeguarding your wallet, private keys, and blockchain credentials. Parinum cannot recover lost keys or reverse blockchain transactions.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-4">Age Requirements</h2>
                <p>The Services are not directed at children. We do not knowingly collect personal information from individuals under 18. If you believe such information has been provided, please contact us at <a href="mailto:info@parinum.com" className="text-primary-500 hover:text-primary-600 transition-colors">info@parinum.com</a>.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-4">Changes to This Policy</h2>
                <p>We may update this Policy from time to time. Any material changes will be reflected by an updated “Last modified” date.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-4">Contact Us</h2>
                <p>
                  <a href="mailto:info@parinum.com" className="text-primary-500 hover:text-primary-600 transition-colors">Info@parinum.com</a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </motion.div>
    </Layout>
  )
}
