import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  Handle,
  MarkerType,
  Node,
  NodeProps,
  Position,
  ReactFlow,
} from '@xyflow/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Braces,
  Check,
  ChevronRight,
  CircleDot,
  Clock3,
  Code2,
  Database,
  ExternalLink,
  Fingerprint,
  GitBranch,
  History,
  Layers3,
  Loader2,
  Menu,
  PanelLeftClose,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Table2,
  TerminalSquare,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type Status = {
  status: string
  snowflake: { ready: boolean; warehouse: string; dataset: string }
  gemma: { ready: boolean; model: string }
  semantic_model: { name: string; dimensions: number; metrics: number; tables: number }
}

type QueryPlan = {
  dataset: string
  dimensions: string[]
  metrics: string[]
  filters: Array<{ field: string; operator: string; value: unknown }>
  sort: Array<{ field: string; direction: string }>
  limit: number
  assumptions: string[]
}

type Answer = {
  question: string
  summary: string
  explanation: string
  plan: QueryPlan
  query: { sql: string; parameters: unknown[]; tables: string[]; selected_fields: string[] }
  result: {
    query_id: string
    columns: string[]
    rows: unknown[][]
    elapsed_ms: number
    warehouse: string
  }
  limitations: string[]
}

type FlowNodeData = {
  icon: typeof Sparkles
  kicker: string
  title: string
  detail: string
  tone: 'violet' | 'cyan' | 'lime' | 'amber'
  state?: 'idle' | 'active' | 'done'
}

function PipelineNode({ data }: NodeProps<Node<FlowNodeData>>) {
  const Icon = data.icon
  return (
    <div className={`pipeline-node tone-${data.tone} state-${data.state ?? 'idle'}`}>
      <Handle type="target" position={Position.Left} className="flow-handle" />
      <div className="node-icon"><Icon size={17} /></div>
      <div className="node-copy">
        <span>{data.kicker}</span>
        <strong>{data.title}</strong>
        <small>{data.detail}</small>
      </div>
      {data.state === 'done' && <Check size={14} className="node-check" />}
      {data.state === 'active' && <Loader2 size={14} className="node-spinner" />}
      <Handle type="source" position={Position.Right} className="flow-handle" />
    </div>
  )
}

const nodeTypes = { pipeline: PipelineNode }

const suggestions = [
  'Which five customer nations generated the most revenue in 1995?',
  'Compare monthly revenue across 1996.',
  'Which market segment placed the most orders?',
]

function initialNodes(): Node<FlowNodeData>[] {
  return [
    { id: 'question', type: 'pipeline', position: { x: 20, y: 145 }, data: { icon: Search, kicker: 'Natural language', title: 'Your question', detail: 'Waiting for a question', tone: 'violet' } },
    { id: 'gemma', type: 'pipeline', position: { x: 292, y: 36 }, data: { icon: Sparkles, kicker: 'Google Gemma', title: 'Semantic plan', detail: 'Constrained JSON only', tone: 'violet' } },
    { id: 'guard', type: 'pipeline', position: { x: 292, y: 252 }, data: { icon: ShieldCheck, kicker: 'Policy engine', title: 'Safety gate', detail: 'Read-only · allowlisted', tone: 'lime' } },
    { id: 'snowflake', type: 'pipeline', position: { x: 584, y: 145 }, data: { icon: Database, kicker: 'Snowflake', title: 'Live computation', detail: 'Question-time query', tone: 'cyan' } },
    { id: 'evidence', type: 'pipeline', position: { x: 868, y: 36 }, data: { icon: Fingerprint, kicker: 'Provenance', title: 'Evidence ledger', detail: 'Query · rows · ID', tone: 'amber' } },
    { id: 'answer', type: 'pipeline', position: { x: 868, y: 252 }, data: { icon: WandSparkles, kicker: 'Grounded output', title: 'Verified answer', detail: 'Claims backed by rows', tone: 'lime' } },
  ]
}

