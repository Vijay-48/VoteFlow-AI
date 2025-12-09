import { useState, useEffect, useRef, useCallback } from 'react'
import './Dashboard.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
const WS_BASE = import.meta.env.VITE_WS_BASE || 'ws://localhost:8000'

function Dashboard() {
    // State
    const [connected, setConnected] = useState(false)
    const [campaignId, setCampaignId] = useState(null)
    const [isRunning, setIsRunning] = useState(false)
    const [logs, setLogs] = useState([])
    const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0, progress: 0 })
    const [extractedVoters, setExtractedVoters] = useState([])
    const [messageTemplate, setMessageTemplate] = useState('')
    const [isExtracting, setIsExtracting] = useState(false)
    const [backendStatus, setBackendStatus] = useState('checking')

    // Refs
    const wsRef = useRef(null)
    const terminalRef = useRef(null)
    const fileInputRef = useRef(null)
    const quickUploadRef = useRef(null)

    // Check backend health on mount
    useEffect(() => {
        checkBackendHealth()
    }, [])

    // Auto-scroll terminal
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight
        }
    }, [logs])

    const checkBackendHealth = async () => {
        try {
            const res = await fetch(`${API_BASE}/health`)
            if (res.ok) {
                setBackendStatus('online')
                addLog('Backend server connected', 'success')
            }
        } catch (e) {
            setBackendStatus('offline')
            addLog('Backend server offline. Run: cd backend && python main.py', 'error')
        }
    }

    const addLog = useCallback((message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false })
        setLogs(prev => [...prev.slice(-50), { id: Date.now(), timestamp, message, type }])
    }, [])

    // Connect to WebSocket for campaign updates
    const connectWebSocket = (campId) => {
        if (wsRef.current) wsRef.current.close()

        const ws = new WebSocket(`${WS_BASE}/ws/campaign/${campId}`)

        ws.onopen = () => {
            setConnected(true)
            addLog('WebSocket connected - receiving live updates', 'success')
        }

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)

            if (data.type === 'log') {
                addLog(data.message, data.log_type)
                if (data.stats) setStats(data.stats)
            } else if (data.type === 'stats') {
                setStats(data.stats)
            } else if (data.type === 'complete') {
                setIsRunning(false)
                addLog('Campaign completed!', 'success')
            } else if (data.type === 'error') {
                addLog(data.message, 'error')
            } else if (data.type === 'qr_waiting') {
                addLog('⚠️ Check browser - Scan WhatsApp QR code', 'warning')
            } else if (data.type === 'whatsapp_ready') {
                addLog('✅ WhatsApp connected!', 'success')
            }
        }

        ws.onclose = () => {
            setConnected(false)
            addLog('WebSocket disconnected', 'warning')
        }

        wsRef.current = ws
    }

    // Handle PDF upload and extraction (AI-powered)
    const handleFileUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (!file.name.endsWith('.pdf')) {
            addLog('Please upload a PDF file', 'error')
            return
        }

        setIsExtracting(true)
        addLog(`📂 Uploading ${file.name}...`, 'info')

        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch(`${API_BASE}/api/extract-pdf`, {
                method: 'POST',
                body: formData
            })

            const data = await res.json()

            if (data.success) {
                setExtractedVoters(data.data.voters)
                addLog(`✅ Extracted ${data.data.total_count} voters (${data.data.with_mobile} with mobile)`, 'success')

                // Show extraction log
                data.data.log.forEach(l => addLog(l, 'info'))
            } else {
                addLog(`❌ Extraction failed: ${data.detail}`, 'error')
            }
        } catch (e) {
            addLog(`❌ Upload error: ${e.message}`, 'error')
        } finally {
            setIsExtracting(false)
        }
    }

    // Handle quick upload for PDF/Excel/CSV with pre-filled data
    const handleQuickUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const fileName = file.name.toLowerCase()
        if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv') && !fileName.endsWith('.pdf')) {
            addLog('Please upload a PDF, Excel (.xlsx, .xls) or CSV file', 'error')
            return
        }

        addLog(`📊 Loading ${file.name}...`, 'info')

        try {
            // For PDF files, use AI extraction
            if (fileName.endsWith('.pdf')) {
                const formData = new FormData()
                formData.append('file', file)

                const res = await fetch(`${API_BASE}/api/extract-pdf`, {
                    method: 'POST',
                    body: formData
                })

                const data = await res.json()

                if (data.success) {
                    setExtractedVoters(data.data.voters)
                    addLog(`✅ Extracted ${data.data.total_count} voters (${data.data.with_mobile} with mobile)`, 'success')
                    data.data.log.forEach(l => addLog(l, 'info'))
                } else {
                    addLog(`❌ PDF extraction failed: ${data.detail}`, 'error')
                }
            }
            // For CSV files, parse directly in browser
            else if (fileName.endsWith('.csv')) {
                const text = await file.text()
                const lines = text.split('\n').filter(line => line.trim())
                const voters = []

                // Parse CSV (expecting NAME, PHONE or similar columns)
                lines.forEach((line, index) => {
                    if (index === 0) return // Skip header

                    const parts = line.split(',').map(p => p.trim().replace(/"/g, ''))
                    if (parts.length >= 2) {
                        const name = parts[0]
                        // Find phone number in remaining columns
                        for (let i = 1; i < parts.length; i++) {
                            const phone = parts[i].replace(/\D/g, '')
                            if (phone.length === 10 && /^[6-9]/.test(phone)) {
                                voters.push({ NAME: name, MOBILE: phone })
                                break
                            }
                        }
                    }
                })

                if (voters.length > 0) {
                    setExtractedVoters(voters)
                    addLog(`✅ Loaded ${voters.length} voters with phone numbers from CSV`, 'success')
                } else {
                    addLog('❌ No valid phone numbers found in CSV. Expected columns: NAME, PHONE', 'error')
                }
            } else {
                // For Excel files, send to backend
                const formData = new FormData()
                formData.append('file', file)

                const res = await fetch(`${API_BASE}/api/upload-excel`, {
                    method: 'POST',
                    body: formData
                })

                const data = await res.json()

                if (data.success) {
                    setExtractedVoters(data.voters)
                    addLog(`✅ Loaded ${data.voters.length} voters from Excel`, 'success')
                } else {
                    addLog(`❌ Excel parsing failed: ${data.detail}`, 'error')
                }
            }
        } catch (e) {
            addLog(`❌ File error: ${e.message}`, 'error')
        }
    }

    // Start campaign
    const startCampaign = async () => {
        if (extractedVoters.length === 0) {
            addLog('⚠️ No voters loaded. Upload a PDF first.', 'warning')
            return
        }

        addLog('🚀 Starting campaign...', 'system')
        setIsRunning(true)

        try {
            const res = await fetch(`${API_BASE}/api/campaign/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    voters_data: extractedVoters,
                    message_template: messageTemplate || undefined
                })
            })

            const data = await res.json()

            if (data.success) {
                setCampaignId(data.campaign_id)
                connectWebSocket(data.campaign_id)
                addLog(`Campaign ${data.campaign_id} started`, 'success')
            } else {
                addLog(`❌ Failed to start: ${data.detail}`, 'error')
                setIsRunning(false)
            }
        } catch (e) {
            addLog(`❌ Start error: ${e.message}`, 'error')
            setIsRunning(false)
        }
    }

    // Stop campaign
    const stopCampaign = async () => {
        if (!campaignId) return

        try {
            await fetch(`${API_BASE}/api/campaign/${campaignId}/stop`, { method: 'POST' })
            addLog('⏹️ Campaign stopped', 'warning')
            setIsRunning(false)
        } catch (e) {
            addLog(`Stop error: ${e.message}`, 'error')
        }
    }

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <div className="header-title">
                    <h1>Campaign Execution Console</h1>
                    <span className={`badge-status ${backendStatus}`}>
                        ● {backendStatus === 'online' ? 'SYSTEM ONLINE' : 'BACKEND OFFLINE'}
                    </span>
                </div>
                <div className="header-actions">
                    <button
                        className={`btn ${isRunning ? 'btn-danger' : 'btn-primary'}`}
                        onClick={isRunning ? stopCampaign : startCampaign}
                        disabled={backendStatus !== 'online'}
                    >
                        {isRunning ? '⏹ STOP ENGINE' : '▶ START CAMPAIGN'}
                    </button>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Left: Config Panel */}
                <div className="dashboard-col-left">
                    {/* PDF Upload Section (AI Extraction) */}
                    <div className="glass-panel config-card">
                        <h3>📂 Voter List (AI Extract)</h3>
                        <input
                            type="file"
                            accept=".pdf"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                        />
                        <button
                            className="btn btn-secondary upload-btn"
                            onClick={() => fileInputRef.current.click()}
                            disabled={isExtracting}
                        >
                            {isExtracting ? '⏳ Extracting...' : '📤 UPLOAD PDF'}
                        </button>
                        <p className="upload-hint">Uses AI to extract handwritten phone numbers</p>
                    </div>

                    {/* Quick Upload Section (All file types) */}
                    <div className="glass-panel config-card">
                        <h3>⚡ Quick Upload</h3>
                        <input
                            type="file"
                            accept=".pdf,.xlsx,.xls,.csv"
                            ref={quickUploadRef}
                            onChange={handleQuickUpload}
                            style={{ display: 'none' }}
                        />
                        <button
                            className="btn btn-primary upload-btn quick-upload-btn"
                            onClick={() => quickUploadRef.current.click()}
                        >
                            📊 UPLOAD FILE
                        </button>
                        <p className="upload-hint">PDF, Excel, or CSV with NAME &amp; PHONE</p>
                    </div>

                    {/* Loaded Voters Count */}
                    {extractedVoters.length > 0 && (
                        <div className="glass-panel voter-count-card">
                            <div className="voter-count">
                                ✅ {extractedVoters.length} voters loaded
                                <br />
                                <small>{extractedVoters.filter(v => v.MOBILE && v.MOBILE !== 'N/A').length} with mobile</small>
                            </div>
                        </div>
                    )}

                    {/* Status Card */}
                    <div className="glass-panel stat-card">
                        <h3>Campaign Status</h3>
                        <div className="status-indicator">
                            <div className={`status-ring ${isRunning ? 'spinning' : ''}`}></div>
                            <span className="status-text">{isRunning ? 'EXECUTING' : 'READY'}</span>
                        </div>
                        <div className="progress-container">
                            <div className="progress-bar" style={{ width: `${stats.progress}%` }}></div>
                            <span>{stats.progress.toFixed(1)}% Complete</span>
                        </div>
                        <div className="stats-row">
                            <div className="stat-item">
                                <span className="stat-value">{stats.sent}</span>
                                <span className="stat-label">Sent</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value fail">{stats.failed}</span>
                                <span className="stat-label">Failed</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{stats.total}</span>
                                <span className="stat-label">Total</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center: Live Terminal */}
                <div className="dashboard-col-center">
                    <div className="terminal-window glass-panel">
                        <div className="terminal-header">
                            <span className="dot red"></span>
                            <span className="dot yellow"></span>
                            <span className="dot green"></span>
                            <span className="terminal-title">voteflow -- execution_log</span>
                            {connected && <span className="ws-indicator">🟢 LIVE</span>}
                        </div>
                        <div className="terminal-content" ref={terminalRef}>
                            <div className="log-line system">{'>'} VoteFlow AI Engine v1.0</div>
                            <div className="log-line system">{'>'} Waiting for commands...</div>
                            {logs.map((log) => (
                                <div key={log.id} className={`log-line ${log.type}`}>
                                    <span className="timestamp">[{log.timestamp}]</span> {log.message}
                                </div>
                            ))}
                            {isRunning && <div className="typing-cursor">_</div>}
                        </div>
                    </div>
                </div>

                {/* Right: Message Template */}
                <div className="dashboard-col-right">
                    <div className="glass-panel message-card">
                        <h3>📝 Message Template</h3>
                        <textarea
                            className="message-input"
                            placeholder="Enter your campaign message here..."
                            value={messageTemplate}
                            onChange={(e) => setMessageTemplate(e.target.value)}
                            rows={10}
                        />
                        <p className="hint">Leave blank to use default Telugu message</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
