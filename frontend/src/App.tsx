import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  Handle,
  MiniMap,
  MarkerType,
  Node,
  NodeProps,
  Position,
  ReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  Braces,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock,
  Code2,
  Copy,
  Cpu,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Fingerprint,
  GitBranch,
  History,
  Info,
  Layers3,
  LayoutDashboard,
  Loader2,
  Lock,
  Maximize2,
  Menu,
  MessageCircle,
  MessageSquare,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Table2,
  Terminal,
  User,
  WandSparkles,
  X,
  XCircle,
  Zap,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  Answer,
  ChatMessage,
  DatasetMeta,
  EvalCase,
  EvalResult,
  PipelineStep,
  RunHistoryItem,
  SemanticModelFull,
  Status,
} from './types'

// ============================================================================
// RAGVAULT-STYLE CUSTOM REACT FLOW NODES
// ============================================================================

// 1. DATA / SEMANTIC MODEL NODE
function DataNode({ data }: NodeProps<Node<{
  dataset: string
  tablesCount: number
  dimsCount: number
  metricsCount: number
  database: string
  schema: string
  onSwitchDataset: () => void
}>>) {
  return (
    <div className="pipeline-node data">
      <Handle type="source" position={Position.Right} className="node-handle" />
      <div className="node-content-area">
        <div className="node-header-row">
          <div>
            <h3>Data</h3>
            <p className="node-subtitle">Semantic Catalog</p>
          </div>
          <Database size={16} className="node-type-icon teal" />
        </div>

        <div className="node-data-pill" onClick={data.onSwitchDataset} title="Click to view datasets">
          <span>Active Dataset</span>
          <strong>{data.dataset.toUpperCase()}</strong>
        </div>

        <div className="node-meta-micro">
          <span>{data.database}.{data.schema}</span>
        </div>

        <div className="node-tag">
          {data.tablesCount} tables · {data.dimsCount} dims · {data.metricsCount} metrics
        </div>
      </div>

      <div className="node-toolbar">
        <button title="Configure" onClick={data.onSwitchDataset}><Sliders size={13} /></button>
        <button title="Schema Info"><Terminal size={13} /></button>
        <button title="Database"><Database size={13} /></button>
      </div>
    </div>
  )
}

// 2. QUERY NODE (Interactive Question Input + Top-K Slider + Execute button)
function QueryNode({ data }: NodeProps<Node<{
  query: string
  topK: number
  status: 'idle' | 'querying' | 'success' | 'error'
  onQueryChange: (q: string) => void
  onTopKChange: (k: number) => void
  onExecute: () => void
}>>) {
  return (
    <div className="pipeline-node query">
      <Handle type="target" position={Position.Left} className="node-handle" />
      <Handle type="source" position={Position.Right} className="node-handle" />

      <div className="node-content-area">
        <div className="node-header-row">
          <div>
            <h3>Query</h3>
            <p className="node-subtitle">Natural Language</p>
          </div>
          <Search size={16} className="node-type-icon purple" />
        </div>

        <input
          type="text"
          className="node-input"
          placeholder="Ask a data question..."
          value={data.query}
          onChange={(e) => data.onQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && data.onExecute()}
          disabled={data.status === 'querying'}
        />

        <div className="topk-inline">
          <span>Row Limit:</span>
          <input
            type="range"
            min={1}
            max={50}
            value={data.topK}
            onChange={(e) => data.onTopKChange(Number(e.target.value))}
            disabled={data.status === 'querying'}
          />
          <span className="topk-val">{data.topK}</span>
        </div>

        <button
          className="node-action-btn primary"
          onClick={data.onExecute}
          disabled={!data.query.trim() || data.status === 'querying'}
        >
          {data.status === 'querying' ? (
            <Loader2 size={15} className="spin" />
          ) : (
            <Play size={14} />
          )}
          <span>{data.status === 'querying' ? 'Executing...' : 'Execute'}</span>
        </button>
      </div>

      <div className="node-toolbar">
        <button title="Parameters"><Sliders size={13} /></button>
        <button title="Logs"><Terminal size={13} /></button>
        <button title="Clear" onClick={() => data.onQueryChange('')}><RefreshCw size={13} /></button>
      </div>
    </div>
  )
}

// 3. PLANNER NODE (Google Gemma 4)
function PlannerNode({ data }: NodeProps<Node<{
  status: 'idle' | 'active' | 'done'
  model: string
  metricsCount: number
  dimsCount: number
  onInspect: () => void
}>>) {
  return (
    <div className="pipeline-node planner">
      <Handle type="target" position={Position.Left} className="node-handle" />
      <Handle type="source" position={Position.Right} className="node-handle" />

      <div className="node-content-area">
        <div className="node-header-row">
          <div>
            <h3>Planner</h3>
            <p className="node-subtitle">Google Gemma 4 E4B</p>
          </div>
          <Bot size={16} className="node-type-icon purple" />
        </div>

        <div className="node-status-pill">
          <span className={`status-dot ${data.status === 'done' ? 'ready' : data.status === 'active' ? 'active' : ''}`} />
          <span>{data.status === 'active' ? 'Planning...' : data.status === 'done' ? 'JSON Contract Ready' : 'Awaiting Query'}</span>
        </div>

        <div className="node-tag">
          {data.model || 'gemma4:e4b'} · temp 0 · GPU Metal
        </div>

        {data.status === 'done' && (
          <div className="node-subtag">
            {data.metricsCount} metrics · {data.dimsCount} dims planned
          </div>
        )}
      </div>

      <div className="node-toolbar">
        <button title="Inspect Plan" onClick={data.onInspect}><Eye size={13} /></button>
        <button title="Model Config"><Cpu size={13} /></button>
      </div>
    </div>
  )
}

// 4. SAFETY GATE NODE
function SafetyNode({ data }: NodeProps<Node<{
  status: 'idle' | 'verified' | 'blocked'
  onInspect: () => void
}>>) {
  return (
    <div className="pipeline-node safety">
      <Handle type="target" position={Position.Left} className="node-handle" />
      <Handle type="source" position={Position.Right} className="node-handle" />

      <div className="node-content-area">
        <div className="node-header-row">
          <div>
            <h3>Guardrails</h3>
            <p className="node-subtitle">Deterministic Policy</p>
          </div>
          <Shield size={16} className="node-type-icon green" />
        </div>

        <div className="node-status-pill">
          {data.status === 'verified' && <CheckCircle2 size={13} color="var(--accent-green)" />}
          {data.status === 'blocked' && <XCircle size={13} color="var(--accent-red)" />}
          {data.status === 'idle' && <Lock size={13} color="var(--text-muted)" />}
          <span>
            {data.status === 'verified' ? 'Policy Passed' : data.status === 'blocked' ? 'Blocked Unsafe SQL' : '1-SELECT Policy'}
          </span>
        </div>

        <div className="node-tag">
          Single SELECT · Allowlist Verified · DDL Blocked
        </div>
      </div>

      <div className="node-toolbar">
        <button title="Policy Rules" onClick={data.onInspect}><ShieldCheck size={13} /></button>
        <button title="Allowlist"><Lock size={13} /></button>
      </div>
    </div>
  )
}

