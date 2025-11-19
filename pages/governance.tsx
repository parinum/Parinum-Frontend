import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import { 
  getVotingPower,
  delegateVotes,
  createProposal,
  castVote,
  getProposalInfo,
  hasVoted,
  getGovernanceSettings,
  initProvider 
} from '@/lib/functions'

// Icons
const VoteIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
)

const DocumentIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

// Removed ScaleIcon per request

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

export default function Governance() {
  const router = useRouter()
  
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'proposals' | 'create' | 'delegate'>('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  // Voting power states
  const [votingPower, setVotingPower] = useState({
    balance: '0',
    delegatedBalance: '0'
  })
  
  // Governance settings
  const [governanceSettings, setGovernanceSettings] = useState({
    proposalThreshold: '0',
    quorum: '0',
    currentBlock: '0'
  })
  
  // Create proposal form
  const [proposalForm, setProposalForm] = useState({
    title: '',
    description: '',
    targets: '',
    values: '',
    calldatas: ''
  })
  
  // Delegation form
  const [delegateAddress, setDelegateAddress] = useState('')
  
  // Mock proposals data (in production, fetch from contract events)
  const [proposals] = useState([
    {
      id: '1',
      title: 'Increase Staking Rewards',
      description: 'Proposal to increase staking rewards by 10% to incentivize more participation in the ecosystem.',
      proposer: '0x742d...4E96',
      state: 1, // Active
      forVotes: '15,420',
      againstVotes: '2,180',
      abstainVotes: '320',
      endBlock: '18,500,000',
      hasVoted: false
    },
    {
      id: '2',
      title: 'Protocol Fee Adjustment',
      description: 'Adjust protocol fees to optimize for user experience while maintaining sustainability.',
      proposer: '0x8B3a...F12C',
      state: 4, // Succeeded
      forVotes: '25,680',
      againstVotes: '1,420',
      abstainVotes: '180',
      endBlock: '18,480,000',
      hasVoted: true
    },
    {
      id: '3',
      title: 'Treasury Diversification',
      description: 'Proposal to diversify treasury holdings to reduce risk and increase long-term sustainability.',
      proposer: '0x1F7b...A8D2',
      state: 0, // Pending
      forVotes: '0',
      againstVotes: '0',
      abstainVotes: '0',
      endBlock: '18,520,000',
      hasVoted: false
    }
  ])

  // Load governance data
  useEffect(() => {
    loadGovernanceData()
  }, [])

  const loadGovernanceData = async () => {
    try {
      const { account } = await initProvider()
      
      // Load voting power
      const power = await getVotingPower(account)
      setVotingPower(power)
      
      // Load governance settings
      const settings = await getGovernanceSettings()
      setGovernanceSettings(settings)
      
    } catch (error) {
      console.error('Failed to load governance data:', error)
    }
  }

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!proposalForm.title || !proposalForm.description) return

    setIsLoading(true)
    setMessage('')

    try {
      // Parse targets, values, and calldatas
      const targets = proposalForm.targets ? proposalForm.targets.split(',').map(t => t.trim()) : []
      const values = proposalForm.values ? proposalForm.values.split(',').map(v => v.trim()) : []
      const calldatas = proposalForm.calldatas ? proposalForm.calldatas.split(',').map(c => c.trim()) : []
      
      const fullDescription = `# ${proposalForm.title}\n\n${proposalForm.description}`
      
      const result = await createProposal(targets, values, calldatas, fullDescription)
      
      if (result.success) {
        setMessage('Proposal created successfully!')
        setProposalForm({ title: '', description: '', targets: '', values: '', calldatas: '' })
        setActiveTab('proposals')
        await loadGovernanceData()
      } else {
        setMessage(`Error: ${result.error}`)
      }
    } catch (error) {
      setMessage('Failed to create proposal. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelegate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!delegateAddress) return

    setIsLoading(true)
    setMessage('')

    try {
      const result = await delegateVotes(delegateAddress)
      
      if (result.success) {
        setMessage('Votes delegated successfully!')
        setDelegateAddress('')
        await loadGovernanceData()
      } else {
        setMessage(`Error: ${result.error}`)
      }
    } catch (error) {
      setMessage('Failed to delegate votes. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVote = async (proposalId: string, support: number) => {
    setIsLoading(true)
    setMessage('')

    try {
      const result = await castVote(proposalId, support)
      
      if (result.success) {
        setMessage('Vote cast successfully!')
        await loadGovernanceData()
      } else {
        setMessage(`Error: ${result.error}`)
      }
    } catch (error) {
      setMessage('Failed to cast vote. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getProposalStateText = (state: number) => {
    const states = ['Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed']
    return states[state] || 'Unknown'
  }

  const getProposalStateColor = (state: number) => {
    switch (state) {
      case 0: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 1: return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 2: return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
      case 3: return 'text-red-400 bg-red-400/10 border-red-400/20'
      case 4: return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 5: return 'text-purple-400 bg-purple-400/10 border-purple-400/20'
      case 6: return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
      case 7: return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-slate-900">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-900" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              {/* Removed hero icon per request */}
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                Parinum Governance
              </h1>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-2">
                Participate in protocol governance by creating proposals, voting on decisions, and delegating your voting power to shape the future of Parinum.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="sticky top-16 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8 overflow-x-auto py-1">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'proposals', label: 'Proposals' },
                { id: 'create', label: 'Create Proposal' },
                { id: 'delegate', label: 'Delegate' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-slate-700/50 text-slate-200 border border-slate-600/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span className="ml-0">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Status Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-xl border ${
                message.includes('Error') || message.includes('Failed')
                  ? 'bg-red-900/20 border-red-500/20 text-red-400'
                  : 'bg-green-900/20 border-green-500/20 text-green-400'
              }`}
            >
              {message}
            </motion.div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-200">Your Voting Power</h3>
                    <VoteIcon />
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-white">{votingPower.delegatedBalance} PSC</div>
                    <div className="text-sm text-slate-400">Balance: {votingPower.balance} PSC</div>
                  </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-200">Proposal Threshold</h3>
                    <DocumentIcon />
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-white">{parseFloat(governanceSettings.proposalThreshold).toLocaleString()} PSC</div>
                    <div className="text-sm text-slate-400">Required to create proposals</div>
                  </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-200">Quorum</h3>
                    <UsersIcon />
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-white">{parseFloat(governanceSettings.quorum).toLocaleString()} PSC</div>
                    <div className="text-sm text-slate-400">Required for proposal passage</div>
                  </div>
                </div>
              </div>

              {/* Governance Info */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
                <h3 className="text-2xl font-bold text-white mb-6">How Governance Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-slate-200">1</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-200">Create Proposals</h4>
                        <p className="text-slate-400 text-sm">Token holders with sufficient voting power can create governance proposals.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-slate-200">2</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-200">Vote on Proposals</h4>
                        <p className="text-slate-400 text-sm">Cast your vote for, against, or abstain on active proposals.</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-slate-200">3</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-200">Delegate Voting Power</h4>
                        <p className="text-slate-400 text-sm">Delegate your voting power to trusted community members.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-slate-200">4</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-200">Execute Decisions</h4>
                        <p className="text-slate-400 text-sm">Successful proposals are executed automatically through the timelock.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Proposals Tab */}
          {activeTab === 'proposals' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white">Active Proposals</h2>
                <div className="text-slate-400 text-sm">
                  Current Block: {parseInt(governanceSettings.currentBlock).toLocaleString()}
                </div>
              </div>

              {proposals.map((proposal) => (
                <div key={proposal.id} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">{proposal.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getProposalStateColor(proposal.state)}`}>
                          {getProposalStateText(proposal.state)}
                        </span>
                      </div>
                      <p className="text-slate-400 mb-2">{proposal.description}</p>
                      <div className="text-sm text-slate-500">
                        Proposed by: {proposal.proposer} • Ends at block: {parseInt(proposal.endBlock).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Voting Results */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-400">{proposal.forVotes}</div>
                      <div className="text-sm text-slate-400">For</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-red-400">{proposal.againstVotes}</div>
                      <div className="text-sm text-slate-400">Against</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-400">{proposal.abstainVotes}</div>
                      <div className="text-sm text-slate-400">Abstain</div>
                    </div>
                  </div>

                  {/* Voting Progress Bar */}
                  <div className="mb-6">
                    {(() => {
                      const total = parseFloat(proposal.forVotes.replace(',', '')) + 
                                   parseFloat(proposal.againstVotes.replace(',', '')) + 
                                   parseFloat(proposal.abstainVotes.replace(',', ''))
                      const forPercent = total > 0 ? (parseFloat(proposal.forVotes.replace(',', '')) / total) * 100 : 0
                      const againstPercent = total > 0 ? (parseFloat(proposal.againstVotes.replace(',', '')) / total) * 100 : 0
                      
                      return (
                        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                          <div className="h-full flex">
                            <div 
                              className="bg-green-500 transition-all duration-500"
                              style={{ width: `${forPercent}%` }}
                            />
                            <div 
                              className="bg-red-500 transition-all duration-500"
                              style={{ width: `${againstPercent}%` }}
                            />
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Voting Buttons */}
                  {proposal.state === 1 && !proposal.hasVoted && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleVote(proposal.id, 1)}
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg text-green-400 font-medium transition-all duration-300 disabled:opacity-50"
                      >
                        <CheckIcon />
                        <span>Vote For</span>
                      </button>
                      <button
                        onClick={() => handleVote(proposal.id, 0)}
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-red-400 font-medium transition-all duration-300 disabled:opacity-50"
                      >
                        <XIcon />
                        <span>Vote Against</span>
                      </button>
                      <button
                        onClick={() => handleVote(proposal.id, 2)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-slate-600/20 hover:bg-slate-600/30 border border-slate-500/30 rounded-lg text-slate-400 font-medium transition-all duration-300 disabled:opacity-50"
                      >
                        Abstain
                      </button>
                    </div>
                  )}

                  {proposal.hasVoted && (
                    <div className="text-slate-400 text-sm">You have already voted on this proposal.</div>
                  )}
                </div>
              ))}
            </motion.div>
          )}

          {/* Create Proposal Tab */}
          {activeTab === 'create' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
                <h2 className="text-3xl font-bold text-white mb-6">Create New Proposal</h2>
                
                <form onSubmit={handleCreateProposal} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Proposal Title
                    </label>
                    <input
                      type="text"
                      value={proposalForm.title}
                      onChange={(e) => setProposalForm({ ...proposalForm, title: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      placeholder="Enter proposal title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Description
                    </label>
                    <textarea
                      value={proposalForm.description}
                      onChange={(e) => setProposalForm({ ...proposalForm, description: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
                      placeholder="Describe your proposal in detail..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Target Addresses (optional)
                    </label>
                    <input
                      type="text"
                      value={proposalForm.targets}
                      onChange={(e) => setProposalForm({ ...proposalForm, targets: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      placeholder="Comma-separated contract addresses"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Values (optional)
                    </label>
                    <input
                      type="text"
                      value={proposalForm.values}
                      onChange={(e) => setProposalForm({ ...proposalForm, values: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      placeholder="Comma-separated ETH values"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Call Data (optional)
                    </label>
                    <input
                      type="text"
                      value={proposalForm.calldatas}
                      onChange={(e) => setProposalForm({ ...proposalForm, calldatas: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      placeholder="Comma-separated function call data"
                    />
                  </div>

                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <h4 className="font-semibold text-slate-200 mb-2">Requirements</h4>
                    <ul className="text-sm text-slate-400 space-y-1">
                      <li>• Minimum {parseFloat(governanceSettings.proposalThreshold).toLocaleString()} PSC voting power required</li>
                      <li>• Your current voting power: {votingPower.delegatedBalance} PSC</li>
                      <li>• For executable proposals, provide target addresses, values, and call data</li>
                    </ul>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || parseFloat(votingPower.delegatedBalance) < parseFloat(governanceSettings.proposalThreshold)}
                    className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creating Proposal...' : 'Create Proposal'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* Delegate Tab */}
          {activeTab === 'delegate' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
                <h2 className="text-3xl font-bold text-white mb-6">Delegate Voting Power</h2>
                
                <div className="mb-6 p-4 bg-slate-700/30 rounded-xl">
                  <h4 className="font-semibold text-slate-200 mb-2">Current Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Your PSC Balance:</span>
                      <span className="text-white">{votingPower.balance} PSC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Voting Power:</span>
                      <span className="text-white">{votingPower.delegatedBalance} PSC</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleDelegate} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Delegate Address
                    </label>
                    <input
                      type="text"
                      value={delegateAddress}
                      onChange={(e) => setDelegateAddress(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      placeholder="0x... or ENS name"
                      required
                    />
                  </div>

                  <div className="bg-slate-700/30 rounded-xl p-4">
                    <h4 className="font-semibold text-slate-200 mb-2">About Delegation</h4>
                    <ul className="text-sm text-slate-400 space-y-1">
                      <li>• Delegate your voting power to participate in governance</li>
                      <li>• You can delegate to yourself to activate your own voting power</li>
                      <li>• You can change your delegate at any time</li>
                      <li>• Delegation doesn't transfer token ownership</li>
                    </ul>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl text-white font-medium transition-all duration-300 disabled:opacity-50"
                    >
                      {isLoading ? 'Delegating...' : 'Delegate Votes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDelegateAddress(votingPower.balance > '0' ? 'self' : '')}
                      className="px-6 py-3 bg-slate-600/50 hover:bg-slate-600 border border-slate-500/50 rounded-xl text-slate-300 font-medium transition-all duration-300"
                    >
                      Self Delegate
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  )
}