const edges: Edge[] = [
  { id: 'q-g', source: 'question', target: 'gemma', animated: true },
  { id: 'q-v', source: 'question', target: 'guard', animated: true },
  { id: 'g-s', source: 'gemma', target: 'snowflake', animated: true },
  { id: 'v-s', source: 'guard', target: 'snowflake', animated: true },
  { id: 's-e', source: 'snowflake', target: 'evidence', animated: true },
  { id: 's-a', source: 'snowflake', target: 'answer', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-a', source: 'evidence', target: 'answer', animated: true },
]

function App() {
  const [status, setStatus] = useState<Status | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'result' | 'evidence' | 'sql'>('result')
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 780)

  useEffect(() => {
    fetch('/api/health').then((response) => response.json()).then(setStatus).catch(() => setStatus(null))
  }, [])

  const nodes = useMemo<Node<FlowNodeData>[]>(() => {
    const list = initialNodes()
    if (!question && !answer) return list
    return list.map((node) => ({
      ...node,
      data: {
        ...node.data,
        detail: node.id === 'question' ? (answer?.question || question).slice(0, 32) :
          node.id === 'gemma' && answer ? `${answer.plan.metrics.length} metrics · ${answer.plan.dimensions.length} dimensions` :
          node.id === 'snowflake' && answer ? `${answer.result.elapsed_ms} ms · ${answer.result.rows.length} rows` :
          node.id === 'evidence' && answer ? answer.result.query_id.slice(0, 18) : node.data.detail,
        state: (loading ? (node.id === 'question' ? 'done' : node.id === 'gemma' ? 'active' : 'idle') : answer ? 'done' : 'idle') as FlowNodeData['state'],
      },
    }))
  }, [answer, loading, question])

  const chartData = useMemo(() => {
    if (!answer || answer.result.columns.length < 2) return []
    const numericIndex = answer.result.rows[0]?.findIndex((value) => typeof value === 'number') ?? -1
    if (numericIndex < 0) return []
    const labelIndex = numericIndex === 0 ? 1 : 0
    return answer.result.rows.slice(0, 12).map((row) => ({
      label: String(row[labelIndex]),
      value: Number(row[numericIndex]),
    }))
  }, [answer])

  async function submit(event?: FormEvent) {
    event?.preventDefault()
    if (!question.trim() || loading) return
    setLoading(true)
    setError('')
    setAnswer(null)
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), context: [] }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(typeof payload.detail === 'string' ? payload.detail : payload.detail?.question || 'The verified query could not run.')
      setAnswer(payload)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`app-shell ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark"><Braces size={18} /></div>
          <div className="brand-name">Data<span>Mind</span></div>
          <button className="icon-button collapse-button" onClick={() => setSidebarOpen(false)} aria-label="Collapse sidebar"><PanelLeftClose size={17} /></button>
        </div>
        <button className="new-query" onClick={() => { setQuestion(''); setAnswer(null); setError('') }}><span><Sparkles size={15} /> New analysis</span><span className="shortcut">⌘ K</span></button>
        <nav>
          <p>Workspace</p>
          <a className="active"><CircleDot size={16} /> Live canvas <span>01</span></a>
          <a><History size={16} /> Run history</a>
          <a><Layers3 size={16} /> Semantic model</a>
          <a><GitBranch size={16} /> Evaluations</a>
        </nav>
        <div className="sidebar-spacer" />
        <div className="system-card">
          <div className="system-title"><Zap size={13} /> Systems</div>
          <SystemStatus label="Snowflake" detail={status?.snowflake.warehouse || 'checking'} ready={status?.snowflake.ready} />
          <SystemStatus label="Gemma" detail={status?.gemma.model || 'checking'} ready={status?.gemma.ready} />
        </div>
        <div className="dataset-pill"><Database size={14} /><div><span>Active dataset</span><strong>TPC-H / SF1</strong></div><ChevronRight size={15} /></div>
      </aside>

      <main>
        <header>
          {!sidebarOpen && <button className="icon-button" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar"><Menu size={18} /></button>}
          <div className="breadcrumb"><span>Workspace</span><ChevronRight size={13} /><strong>Live canvas</strong></div>
          <div className="header-actions">
            <span className="readonly-badge"><ShieldCheck size={13} /> Read-only mode</span>
            <button className="icon-button"><ExternalLink size={16} /></button>
          </div>
        </header>

        <div className="content">
          <section className="hero">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }}>
              <div className="eyebrow"><span /> Verified intelligence</div>
              <h1>Ask your data.<br /><em>See the proof.</em></h1>
              <p>Natural-language analytics that shows its work—every query, row, assumption, and Snowflake execution ID.</p>
            </motion.div>
            <form className="command-bar" onSubmit={submit}>
              <Sparkles className="command-icon" size={20} />
              <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question about your business data…" aria-label="Ask a data question" />
              {question && <button type="button" className="clear-button" onClick={() => setQuestion('')} aria-label="Clear"><X size={15} /></button>}
              <button className="ask-button" type="submit" disabled={!question.trim() || loading} aria-label="Run analysis">
                {loading ? <Loader2 size={17} className="spin" /> : <Send size={16} />}<span>Run analysis</span>
              </button>
            </form>
            <div className="suggestions">
              <span>Try asking</span>
              {suggestions.map((suggestion) => <button key={suggestion} onClick={() => setQuestion(suggestion)}>{suggestion}<ArrowRight size={12} /></button>)}
            </div>
          </section>

          <AnimatePresence>{error && <motion.div className="error-banner" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><ShieldCheck size={17} /><div><strong>Safe stop</strong><span>{error}</span></div><button onClick={() => setError('')}><X size={15} /></button></motion.div>}</AnimatePresence>

          <section className="workspace-grid">
            <div className="canvas-card">
              <div className="card-head">
                <div><span className="micro-label">Live execution map</span><h2>Trace graph</h2></div>
                <div className="legend"><span><i className="violet" /> AI reasoning</span><span><i className="cyan" /> Data compute</span><span><i className="lime" /> Verified</span></div>
              </div>
              <div className="flow-wrap">
                <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView minZoom={0.65} maxZoom={1.25}>
                  <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#27303f" />
                  <Controls showInteractive={false} />
                </ReactFlow>
              </div>
            </div>

            <aside className="insight-rail">
              <div className="rail-card score-card">
                <div className="rail-title"><span>Trust posture</span><ShieldCheck size={17} /></div>
                <div className="trust-ring"><div><strong>{answer ? '100' : '—'}</strong><span>{answer ? '% traced' : 'no run'}</span></div></div>
                <div className="trust-list">
                  <span><Check size={13} /> Parameterized SQL</span>
                  <span><Check size={13} /> Allowlisted tables</span>
                  <span><Check size={13} /> Question-time data</span>
                </div>
              </div>
              <div className="rail-card model-card">
                <div className="rail-title"><span>Semantic model</span><Braces size={16} /></div>
                <div className="model-stat"><strong>{status?.semantic_model.metrics ?? '—'}</strong><span>metrics</span></div>
                <div className="model-stat"><strong>{status?.semantic_model.dimensions ?? '—'}</strong><span>dimensions</span></div>
                <div className="model-stat"><strong>{status?.semantic_model.tables ?? '—'}</strong><span>tables</span></div>
              </div>
            </aside>
          </section>

          <section className="result-card">
            <div className="result-topline">
              <div>
                <span className="micro-label">Evidence ledger</span>
                <h2>{answer ? 'Verified result' : 'Your first run will appear here'}</h2>
              </div>
              <div className="tabs">
                {(['result', 'evidence', 'sql'] as const).map((tab) => <button className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)} key={tab}>{tab === 'result' ? <BarChart3 size={14} /> : tab === 'evidence' ? <Table2 size={14} /> : <Code2 size={14} />}{tab}</button>)}
              </div>
            </div>
            {!answer ? <EmptyResult /> : (
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} className="result-body" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .18 }}>
                  {activeTab === 'result' && <ResultView answer={answer} chartData={chartData} />}
                  {activeTab === 'evidence' && <EvidenceView answer={answer} />}
                  {activeTab === 'sql' && <SqlView answer={answer} />}
                </motion.div>
              </AnimatePresence>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

function SystemStatus({ label, detail, ready }: { label: string; detail: string; ready?: boolean }) {
  return <div className="system-row"><span className={`status-dot ${ready ? 'ready' : ''}`} /><div><strong>{label}</strong><small>{detail}</small></div><span className="status-word">{ready ? 'live' : 'setup'}</span></div>
}

function EmptyResult() {
  return <div className="empty-result"><div className="empty-orbit"><TerminalSquare size={23} /></div><strong>No black boxes here.</strong><p>Run a question to see the verified answer, source rows, exact SQL, parameters, and Snowflake query ID in one place.</p></div>
}

function ResultView({ answer, chartData }: { answer: Answer; chartData: Array<{ label: string; value: number }> }) {
  return <div className="result-layout"><div className="answer-copy"><span className="verified-pill"><Check size={12} /> Verified from {answer.result.rows.length} rows</span><h3>{answer.summary}</h3><p>{answer.explanation}</p>{answer.limitations.map((item) => <div className="limitation" key={item}>{item}</div>)}<div className="run-metadata"><span><Clock3 size={13} /> {answer.result.elapsed_ms} ms</span><span><Database size={13} /> {answer.result.warehouse}</span><span><Fingerprint size={13} /> {answer.result.query_id.slice(0, 18)}…</span></div></div>{chartData.length > 1 && <div className="chart-wrap"><ResponsiveContainer width="100%" height={245}><BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#222a37" vertical={false} /><XAxis dataKey="label" tick={{ fill: '#778196', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: '#778196', fontSize: 10 }} axisLine={false} tickLine={false} width={48} /><Tooltip contentStyle={{ background: '#111722', border: '1px solid #303a4d', borderRadius: 12 }} /><Bar dataKey="value" fill="#8f7cff" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div>}</div>
}

function EvidenceView({ answer }: { answer: Answer }) {
  return <div className="table-shell"><table><thead><tr><th>#</th>{answer.result.columns.map((column) => <th key={column}>{column.replaceAll('_', ' ')}</th>)}</tr></thead><tbody>{answer.result.rows.map((row, index) => <tr key={index}><td className="row-num">{String(index + 1).padStart(2, '0')}</td>{row.map((value, cell) => <td key={cell}>{value === null ? <span className="null-value">missing</span> : String(value)}</td>)}</tr>)}</tbody></table></div>
}

function SqlView({ answer }: { answer: Answer }) {
  return <div className="sql-panel"><div className="sql-toolbar"><span><CircleDot size={12} /> Executed in Snowflake</span><span>{answer.query.tables.join(' → ')}</span></div><pre><code>{answer.query.sql}</code></pre><div className="parameter-row"><strong>Bound parameters</strong><code>{JSON.stringify(answer.query.parameters)}</code></div></div>
}

export default App