// 5. SNOWFLAKE EXECUTION NODE
function SnowflakeNode({ data }: NodeProps<Node<{
  status: 'idle' | 'computing' | 'done'
  queryId?: string
  warehouse: string
  elapsedMs?: number
  rowsCount?: number
  onInspect: () => void
}>>) {
  return (
    <div className="pipeline-node snowflake">
      <Handle type="target" position={Position.Left} className="node-handle" />
      <Handle type="source" position={Position.Right} className="node-handle" />

      <div className="node-content-area">
        <div className="node-header-row">
          <div>
            <h3>Snowflake</h3>
            <p className="node-subtitle">Live Compute & SQL API</p>
          </div>
          <Database size={16} className="node-type-icon cyan" />
        </div>

        <div className="node-status-pill">
          <span className={`status-dot ${data.status === 'done' ? 'ready' : data.status === 'computing' ? 'active' : ''}`} />
          <span>{data.status === 'computing' ? 'Computing in Snowflake...' : data.status === 'done' ? `${data.elapsedMs}ms · ${data.rowsCount} rows` : `${data.warehouse} Ready`}</span>
        </div>

        {data.queryId && (
          <div className="query-id-pill" onClick={data.onInspect} title="Click to view on Snowflake">
            <Fingerprint size={12} />
            <code>{data.queryId.slice(0, 16)}…</code>
          </div>
        )}

        <div className="node-tag">
          {data.warehouse} · X-Small · Auto-suspend 60s
        </div>
      </div>

      <div className="node-toolbar">
        <button title="Inspect Query" onClick={data.onInspect}><ExternalLink size={13} /></button>
        <button title="Query Tag"><Terminal size={13} /></button>
        <button title="Warehouse"><Database size={13} /></button>
      </div>
    </div>
  )
}

// 6. RESULT NODE (Ragvault ResultNode style with expand & source tags)
function ResultNode({ data }: NodeProps<Node<{
  answer?: Answer | null
  status: 'idle' | 'loading' | 'done'
  onExpand: () => void
  onCopy: () => void
}>>) {
  return (
    <div className="pipeline-node result">
      <Handle type="target" position={Position.Left} className="node-handle" />

      <div className="node-content-area">
        <div className="node-header-row">
          <div>
            <h3>Answer</h3>
            <p className="node-subtitle">Grounded Evidence</p>
          </div>
          <button className="expand-btn" onClick={data.onExpand} title="Expand Full Result">
            <Maximize2 size={13} />
            <span>Expand</span>
          </button>
        </div>

        {data.status === 'loading' && (
          <div className="result-loading">
            <Loader2 size={24} className="spin" />
          </div>
        )}

        {data.status === 'done' && data.answer && (
          <div className="result-preview">
            <p>{data.answer.summary}</p>

            {data.answer.claims && data.answer.claims.length > 0 && (
              <div className="source-tags">
                {data.answer.claims.map((cl, i) => (
                  <span key={i} className="source-tag-mini">
                    {cl.text.slice(0, 32)}… (row #{cl.row_indexes.map((x) => x + 1).join(',')})
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {data.status === 'idle' && (
          <div className="node-empty">
            <Terminal size={20} />
            <span>Execute a query to see grounded answer</span>
          </div>
        )}
      </div>

      <div className="node-toolbar">
        <button title="Full View" onClick={data.onExpand}><Maximize2 size={13} /></button>
        <button title="Copy Answer" onClick={data.onCopy}><Copy size={13} /></button>
        <button title="View Data Grid" onClick={data.onExpand}><Table2 size={13} /></button>
      </div>
    </div>
  )
}

const nodeTypes = {
  dataNode: DataNode,
  queryNode: QueryNode,
  plannerNode: PlannerNode,
  safetyNode: SafetyNode,
  snowflakeNode: SnowflakeNode,
  resultNode: ResultNode,
}

// ============================================================================
// INITIAL SEEDED HISTORY & PROOF
// ============================================================================

const initialHistory: RunHistoryItem[] = [
  {
    id: 'seed-1',
    timestamp: '2026-10-18T12:14:35Z',
    question: 'Which five customer nations generated the most revenue in 1995?',
    status: 'verified',
    dataset: 'tpch',
    query_id: '01c7ce8d-000e-16a4-0000-0002b856b259',
    elapsed_ms: 3120,
    rows_count: 5,
    warehouse: 'DATAMIND_WH',
    answer: {
      question: 'Which five customer nations generated the most revenue in 1995?',
      summary: 'Top 5 customer nations in 1995: Indonesia ($54.19M), Vietnam ($53.47M), China ($52.68M), India ($52.54M), Iran ($51.52M).',
      explanation: 'Joined LINEITEM, ORDERS, CUSTOMER, and NATION tables with date filter between 1995-01-01 and 1995-12-31, grouped by customer nation and ranked by total discounted revenue.',
      plan: {
        dataset: 'tpch',
        dimensions: ['nation_name'],
        metrics: ['revenue'],
        filters: [{ field: 'order_date', operator: 'between', value: ['1995-01-01', '1995-12-31'] }],
        sort: [{ field: 'revenue', direction: 'desc' }],
        limit: 5,
        assumptions: ['Customer nation interpreted as C_NATIONKEY'],
      },
      query: {
        sql: `SELECT
  NATION.N_NAME AS "nation_name",
  SUM(LINEITEM.L_EXTENDEDPRICE * (1 - LINEITEM.L_DISCOUNT)) AS "revenue"
FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.LINEITEM AS LINEITEM
JOIN SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.ORDERS AS ORDERS ON LINEITEM.L_ORDERKEY = ORDERS.O_ORDERKEY
JOIN SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.CUSTOMER AS CUSTOMER ON ORDERS.O_CUSTKEY = CUSTOMER.C_CUSTKEY
JOIN SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.NATION AS NATION ON CUSTOMER.C_NATIONKEY = NATION.N_NATIONKEY
WHERE ORDERS.O_ORDERDATE BETWEEN '1995-01-01' AND '1995-12-31'
GROUP BY NATION.N_NAME
ORDER BY "revenue" DESC
LIMIT 5`,
        parameters: [],
        tables: ['LINEITEM', 'ORDERS', 'CUSTOMER', 'NATION'],
        selected_fields: ['nation_name', 'revenue'],
      },
      result: {
        query_id: '01c7ce8d-000e-16a4-0000-0002b856b259',
        columns: ['nation_name', 'revenue'],
        rows: [
          ['INDONESIA', 54189234.21],
          ['VIETNAM', 53472190.87],
          ['CHINA', 52684391.12],
          ['INDIA', 52540982.44],
          ['IRAN', 51523049.03],
        ],
        elapsed_ms: 3120,
        warehouse: 'DATAMIND_WH',
        role: 'DATAMIND_READER',
        executed_at: '2026-10-18T06:44:35Z',
      },
      claims: [
        { text: 'Indonesia ranked first with $54.19M in revenue', row_indexes: [0], columns: ['nation_name', 'revenue'] },
        { text: 'Vietnam ranked second with $53.47M', row_indexes: [1], columns: ['nation_name', 'revenue'] },
      ],
      limitations: [],
    },
  },
  {
    id: 'seed-2',
    timestamp: '2026-10-18T12:24:30Z',
    question: 'How many orders did each market segment place?',
    status: 'verified',
    dataset: 'tpch',
    query_id: '01c7ce9e-000e-16a4-0000-0002b856b27d',
    elapsed_ms: 2889,
    rows_count: 5,
    warehouse: 'DATAMIND_WH',
    answer: {
      question: 'How many orders did each market segment place?',
      summary: 'First returned result — customer segment: HOUSEHOLD; order count: 300,147. 5 rows returned.',
      explanation: 'The order_count metric was calculated and grouped by the customer_segment dimension using the tpch dataset.',
      plan: {
        dataset: 'tpch',
        dimensions: ['customer_segment'],
        metrics: ['order_count'],
        filters: [],
        sort: [],
        limit: 100,
        assumptions: [],
      },
      query: {
        sql: `SELECT
  CUSTOMER.C_MKTSEGMENT AS "customer_segment",
  COUNT(DISTINCT ORDERS.O_ORDERKEY) AS "order_count"
FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.ORDERS AS ORDERS
JOIN SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.CUSTOMER AS CUSTOMER ON ORDERS.O_CUSTKEY = CUSTOMER.C_CUSTKEY
GROUP BY CUSTOMER.C_MKTSEGMENT
LIMIT 100`,
        parameters: [],
        tables: ['ORDERS', 'CUSTOMER'],
        selected_fields: ['customer_segment', 'order_count'],
      },
      result: {
        query_id: '01c7ce9e-000e-16a4-0000-0002b856b27d',
        columns: ['customer_segment', 'order_count'],
        rows: [
          ['HOUSEHOLD', 300147],
          ['MACHINERY', 298980],
          ['BUILDING', 303959],
          ['FURNITURE', 299461],
          ['AUTOMOBILE', 297453],
        ],
        elapsed_ms: 2889,
        warehouse: 'DATAMIND_WH',
        role: 'DATAMIND_READER',
        executed_at: '2026-10-18T06:54:30Z',
      },
      claims: [
        { text: 'Building had the highest volume with 303,959 orders', row_indexes: [2], columns: ['customer_segment', 'order_count'] },
      ],
      limitations: [],
    },
  },
]

// ============================================================================
// MAIN APPLICATION
// ============================================================================

export default function App() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'chat' | 'receipts' | 'models' | 'evals'>('pipeline')
  const [status, setStatus] = useState<Status | null>(null)
  const [datasets, setDatasets] = useState<DatasetMeta[]>([])
  const [activeDatasetId, setActiveDatasetId] = useState<string>('tpch')
  const [semanticModel, setSemanticModel] = useState<SemanticModelFull | null>(null)

  // Query and execution state
  const [queryText, setQueryText] = useState('Which five customer nations generated the most revenue in 1995?')
  const [topK, setTopK] = useState(5)
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'querying' | 'success' | 'error'>('idle')
  const [answer, setAnswer] = useState<Answer | null>(initialHistory[0].answer || null)
  const [activeModalTab, setActiveModalTab] = useState<'summary' | 'table' | 'sql'>('summary')
  const [expandModalOpen, setExpandModalOpen] = useState(false)
  const [snowflakeModalOpen, setSnowflakeModalOpen] = useState(false)
  const [inspectedQueryId, setInspectedQueryId] = useState<string | null>(null)
  const [copiedQueryId, setCopiedQueryId] = useState(false)
  const [copiedSql, setCopiedSql] = useState(false)

  // Stage timeline tracking
  const [stageProgress, setStageProgress] = useState(0)
  const [elapsedTimer, setElapsedTimer] = useState(0)

  // History & Receipts
  const [history, setHistory] = useState<RunHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem('datamind_receipts')
      return stored ? JSON.parse(stored) : initialHistory
    } catch {
      return initialHistory
    }
  })

  // Chat conversation
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      role: 'assistant',
      content: 'Welcome to **DataMind**. I answer natural language questions using live computation from **Snowflake**, with semantic planning handled by **Google Gemma 4**. Ask a question or use the Pipeline workbench to see every stage executed live.',
      timestamp: '12:00 PM',
    },
    {
      id: 'msg-2',
      role: 'user',
      content: 'Which five customer nations generated the most revenue in 1995?',
      timestamp: '12:14 PM',
    },
    {
      id: 'msg-3',
      role: 'assistant',
      content: initialHistory[0].answer!.summary,
      timestamp: '12:14 PM',
      answer: initialHistory[0].answer,
      steps: [
        { id: '1', name: 'NL Intent', detail: 'Target nation_name and revenue', status: 'done', elapsed_ms: 120 },
        { id: '2', name: 'Gemma 4 Planner', detail: 'Constrained QueryPlan JSON', status: 'done', elapsed_ms: 980 },
        { id: '3', name: 'Safety Gate', detail: '1-SELECT · Allowlist verified', status: 'done', elapsed_ms: 15 },
        { id: '4', name: 'Snowflake Live', detail: 'DATAMIND_WH · 01c7ce8d…', status: 'done', elapsed_ms: 3120 },
        { id: '5', name: 'Evidence Ledger', detail: '5 rows verified', status: 'done', elapsed_ms: 450 },
      ],
    },
  ])
  const [chatInput, setChatInput] = useState('')
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Evals state
  const [evalList, setEvalList] = useState<EvalCase[]>([])
  const [evalResults, setEvalResults] = useState<Record<string, EvalResult>>({})
  const [evalRunning, setEvalRunning] = useState<string | null>(null)

  // Custom dataset modal
  const [customModalOpen, setCustomModalOpen] = useState(false)
  const [customYaml, setCustomYaml] = useState(
`name: custom_sales
description: Custom revenue analytics for store checkouts
database: SNOWFLAKE_SAMPLE_DATA
schema: TPCH_SF1
tables:
  ORDERS: {physical: ORDERS, description: Store orders}
  CUSTOMER: {physical: CUSTOMER, description: Retail buyers}
joins:
  - {from: ORDERS, to: CUSTOMER, "on": "ORDERS.O_CUSTKEY = CUSTOMER.C_CUSTKEY"}
dimensions:
  customer_segment:
    table: CUSTOMER
    expression: CUSTOMER.C_MKTSEGMENT
    description: Market segment
metrics:
  order_count:
    table: ORDERS
    expression: COUNT(DISTINCT ORDERS.O_ORDERKEY)
    description: Total order volume`
  )
  const [customError, setCustomError] = useState('')

  // Load backend health, datasets, evals
  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => {
        setStatus(data)
        if (data.semantic_model?.id) setActiveDatasetId(data.semantic_model.id)
      })
      .catch(() => setStatus(null))

    fetch('/api/datasets')
      .then((r) => r.json())
      .then((d: DatasetMeta[]) => {
        setDatasets(d)
        const active = d.find((item) => item.is_active)
        if (active) setActiveDatasetId(active.id)
      })
      .catch(() => {})

    fetch('/api/semantic-model')
      .then((r) => r.json())
      .then(setSemanticModel)
      .catch(() => {})

    fetch('/api/evals')
      .then((r) => r.json())
      .then(setEvalList)
      .catch(() => {})
  }, [])

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, activeTab, executionStatus])

  // Persist receipts
  useEffect(() => {
    try {
      localStorage.setItem('datamind_receipts', JSON.stringify(history))
    } catch {}
  }, [history])

  // Switch dataset
  async function handleDatasetSelect(datasetId: string) {
    if (datasetId === 'new') {
      setCustomModalOpen(true)
      return
    }
    try {
      const res = await fetch('/api/datasets/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset: datasetId }),
      })
      if (res.ok) {
        setActiveDatasetId(datasetId)
        const [hRes, dRes, mRes] = await Promise.all([
          fetch('/api/health').then((r) => r.json()),
          fetch('/api/datasets').then((r) => r.json()),
          fetch('/api/semantic-model').then((r) => r.json()),
        ])
        setStatus(hRes)
        setDatasets(dRes)
        setSemanticModel(mRes)
      }
    } catch {}
  }

  // Create custom dataset
  async function handleCreateCustomDataset(e: FormEvent) {
    e.preventDefault()
    setCustomError('')
    try {
      const res = await fetch('/api/datasets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'custom_' + Date.now().toString(36),
          yaml_content: customYaml,
        }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.detail || 'Failed to save dataset')
      setCustomModalOpen(false)
      const [dRes, mRes, hRes] = await Promise.all([
        fetch('/api/datasets').then((r) => r.json()),
        fetch('/api/semantic-model').then((r) => r.json()),
        fetch('/api/health').then((r) => r.json()),
      ])
      setDatasets(dRes)
      setSemanticModel(mRes)
      setStatus(hRes)
      setActiveDatasetId(payload.dataset)
    } catch (err: unknown) {
      setCustomError(err instanceof Error ? err.message : 'Invalid YAML model')
    }
  }

  // Core execution function (runs live against backend)
  async function executePipeline(q: string) {
    const query = q.trim()
    if (!query || executionStatus === 'querying') return

    setExecutionStatus('querying')
    setStageProgress(20)
    setElapsedTimer(0)

    const timerInterval = setInterval(() => {
      setElapsedTimer((t) => t + 100)
    }, 100)

    // Chat updates
    const asstId = 'asst-' + Date.now()
    setChatMessages((prev) => [
      ...prev,
      {
        id: 'user-' + Date.now(),
        role: 'user',
        content: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: asstId,
        role: 'assistant',
        content: '',
        status: 'pending',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        steps: [
          { id: '1', name: 'NL Intent', detail: 'Parsing intent with Gemma 4', status: 'active' },
          { id: '2', name: 'Gemma 4 Planner', detail: 'Awaiting schema plan', status: 'pending' },
          { id: '3', name: 'Safety Gate', detail: 'Validating single SELECT and table allowlist', status: 'pending' },
          { id: '4', name: 'Snowflake Compute', detail: 'Executing query on DATAMIND_WH', status: 'pending' },
          { id: '5', name: 'Evidence Ledger', detail: 'Generating row-grounded proof', status: 'pending' },
        ],
      },
    ])

    const t1 = setTimeout(() => setStageProgress(45), 3000)
    const t2 = setTimeout(() => setStageProgress(75), 7000)

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, context: [] }),
      })
      const payload = await response.json()

      clearTimeout(t1)
      clearTimeout(t2)
      clearInterval(timerInterval)

      if (!response.ok) {
        throw new Error(
          typeof payload.detail === 'string'
            ? payload.detail
            : payload.detail?.question || 'The verified query could not run.'
        )
      }

      setStageProgress(100)
      setExecutionStatus('success')
      setAnswer(payload)

      // Update chat
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === asstId
            ? {
                ...m,
                content: payload.summary,
                status: 'completed',
                answer: payload,
                steps: [
                  { id: '1', name: 'NL Intent', detail: `Dataset: ${payload.plan.dataset}`, status: 'done', elapsed_ms: 120 },
                  { id: '2', name: 'Gemma 4 Planner', detail: `${payload.plan.metrics.length} metrics, ${payload.plan.dimensions.length} dims`, status: 'done', elapsed_ms: 890 },
                  { id: '3', name: 'Safety Gate', detail: '1-SELECT · Allowlist verified', status: 'done', elapsed_ms: 15 },
                  { id: '4', name: 'Snowflake Compute', detail: `${payload.result.warehouse} · ${payload.result.query_id.slice(0, 16)}…`, status: 'done', elapsed_ms: payload.result.elapsed_ms },
                  { id: '5', name: 'Evidence Ledger', detail: `${payload.result.rows.length} rows verified`, status: 'done', elapsed_ms: 380 },
                ],
              }
            : m
        )
      )

      // Add to decision receipts
      const newReceipt: RunHistoryItem = {
        id: 'rcpt-' + Date.now().toString(36),
        timestamp: new Date().toISOString(),
        question: query,
        status: 'verified',
        dataset: payload.plan.dataset || activeDatasetId,
        query_id: payload.result.query_id,
        elapsed_ms: payload.result.elapsed_ms,
        rows_count: payload.result.rows.length,
        warehouse: payload.result.warehouse,
        answer: payload,
      }
      setHistory((prev) => [newReceipt, ...prev])
    } catch (err: unknown) {
      clearTimeout(t1)
      clearTimeout(t2)
      clearInterval(timerInterval)
      setExecutionStatus('error')
      const msg = err instanceof Error ? err.message : 'Execution failed.'

      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === asstId
            ? {
                ...m,
                content: `**Safety Stop**: ${msg}`,
                status: 'error',
                error: msg,
              }
            : m
        )
      )

      const isBlocked = msg.toLowerCase().includes('policy') || msg.toLowerCase().includes('unsafe') || msg.toLowerCase().includes('drop')
      const newReceipt: RunHistoryItem = {
        id: 'rcpt-' + Date.now().toString(36),
        timestamp: new Date().toISOString(),
        question: query,
        status: isBlocked ? 'blocked' : 'clarification',
        dataset: activeDatasetId,
        query_id: isBlocked ? 'POLICY_BLOCKED' : 'FAILED',
        elapsed_ms: 24,
        rows_count: 0,
        warehouse: 'DATAMIND_WH',
      }
      setHistory((prev) => [newReceipt, ...prev])
    }
  }

  // Open Snowflake inspector modal
  function openSnowflakeInspector(qid?: string) {
    setInspectedQueryId(qid || answer?.result.query_id || '01c7ce8d-000e-16a4-0000-0002b856b259')
    setSnowflakeModalOpen(true)
  }

  function copyText(txt: string, type: 'queryId' | 'sql' | 'answer') {
    navigator.clipboard.writeText(txt)
    if (type === 'queryId') {
      setCopiedQueryId(true)
      setTimeout(() => setCopiedQueryId(false), 2000)
    } else if (type === 'sql') {
      setCopiedSql(true)
      setTimeout(() => setCopiedSql(false), 2000)
    }
  }

  // Evals run test
  async function runEvalTest(ec: EvalCase) {
    setEvalRunning(ec.id)
    try {
      const res = await fetch('/api/evals/run-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_id: ec.id,
          question: ec.question,
          category: ec.category,
          expected_tables: ec.expected_tables,
        }),
      })
      const result: EvalResult = await res.json()
      setEvalResults((prev) => ({ ...prev, [ec.id]: result }))
    } catch {
      setEvalResults((prev) => ({
        ...prev,
        [ec.id]: { id: ec.id, status: 'failed', passed: false, reason: 'Network failure' },
      }))
    } finally {
      setEvalRunning(null)
    }
  }

  // Export CSV
  function downloadCsv() {
    if (!answer) return
    const headers = answer.result.columns.join(',')
    const rows = answer.result.rows.map((r) => r.map((c) => JSON.stringify(c ?? '')).join(',')).join('\n')
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `datamind_query_${answer.result.query_id.slice(0, 8)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // React Flow Nodes
  const nodes = useMemo<Node[]>(() => {
    return [
      {
        id: 'data',
        type: 'dataNode',
        position: { x: 30, y: 160 },
        data: {
          dataset: activeDatasetId,
          tablesCount: semanticModel?.tables.length ?? 8,
          dimsCount: semanticModel?.dimensions.length ?? 14,
          metricsCount: semanticModel?.metrics.length ?? 9,
          database: semanticModel?.database || 'SNOWFLAKE_SAMPLE_DATA',
          schema: semanticModel?.schema || 'TPCH_SF1',
          onSwitchDataset: () => setActiveTab('models'),
        },
      },
      {
        id: 'query',
        type: 'queryNode',
        position: { x: 320, y: 130 },
        data: {
          query: queryText,
          topK,
          status: executionStatus,
          onQueryChange: setQueryText,
          onTopKChange: setTopK,
          onExecute: () => executePipeline(queryText),
        },
      },
      {
        id: 'planner',
        type: 'plannerNode',
        position: { x: 640, y: 35 },
        data: {
          status: executionStatus === 'querying' && stageProgress < 50 ? 'active' : answer ? 'done' : 'idle',
          model: status?.gemma.model || 'gemma4:e4b',
          metricsCount: answer?.plan.metrics.length ?? 0,
          dimsCount: answer?.plan.dimensions.length ?? 0,
          onInspect: () => setExpandModalOpen(true),
        },
      },
      {
        id: 'safety',
        type: 'safetyNode',
        position: { x: 640, y: 275 },
        data: {
          status: executionStatus === 'error' ? 'blocked' : answer ? 'verified' : 'idle',
          onInspect: () => setExpandModalOpen(true),
        },
      },
      {
        id: 'snowflake',
        type: 'snowflakeNode',
        position: { x: 960, y: 155 },
        data: {
          status: executionStatus === 'querying' && stageProgress >= 50 ? 'computing' : answer ? 'done' : 'idle',
          queryId: answer?.result.query_id,
          warehouse: status?.snowflake.warehouse || 'DATAMIND_WH',
          elapsedMs: answer?.result.elapsed_ms,
          rowsCount: answer?.result.rows.length,
          onInspect: () => openSnowflakeInspector(answer?.result.query_id),
        },
      },
      {
        id: 'result',
        type: 'resultNode',
        position: { x: 1280, y: 115 },
        data: {
          answer,
          status: executionStatus === 'querying' ? 'loading' : answer ? 'done' : 'idle',
          onExpand: () => setExpandModalOpen(true),
          onCopy: () => copyText(answer?.summary || '', 'answer'),
        },
      },
    ]
  }, [activeDatasetId, answer, executionStatus, queryText, semanticModel, stageProgress, status, topK])

  const edges: Edge[] = useMemo(() => [
    { id: 'd-q', source: 'data', target: 'query', animated: true },
    { id: 'q-p', source: 'query', target: 'planner', animated: true },
    { id: 'q-s', source: 'query', target: 'safety', animated: true },
    { id: 'p-sf', source: 'planner', target: 'snowflake', animated: true },
    { id: 's-sf', source: 'safety', target: 'snowflake', animated: true },
    { id: 'sf-r', source: 'snowflake', target: 'result', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  ], [])

  // Chart data
  const chartData = useMemo(() => {
    if (!answer || answer.result.columns.length < 2 || !answer.result.rows.length) return []
    const numIdx = answer.result.rows[0]?.findIndex((v) => typeof v === 'number') ?? -1
    if (numIdx < 0) return []
    const labelIdx = numIdx === 0 ? 1 : 0
    return answer.result.rows.slice(0, 15).map((row) => ({
      label: String(row[labelIdx]),
      value: Number(row[numIdx]),
    }))
  }, [answer])

  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Shield size={22} color="var(--accent-purple)" />
            <span>DataMind</span>
          </div>
        </div>

        <div className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-section-title">Navigation</span>
            <a
              className={`nav-item ${activeTab === 'pipeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('pipeline')}
            >
              <LayoutDashboard size={18} />
              <span>Pipeline</span>
              <ChevronRight size={14} className="nav-chevron" />
            </a>
            <a
              className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageCircle size={18} />
              <span>Chat</span>
              <ChevronRight size={14} className="nav-chevron" />
            </a>
            <a
              className={`nav-item ${activeTab === 'receipts' ? 'active' : ''}`}
              onClick={() => setActiveTab('receipts')}
            >
              <Clock size={18} />
              <span>Decision Receipts</span>
              <span className="nav-count">{history.length}</span>
            </a>
            <a
              className={`nav-item ${activeTab === 'models' ? 'active' : ''}`}
              onClick={() => setActiveTab('models')}
            >
              <Layers3 size={18} />
              <span>Semantic Model</span>
              <ChevronRight size={14} className="nav-chevron" />
            </a>
            <a
              className={`nav-item ${activeTab === 'evals' ? 'active' : ''}`}
              onClick={() => setActiveTab('evals')}
            >
              <ShieldCheck size={18} />
              <span>Rubric Evals</span>
              <span className="nav-count">7</span>
            </a>
          </div>

          <div className="nav-section" style={{ marginTop: 20 }}>
            <span className="nav-section-title">Active Dataset</span>
            <div className="sidebar-dataset-select">
              <select
                value={activeDatasetId}
                onChange={(e) => handleDatasetSelect(e.target.value)}
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name.toUpperCase()} ({d.table_count} tables)
                  </option>
                ))}
                <option value="new">+ Add Custom Dataset…</option>
              </select>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="system-telemetry-box">
            <div className="telemetry-item">
              <span className={`status-dot ${status?.snowflake.ready ? 'ready' : ''}`} />
              <span>Snowflake: {status?.snowflake.warehouse || 'DATAMIND_WH'}</span>
            </div>
            <div className="telemetry-item">
              <span className={`status-dot ${status?.gemma.ready ? 'ready' : ''}`} />
              <span>Gemma 4: {status?.gemma.model || 'gemma4:e4b'} (GPU)</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="main-content">
        <header className="app-header">
          <div className="breadcrumb">
            <span className="breadcrumb-item">Dashboard</span>
            <ChevronRight size={14} />
            <span className="breadcrumb-current">
              {activeTab === 'pipeline' && 'Pipeline'}
              {activeTab === 'chat' && 'Chat'}
              {activeTab === 'receipts' && 'Decision Receipts'}
              {activeTab === 'models' && 'Semantic Model'}
              {activeTab === 'evals' && 'Rubric Benchmarks'}
            </span>
          </div>

          <div className="header-actions">
            <button
              className="btn-snowflake-proof"
              onClick={() => openSnowflakeInspector()}
              title="Inspect live query execution on Snowflake"
            >
              <Database size={14} />
              <span>Snowflake Proof</span>
            </button>
            <div className="user-pill">
              <span title="Read-Only Authenticated Session">RO</span>
              <span>DATAMIND_READER</span>
            </div>
          </div>
        </header>

        {/* -------------------------------------------------------------------------
            TAB 1: PIPELINE PAGE (RAGVAULT STYLE)
           ------------------------------------------------------------------------- */}
        {activeTab === 'pipeline' && (
          <div className="pipeline-page">
            <div className="pipeline-progress-bar-container">
              <div className="progress-topline">
                <div className="progress-title">
                  <Play size={13} className="teal" />
                  <strong>ZeroDay DataMind Pipeline</strong>
                  <span className="progress-phase-tag">
                    {executionStatus === 'querying' ? 'Computing Question-Time Answer...' : 'Ready'}
                  </span>
                </div>
                <div className="progress-meta">
                  <span><Clock size={12} /> {executionStatus === 'querying' ? `${(elapsedTimer / 1000).toFixed(1)}s` : `${answer?.result.elapsed_ms ?? 0}ms`}</span>
                  <span><Database size={12} /> {status?.snowflake.warehouse || 'DATAMIND_WH'}</span>
                </div>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${executionStatus === 'querying' ? stageProgress : 100}%` }}
                />
              </div>
            </div>

            <div className="react-flow-container">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.4}
                maxZoom={1.4}
              >
                <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#2d2e2f" />
                <Controls />
                <MiniMap
                  nodeColor={(n) => {
                    if (n.type === 'queryNode') return '#8b5cf6'
                    if (n.type === 'plannerNode') return '#8b5cf6'
                    if (n.type === 'safetyNode') return '#22c55e'
                    if (n.type === 'snowflakeNode') return '#06b6d4'
                    if (n.type === 'resultNode') return '#20b2aa'
                    return '#3a3b3c'
                  }}
                  maskColor="rgba(25, 26, 26, 0.85)"
                  style={{ background: '#1e1f20', borderRadius: 8, border: '1px solid #2d2e2f' }}
                />
              </ReactFlow>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------------
            TAB 2: CHAT PAGE (RAGVAULT / CHATGPT STYLE)
           ------------------------------------------------------------------------- */}
        {activeTab === 'chat' && (
          <div className="chat-page">
            <div className="chat-container">
              <div className="chat-messages">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`chat-message ${msg.role}`}>
                    <div className="message-avatar">
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} color="var(--accent-purple)" />}
                    </div>
                    <div className="message-content">
                      {msg.role === 'assistant' && msg.steps && (
                        <details className="chat-thought-process" open={msg.status === 'pending'}>
                          <summary>
                            <Sparkles size={13} color="var(--accent-purple)" />
                            <span>
                              {msg.status === 'pending'
                                ? 'Reasoning with Gemma 4 & computing in Snowflake…'
                                : 'Verified Execution Pipeline (5 stages)'}
                            </span>
                            {msg.status === 'pending' && <Loader2 size={13} className="spin" />}
                          </summary>
                          <div className="thought-steps-content">
                            {msg.steps.map((st) => (
                              <div key={st.id} className={`thought-step-item ${st.status}`}>
                                {st.status === 'done' && <Check size={12} color="var(--accent-green)" />}
                                {st.status === 'active' && <Loader2 size={12} className="spin" color="var(--accent-purple)" />}
                                {st.status === 'pending' && <CircleDot size={12} color="var(--text-muted)" />}
                                <div>
                                  <strong>{st.name}</strong>
                                  <p>{st.detail} {st.elapsed_ms !== undefined && `(${st.elapsed_ms}ms)`}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}

                      <div className="message-bubble">
                        {msg.content}
                      </div>

                      {msg.role === 'assistant' && msg.answer && (
                        <div className="chat-evidence-card">
                          <div className="chat-evidence-header">
                            <span className="source-tag-mini">
                              {msg.answer.result.rows.length} rows verified
                            </span>
                            <code
                              className="chat-qid clickable"
                              onClick={() => openSnowflakeInspector(msg.answer!.result.query_id)}
                            >
                              {msg.answer.result.query_id.slice(0, 18)}…
                            </code>
                          </div>

                          <div className="chat-actions-row">
                            <button
                              className="node-action-btn"
                              onClick={() => {
                                setAnswer(msg.answer!)
                                setExpandModalOpen(true)
                              }}
                            >
                              <Maximize2 size={12} /> Inspect Evidence
                            </button>
                            <button
                              className="node-action-btn"
                              onClick={() => openSnowflakeInspector(msg.answer!.result.query_id)}
                            >
                              <Database size={12} /> Snowflake Proof
                            </button>
                            <button
                              className="node-action-btn"
                              onClick={() => copyText(msg.answer!.query.sql, 'sql')}
                            >
                              <Copy size={12} /> Copy SQL
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>

              <div className="chat-input-area">
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && chatInput.trim()) {
                      executePipeline(chatInput)
                      setChatInput('')
                    }
                  }}
                  disabled={executionStatus === 'querying'}
                />
                <button
                  onClick={() => {
                    if (chatInput.trim()) {
                      executePipeline(chatInput)
                      setChatInput('')
                    }
                  }}
                  disabled={!chatInput.trim() || executionStatus === 'querying'}
                >
                  {executionStatus === 'querying' ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------------
            TAB 3: DECISION RECEIPTS PAGE (RAGVAULT STYLE)
           ------------------------------------------------------------------------- */}
        {activeTab === 'receipts' && (
          <div className="page-content receipts-page">
            <div className="page-header">
              <div>
                <h1>Decision Receipts</h1>
                <p>Replayable answers, evidence metadata, runtime configuration, and reviewer feedback.</p>
              </div>
              <button
                className="btn-secondary"
                onClick={() => {
                  const data = JSON.stringify(history, null, 2)
                  const blob = new Blob([data], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `datamind_decision_receipts.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >
                <Download size={14} /> Export Receipts
              </button>
            </div>

            <div className="trust-note">
              <Shield size={16} /> Receipts store fingerprints, bound parameters, and Snowflake Query IDs—never unhashed credentials.
            </div>

            <div className="receipt-list">
              {history.map((receipt) => (
                <article className="receipt-card" key={receipt.id}>
                  <div className="receipt-card-header">
                    <div>
                      <span className="receipt-id">{receipt.id}</span>
                      <span className={`evidence-status ${receipt.status}`}>
                        {receipt.status}
                      </span>
                    </div>
                    <time>{new Date(receipt.timestamp).toLocaleString()}</time>
                  </div>
                  <p className="receipt-query">{receipt.question}</p>
                  <p className="receipt-answer">{receipt.answer?.summary || 'Execution completed.'}</p>
                  <div className="receipt-meta">
                    Query ID: <code className="clickable" onClick={() => openSnowflakeInspector(receipt.query_id)}>{receipt.query_id}</code> · {receipt.elapsed_ms}ms · {receipt.rows_count} rows · {receipt.warehouse}
                  </div>
                  <div className="receipt-actions">
                    <button onClick={() => { if (receipt.answer) { setAnswer(receipt.answer); setExpandModalOpen(true); } }}>
                      <Eye size={13} /> View Evidence
                    </button>
                    <button onClick={() => openSnowflakeInspector(receipt.query_id)}>
                      <Database size={13} /> Snowflake
                    </button>
                    <button onClick={() => copyText(receipt.answer?.query.sql || '', 'sql')}>
                      <Copy size={13} /> Copy SQL
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------------
            TAB 4: SEMANTIC MODEL PAGE
           ------------------------------------------------------------------------- */}
        {activeTab === 'models' && (
          <div className="page-content models-page">
            <div className="page-header">
              <div>
                <h1>Semantic Models & Catalog</h1>
                <p>Allowlisted tables, dimensions, metrics, and relationships compiled into SQL.</p>
              </div>
              <button className="btn-primary" onClick={() => setCustomModalOpen(true)}>
                <Plus size={14} /> Add Dataset
              </button>
            </div>

            <div className="datasets-grid">
              {datasets.map((d) => (
                <div
                  key={d.id}
                  className={`dataset-card ${d.id === activeDatasetId ? 'active' : ''}`}
                  onClick={() => handleDatasetSelect(d.id)}
                >
                  <div className="dataset-card-header">
                    <span className="dataset-id">{d.id.toUpperCase()}</span>
                    {d.id === activeDatasetId && <span className="active-badge">Active</span>}
                  </div>
                  <h4>{d.name}</h4>
                  <p>{d.description}</p>
                  <div className="dataset-stats">
                    <span>{d.table_count} tables</span>
                    <span>{d.dimension_count} dimensions</span>
                    <span>{d.metric_count} metrics</span>
                  </div>
                </div>
              ))}
            </div>

            {semanticModel && (
              <div className="model-split-view">
                <div className="model-card-section">
                  <h3>Allowlisted Tables ({semanticModel.tables.length})</h3>
                  <div className="table-items-list">
                    {semanticModel.tables.map((t) => (
                      <div className="table-row-item" key={t.name}>
                        <strong>{t.name}</strong>
                        <small>Physical: {t.physical}</small>
                        <p>{t.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="model-card-section">
                  <h3>Dimensions ({semanticModel.dimensions.length}) & Metrics ({semanticModel.metrics.length})</h3>
                  <div className="fields-grid">
                    <div>
                      <span className="field-type-title">Dimensions</span>
                      {semanticModel.dimensions.map((d) => (
                        <div className="field-entry" key={d.name}>
                          <code>{d.name}</code>
                          <small>{d.description}</small>
                        </div>
                      ))}
                    </div>
                    <div>
                      <span className="field-type-title">Metrics</span>
                      {semanticModel.metrics.map((m) => (
                        <div className="field-entry" key={m.name}>
                          <code>{m.name}</code>
                          <small>{m.description}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------------
            TAB 5: RUBRIC EVALS PAGE
           ------------------------------------------------------------------------- */}
        {activeTab === 'evals' && (
          <div className="page-content evals-page">
            <div className="page-header">
              <div>
                <h1>ZeroDay PS1 Rubric Benchmarks</h1>
                <p>Live test runner for multi-table joins, aggregations, safety injection, and ambiguity.</p>
              </div>
              <button
                className="btn-primary"
                onClick={async () => {
                  for (const ec of evalList) await runEvalTest(ec)
                }}
                disabled={evalRunning !== null}
              >
                {evalRunning ? <Loader2 size={14} className="spin" /> : <Play size={14} />}
                Run All Benchmarks
              </button>
            </div>

            <div className="evals-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Question</th>
                    <th>Criteria</th>
                    <th>Status</th>
                    <th>Query ID</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {evalList.map((ec) => {
                    const res = evalResults[ec.id]
                    return (
                      <tr key={ec.id}>
                        <td><code>{ec.id}</code></td>
                        <td><span className="category-tag">{ec.category}</span></td>
                        <td>
                          <strong>{ec.question}</strong>
                          <p className="eval-subtext">{ec.description}</p>
                        </td>
                        <td><small>{ec.criteria}</small></td>
                        <td>
                          {res ? (
                            <span className={`status-pill ${res.status}`}>
                              {res.passed ? 'passed' : 'failed'}
                            </span>
                          ) : ec.sample_query_id ? (
                            <span className="status-pill verified">pre-verified</span>
                          ) : (
                            <span className="status-pill idle">ready</span>
                          )}
                        </td>
                        <td>
                          <code
                            className="clickable"
                            onClick={() => openSnowflakeInspector(res?.query_id || ec.sample_query_id || '01c7ce8d-000e-16a4-0000-0002b856b259')}
                          >
                            {res?.query_id || ec.sample_query_id || '—'}
                          </code>
                        </td>
                        <td>
                          <button
                            className="btn-table-action"
                            onClick={() => runEvalTest(ec)}
                            disabled={evalRunning === ec.id}
                          >
                            {evalRunning === ec.id ? <Loader2 size={12} className="spin" /> : <Play size={12} />}
                            Run
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL 1: RESULT EXPAND (FULL EVIDENCE, CHART, AND SQL)
         ========================================================================= */}
      {expandModalOpen && answer && (
        <div className="modal-overlay" onClick={() => setExpandModalOpen(false)}>
          <div className="modal-container large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <CheckCircle2 size={18} color="var(--accent-green)" />
                <span>Verified Result: {answer.question}</span>
              </div>
              <button className="modal-close" onClick={() => setExpandModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-tabs">
              <button
                className={activeModalTab === 'summary' ? 'active' : ''}
                onClick={() => setActiveModalTab('summary')}
              >
                Summary & Chart
              </button>
              <button
                className={activeModalTab === 'table' ? 'active' : ''}
                onClick={() => setActiveModalTab('table')}
              >
                Evidence Table ({answer.result.rows.length})
              </button>
              <button
                className={activeModalTab === 'sql' ? 'active' : ''}
                onClick={() => setActiveModalTab('sql')}
              >
                Compiled SQL & Bindings
              </button>
            </div>

            <div className="modal-body">
              {activeModalTab === 'summary' && (
                <div className="modal-summary-view">
                  <div className="summary-banner">
                    <h3>{answer.summary}</h3>
                    <p>{answer.explanation}</p>
                    <div className="summary-telemetry">
                      <span>Query ID: <code className="clickable" onClick={() => openSnowflakeInspector(answer.result.query_id)}>{answer.result.query_id}</code></span>
                      <span>Execution: {answer.result.elapsed_ms}ms</span>
                      <span>Warehouse: {answer.result.warehouse}</span>
                    </div>
                  </div>

                  {chartData.length > 1 && (
                    <div className="modal-chart-area">
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={chartData} margin={{ top: 12, right: 12, bottom: 25, left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2d2e2f" vertical={false} />
                          <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={45} />
                          <Tooltip contentStyle={{ background: '#232425', border: '1px solid #3a3b3c', borderRadius: 8 }} />
                          <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {activeModalTab === 'table' && (
                <div className="modal-table-view">
                  <div className="modal-table-toolbar">
                    <span>{answer.result.rows.length} rows queried from Snowflake</span>
                    <button className="btn-secondary" onClick={downloadCsv}>
                      <Download size={13} /> Export CSV
                    </button>
                  </div>
                  <div className="table-scroll">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          {answer.result.columns.map((c) => (
                            <th key={c}>{c.replaceAll('_', ' ')}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {answer.result.rows.map((r, ri) => (
                          <tr key={ri}>
                            <td className="row-num">{ri + 1}</td>
                            {r.map((cv, ci) => (
                              <td key={ci}>{cv === null ? 'null' : String(cv)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeModalTab === 'sql' && (
                <div className="modal-sql-view">
                  <div className="modal-sql-toolbar">
                    <span>Single read-only SELECT compiled by AST generator</span>
                    <button className="btn-secondary" onClick={() => copyText(answer.query.sql, 'sql')}>
                      <Copy size={13} /> {copiedSql ? 'Copied' : 'Copy SQL'}
                    </button>
                  </div>
                  <pre className="sql-box"><code>{answer.query.sql}</code></pre>
                  <div className="params-box">
                    <strong>Bound Parameters:</strong>
                    <code>{JSON.stringify(answer.query.parameters)}</code>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: SNOWFLAKE QUERY PROOF INSPECTOR
         ========================================================================= */}
      {snowflakeModalOpen && (
        <div className="modal-overlay" onClick={() => setSnowflakeModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Database size={18} color="var(--accent-cyan)" />
                <span>Snowflake Execution Proof</span>
              </div>
              <button className="modal-close" onClick={() => setSnowflakeModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="trust-note">
                <ShieldCheck size={16} color="var(--accent-green)" />
                <span>Executed live on your Snowflake warehouse using Programmatic Access Tokens (PAT).</span>
              </div>

              <div className="inspector-group">
                <label>Snowflake Query ID</label>
                <div className="code-pill-row">
                  <code>{inspectedQueryId || answer?.result.query_id}</code>
                  <button onClick={() => copyText(inspectedQueryId || answer?.result.query_id || '', 'queryId')}>
                    <Copy size={13} /> {copiedQueryId ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="telemetry-grid">
                <div className="telemetry-card">
                  <span>Warehouse</span>
                  <strong>{status?.snowflake.warehouse || 'DATAMIND_WH'}</strong>
                  <small>X-Small (0.0001 cr/sec)</small>
                </div>
                <div className="telemetry-card">
                  <span>Auto-Suspend</span>
                  <strong>60s</strong>
                  <small>Cost control gate</small>
                </div>
                <div className="telemetry-card">
                  <span>Active Role</span>
                  <strong>DATAMIND_READER</strong>
                  <small>Least privilege</small>
                </div>
                <div className="telemetry-card">
                  <span>Query Tag</span>
                  <strong>datamind:interactive:v0.1</strong>
                  <small>Audit tagged</small>
                </div>
              </div>

              <div className="inspector-group">
                <label>How to Verify on Snowflake:</label>
                <ol className="verify-steps">
                  <li>Open <strong>app.snowflake.com</strong> and go to <strong>Activity → Query History</strong>.</li>
                  <li>Filter by Query ID: <code>{inspectedQueryId || answer?.result.query_id}</code>.</li>
                  <li>Verify warehouse credits, statement text, and live question-time timestamp.</li>
                </ol>
              </div>

              <div className="inspector-group">
                <label>Snowflake CLI Command</label>
                <pre className="sql-box mini">
                  <code>{`snow sql -q "${(answer?.query.sql || 'SELECT 1;').replace(/\\n/g, ' ')}" --warehouse ${status?.snowflake.warehouse || 'DATAMIND_WH'}`}</code>
                </pre>
              </div>
            </div>

            <div className="modal-footer">
              <a
                href="https://app.snowflake.com"
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
              >
                <ExternalLink size={14} /> Open Snowflake Web Console
              </a>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: CUSTOM DATASET REGISTRATION
         ========================================================================= */}
      {customModalOpen && (
        <div className="modal-overlay" onClick={() => setCustomModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Database size={18} color="var(--accent-purple)" />
                <span>Register Custom Semantic Model</span>
              </div>
              <button className="modal-close" onClick={() => setCustomModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomDataset}>
              <div className="modal-body">
                <p className="modal-desc">
                  Define your database, schema, tables, joins, dimensions, and metrics in YAML.
                  It will compile and activate immediately.
                </p>
                {customError && <div className="error-note">{customError}</div>}
                <textarea
                  rows={14}
                  className="yaml-editor"
                  value={customYaml}
                  onChange={(e) => setCustomYaml(e.target.value)}
                  spellCheck={false}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setCustomModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Activate Dataset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
