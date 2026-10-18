import { FormEvent, useEffect, useMemo, useState, useTransition } from 'react'
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
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  Braces,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock3,
  Code2,
  Copy,
  Cpu,
  Database,
  Download,
  ExternalLink,
  Fingerprint,
  GitBranch,
  History,
  Layers3,
  Lightbulb,
  Loader2,
  Maximize2,
  Menu,
  PanelLeftClose,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Table2,
  TerminalSquare,
  WandSparkles,
  X,
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
  DatasetMeta,
  EvalCase,
  EvalResult,
  RunHistoryItem,
  SemanticModelFull,
  Status,
} from './types'

type FlowNodeData = {
  icon: typeof Sparkles
  kicker: string
  title: string
  detail: string
  stageId: string
  tone: 'violet' | 'cyan' | 'lime' | 'amber'
  state?: 'idle' | 'active' | 'done' | 'error'
  isClickable?: boolean
  onClick?: () => void
}

function PipelineNode({ data }: NodeProps<Node<FlowNodeData>>) {
  const Icon = data.icon
  return (
    <div
      className={`pipeline-node tone-${data.tone} state-${data.state ?? 'idle'}`}
      onClick={data.onClick}
      role="button"
      tabIndex={0}
      title="Click to inspect stage payload"
    >
      <Handle type="target" position={Position.Left} className="flow-handle" />
      <div className="node-icon">
        <Icon size={17} />
      </div>
      <div className="node-copy">
        <span>{data.kicker}</span>
        <strong>{data.title}</strong>
        <small>{data.detail}</small>
      </div>
      {data.state === 'done' && <Check size={14} className="node-check" />}
      {data.state === 'active' && <Loader2 size={14} className="node-spinner spin" />}
      {data.state === 'error' && <AlertTriangle size={14} className="node-warn" />}
      <Handle type="source" position={Position.Right} className="flow-handle" />
    </div>
  )
}

const nodeTypes = { pipeline: PipelineNode }

const initialSeededHistory: RunHistoryItem[] = [
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

export default function App() {
  const [activeView, setActiveView] = useState<'studio' | 'pipeline' | 'history' | 'models' | 'evals'>('studio')
  const [status, setStatus] = useState<Status | null>(null)
  const [datasets, setDatasets] = useState<DatasetMeta[]>([])
  const [activeDatasetId, setActiveDatasetId] = useState<string>('tpch')
  const [semanticModel, setSemanticModel] = useState<SemanticModelFull | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<Answer | null>(initialSeededHistory[0].answer || null)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState<string>('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'result' | 'evidence' | 'sql'>('result')
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 900)
  const [selectedNodeStage, setSelectedNodeStage] = useState<string | null>(null)
  const [history, setHistory] = useState<RunHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem('datamind_history')
      return stored ? JSON.parse(stored) : initialSeededHistory
    } catch {
      return initialSeededHistory
    }
  })

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

  // Copy feedback state
  const [copiedQueryId, setCopiedQueryId] = useState(false)
  const [copiedSql, setCopiedSql] = useState(false)

  // Filter on evidence table
  const [tableSearch, setTableSearch] = useState('')

  const [, startTransition] = useTransition()

  // Load health & datasets
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

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem('datamind_history', JSON.stringify(history))
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
        // Refresh health, datasets, and semantic-model
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
      // Refresh datasets
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

  // Run a single evaluation test
  async function handleRunEval(evalCase: EvalCase) {
    setEvalRunning(evalCase.id)
    try {
      const res = await fetch('/api/evals/run-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_id: evalCase.id,
          question: evalCase.question,
          category: evalCase.category,
          expected_tables: evalCase.expected_tables,
        }),
      })
      const result: EvalResult = await res.json()
      setEvalResults((prev) => ({ ...prev, [evalCase.id]: result }))
    } catch {
      setEvalResults((prev) => ({
        ...prev,
        [evalCase.id]: {
          id: evalCase.id,
          status: 'failed',
          passed: false,
          reason: 'Network or execution failure',
        },
      }))
    } finally {
      setEvalRunning(null)
    }
  }

  // Run all evaluations
  async function handleRunAllEvals() {
    for (const ec of evalList) {
      await handleRunEval(ec)
    }
  }

  // Submit main question
  async function submit(event?: FormEvent, customQuery?: string) {
    event?.preventDefault()
    const q = customQuery || question
    if (!q.trim() || loading) return
    setLoading(true)
    setError('')
    setLoadingStep('Google Gemma 4 is parsing natural language...')
    setAnswer(null)

    // Animated realistic stage progression
    const stepTimer1 = setTimeout(() => {
      setLoadingStep('Validating schema & enforcing read-only single-SELECT policy...')
    }, 4500)
    const stepTimer2 = setTimeout(() => {
      setLoadingStep('Snowflake DATAMIND_WH executing live computation...')
    }, 8500)
    const stepTimer3 = setTimeout(() => {
      setLoadingStep('Gemma 4 synthesizing evidence-backed explanation...')
    }, 12500)

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q.trim(), context: [] }),
      })
      const payload = await response.json()
      clearTimeout(stepTimer1)
      clearTimeout(stepTimer2)
      clearTimeout(stepTimer3)

      if (!response.ok) {
        throw new Error(
          typeof payload.detail === 'string'
            ? payload.detail
            : payload.detail?.question || 'The verified query could not run.'
        )
      }

      setAnswer(payload)

      // Add to run history
      const newRun: RunHistoryItem = {
        id: 'run-' + Date.now().toString(36),
        timestamp: new Date().toISOString(),
        question: q.trim(),
        status: 'verified',
        dataset: payload.plan.dataset || activeDatasetId,
        query_id: payload.result.query_id,
        elapsed_ms: payload.result.elapsed_ms,
        rows_count: payload.result.rows.length,
        warehouse: payload.result.warehouse,
        answer: payload,
      }
      setHistory((prev) => [newRun, ...prev])
    } catch (caught: unknown) {
      clearTimeout(stepTimer1)
      clearTimeout(stepTimer2)
      clearTimeout(stepTimer3)
      const msg = caught instanceof Error ? caught.message : 'Something went wrong.'
      setError(msg)
      // Record failed or blocked run in history
      const isBlocked = msg.toLowerCase().includes('policy') || msg.toLowerCase().includes('unsafe') || msg.toLowerCase().includes('drop')
      const newRun: RunHistoryItem = {
        id: 'run-' + Date.now().toString(36),
        timestamp: new Date().toISOString(),
        question: q.trim(),
        status: isBlocked ? 'blocked' : 'clarification',
        dataset: activeDatasetId,
        query_id: isBlocked ? 'POLICY_BLOCKED' : 'FAILED',
        elapsed_ms: 24,
        rows_count: 0,
        warehouse: 'DATAMIND_WH',
      }
      setHistory((prev) => [newRun, ...prev])
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  // Load a run from history
  function loadFromHistory(item: RunHistoryItem) {
    if (item.answer) {
      setAnswer(item.answer)
      setQuestion(item.question)
      setActiveView('studio')
    } else {
      setQuestion(item.question)
      setActiveView('studio')
      submit(undefined, item.question)
    }
  }

  // Dynamic suggestions from active semantic model
  const suggestions = useMemo(() => {
    if (semanticModel?.examples && semanticModel.examples.length > 0) {
      return semanticModel.examples.map((ex) => ex.question)
    }
    return [
      'Which five customer nations generated the most revenue in 1995?',
      'How many orders did each market segment place?',
      'Compare monthly revenue across 1996.',
    ]
  }, [semanticModel])

  // React Flow Nodes
  const nodes = useMemo<Node<FlowNodeData>[]>(() => {
    return [
      {
        id: 'question',
        type: 'pipeline',
        position: { x: 30, y: 150 },
        data: {
          icon: Search,
          kicker: '01. Question',
          title: 'Natural language',
          detail: answer?.question ? answer.question.slice(0, 36) + '…' : (question ? question.slice(0, 36) : 'Awaiting input'),
          stageId: 'question',
          tone: 'violet',
          state: loading ? 'done' : answer ? 'done' : 'idle',
          onClick: () => setSelectedNodeStage('question'),
        },
      },
      {
        id: 'gemma',
        type: 'pipeline',
        position: { x: 310, y: 35 },
        data: {
          icon: Sparkles,
          kicker: '02. Planner',
          title: 'Google Gemma 4',
          detail: answer ? `${answer.plan.metrics.length} metrics · ${answer.plan.dimensions.length} dims` : 'Constrained JSON schema',
          stageId: 'gemma',
          tone: 'violet',
          state: loading ? 'active' : answer ? 'done' : 'idle',
          onClick: () => setSelectedNodeStage('gemma'),
        },
      },
      {
        id: 'guard',
        type: 'pipeline',
        position: { x: 310, y: 265 },
        data: {
          icon: ShieldCheck,
          kicker: '03. Safety Gate',
          title: 'Deterministic Policy',
          detail: 'Read-only · allowlist check',
          stageId: 'guard',
          tone: 'lime',
          state: answer ? 'done' : error?.includes('policy') ? 'error' : 'idle',
          onClick: () => setSelectedNodeStage('guard'),
        },
      },
      {
        id: 'compiler',
        type: 'pipeline',
        position: { x: 590, y: 35 },
        data: {
          icon: Code2,
          kicker: '04. Compiler',
          title: 'SQL Compiler',
          detail: answer ? `${answer.query.tables.length} tables · ${answer.query.parameters.length} bound params` : 'AST & parameter binder',
          stageId: 'compiler',
          tone: 'cyan',
          state: answer ? 'done' : 'idle',
          onClick: () => setSelectedNodeStage('compiler'),
        },
      },
      {
        id: 'snowflake',
        type: 'pipeline',
        position: { x: 590, y: 265 },
        data: {
          icon: Database,
          kicker: '05. Execution',
          title: 'Snowflake Compute',
          detail: answer ? `${answer.result.elapsed_ms} ms · ${answer.result.rows.length} rows` : 'DATAMIND_WH · Live query',
          stageId: 'snowflake',
          tone: 'cyan',
          state: answer ? 'done' : 'idle',
          onClick: () => setSelectedNodeStage('snowflake'),
        },
      },
      {
        id: 'evidence',
        type: 'pipeline',
        position: { x: 880, y: 35 },
        data: {
          icon: Fingerprint,
          kicker: '06. Provenance',
          title: 'Evidence Ledger',
          detail: answer ? answer.result.query_id.slice(0, 18) + '…' : 'Query ID & row lineage',
          stageId: 'evidence',
          tone: 'amber',
          state: answer ? 'done' : 'idle',
          onClick: () => setSelectedNodeStage('evidence'),
        },
      },
      {
        id: 'answer',
        type: 'pipeline',
        position: { x: 880, y: 265 },
        data: {
          icon: WandSparkles,
          kicker: '07. Output',
          title: 'Verified Answer',
          detail: answer ? 'Claims backed by rows' : 'Gemma grounded summary',
          stageId: 'answer',
          tone: 'lime',
          state: answer ? 'done' : 'idle',
          onClick: () => setSelectedNodeStage('answer'),
        },
      },
    ]
  }, [answer, error, loading, question])

  const edges: Edge[] = useMemo(
    () => [
      { id: 'q-g', source: 'question', target: 'gemma', animated: true },
      { id: 'q-gd', source: 'question', target: 'guard', animated: true },
      { id: 'g-c', source: 'gemma', target: 'compiler', animated: true },
      { id: 'gd-c', source: 'guard', target: 'compiler', animated: true },
      { id: 'c-s', source: 'compiler', target: 'snowflake', animated: true },
      { id: 's-e', source: 'snowflake', target: 'evidence', animated: true },
      { id: 's-a', source: 'snowflake', target: 'answer', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
      { id: 'e-a', source: 'evidence', target: 'answer', animated: true },
    ],
    []
  )

  // Chart detection
  const chartData = useMemo(() => {
    if (!answer || answer.result.columns.length < 2 || !answer.result.rows.length) return []
    const numericIndex = answer.result.rows[0]?.findIndex((value) => typeof value === 'number') ?? -1
    if (numericIndex < 0) return []
    const labelIndex = numericIndex === 0 ? 1 : 0
    return answer.result.rows.slice(0, 15).map((row) => ({
      label: String(row[labelIndex]),
      value: Number(row[numericIndex]),
    }))
  }, [answer])

  // Filtered evidence table rows
  const filteredRows = useMemo(() => {
    if (!answer) return []
    if (!tableSearch.trim()) return answer.result.rows
    const q = tableSearch.toLowerCase()
    return answer.result.rows.filter((row) =>
      row.some((cell) => String(cell).toLowerCase().includes(q))
    )
  }, [answer, tableSearch])

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

  function copyText(text: string, type: 'queryId' | 'sql') {
    navigator.clipboard.writeText(text)
    if (type === 'queryId') {
      setCopiedQueryId(true)
      setTimeout(() => setCopiedQueryId(false), 2000)
    } else {
      setCopiedSql(true)
      setTimeout(() => setCopiedSql(false), 2000)
    }
  }

  return (
    <div className={`app-shell ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark">
            <Braces size={18} />
          </div>
          <div className="brand-name">
            Data<span>Mind</span>
          </div>
          <button
            className="icon-button collapse-button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose size={17} />
          </button>
        </div>

        <button
          className="new-query"
          onClick={() => {
            setQuestion('')
            setAnswer(null)
            setError('')
            setActiveView('studio')
          }}
        >
          <span>
            <Sparkles size={15} /> New analysis
          </span>
          <span className="shortcut">⌘ K</span>
        </button>

        <nav>
          <p>WORKSPACE</p>
          <a
            className={activeView === 'studio' ? 'active' : ''}
            onClick={() => setActiveView('studio')}
          >
            <CircleDot size={16} /> Query Studio
          </a>
          <a
            className={activeView === 'pipeline' ? 'active' : ''}
            onClick={() => setActiveView('pipeline')}
          >
            <GitBranch size={16} /> Pipeline Canvas
            <span className="badge-new">React Flow</span>
          </a>
          <a
            className={activeView === 'history' ? 'active' : ''}
            onClick={() => setActiveView('history')}
          >
            <History size={16} /> Audit History
            <span>{history.length}</span>
          </a>
          <a
            className={activeView === 'models' ? 'active' : ''}
            onClick={() => setActiveView('models')}
          >
            <Layers3 size={16} /> Semantic Model
            <span>{semanticModel?.tables.length ?? 8} tbls</span>
          </a>
          <a
            className={activeView === 'evals' ? 'active' : ''}
            onClick={() => setActiveView('evals')}
          >
            <ShieldCheck size={16} /> Benchmark Evals
            <span>7 tests</span>
          </a>
        </nav>

        <div className="sidebar-spacer" />

        {/* Dataset Switcher Pill */}
        <div className="dataset-switcher-box">
          <div className="switcher-label">
            <Database size={13} /> Active Semantic Dataset
          </div>
          <div className="dataset-select-wrap">
            <select
              value={activeDatasetId}
              onChange={(e) => handleDatasetSelect(e.target.value)}
              className="dataset-dropdown"
              aria-label="Select active dataset"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name.toUpperCase()} ({d.table_count} tables)
                </option>
              ))}
              <option value="new">+ Add Custom Dataset…</option>
            </select>
            <ChevronDown size={14} className="dropdown-caret" />
          </div>
          <div className="dataset-meta-micro">
            <span>{semanticModel?.database || 'SNOWFLAKE_SAMPLE_DATA'}</span>
            <span>{semanticModel?.schema || 'TPCH_SF1'}</span>
          </div>
        </div>

        {/* System Telemetry */}
        <div className="system-card">
          <div className="system-title">
            <Zap size={13} /> System Architecture
          </div>
          <div className="system-row">
            <span className={`status-dot ${status?.snowflake.ready ? 'ready' : ''}`} />
            <div>
              <strong>Snowflake Data Cloud</strong>
              <small>{status?.snowflake.warehouse || 'DATAMIND_WH'}</small>
            </div>
            <span className="status-word">{status?.snowflake.ready ? 'live' : 'setup'}</span>
          </div>
          <div className="system-row">
            <span className={`status-dot ${status?.gemma.ready ? 'ready' : ''}`} />
            <div>
              <strong>Google Gemma 4</strong>
              <small>{status?.gemma.model || 'gemma4:e4b'}</small>
            </div>
            <span className="status-word">{status?.gemma.ready ? 'gpu ready' : 'setup'}</span>
          </div>
          <div className="system-row">
            <span className="status-dot ready" />
            <div>
              <strong>Deterministic Safety</strong>
              <small>1-SELECT · Allowlist</small>
            </div>
            <span className="status-word">active</span>
          </div>
        </div>
      </aside>

      {/* MAIN VIEW AREA */}
      <main>
        <header>
          {!sidebarOpen && (
            <button
              className="icon-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={18} />
            </button>
          )}
          <div className="breadcrumb">
            <span>DataMind</span>
            <ChevronRight size={13} />
            <strong>
              {activeView === 'studio' && 'Query Studio'}
              {activeView === 'pipeline' && 'Execution Pipeline Deep-Dive'}
              {activeView === 'history' && 'Provenance & Audit History'}
              {activeView === 'models' && 'Semantic Catalog & Dataset Manager'}
              {activeView === 'evals' && 'ZeroDay Hackathon Evaluation Suite'}
            </strong>
          </div>
          <div className="header-actions">
            <span className="readonly-badge">
              <ShieldCheck size={13} /> Least-Privilege Read-Only
            </span>
            <span className="dataset-chip">
              <Database size={12} /> {activeDatasetId.toUpperCase()}
            </span>
          </div>
        </header>

        <div className="content">
          {/* VIEW 1: QUERY STUDIO */}
          {activeView === 'studio' && (
            <div className="studio-view">
              <section className="hero">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                  <div className="eyebrow">
                    <span /> Verifiable Analytics Engine
                  </div>
                  <h1>
                    Ask your data.
                    <br />
                    <em>Inspect the proof.</em>
                  </h1>
                  <p>
                    Natural-language intelligence backed by deterministically compiled SQL,
                    Snowflake computation, and row-level evidence verification.
                  </p>
                </motion.div>

                {/* Question Command Bar */}
                <form className="command-bar" onSubmit={(e) => submit(e)}>
                  <Sparkles className="command-icon" size={20} />
                  <input
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="Ask any business question in plain English…"
                    aria-label="Ask a data question"
                    disabled={loading}
                  />
                  {question && !loading && (
                    <button
                      type="button"
                      className="clear-button"
                      onClick={() => setQuestion('')}
                      aria-label="Clear"
                    >
                      <X size={15} />
                    </button>
                  )}
                  <button
                    className="ask-button"
                    type="submit"
                    disabled={!question.trim() || loading}
                    aria-label="Run analysis"
                  >
                    {loading ? <Loader2 size={17} className="spin" /> : <Send size={16} />}
                    <span>{loading ? 'Processing…' : 'Run query'}</span>
                  </button>
                </form>

                {/* Suggestions */}
                <div className="suggestions">
                  <span>Try asking:</span>
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setQuestion(suggestion)
                        submit(undefined, suggestion)
                      }}
                      disabled={loading}
                    >
                      {suggestion}
                      <ArrowRight size={12} />
                    </button>
                  ))}
                </div>
              </section>

              {/* Loading progress bar */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    className="loading-pipeline-card"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="loading-orbit-header">
                      <div className="spinner-ring">
                        <Loader2 size={20} className="spin" />
                      </div>
                      <div>
                        <strong>Running Verified Analytics Pipeline</strong>
                        <span>{loadingStep}</span>
                      </div>
                    </div>
                    <div className="pipeline-steps-indicator">
                      <div className="step active">
                        <Check size={12} /> NL Intent
                      </div>
                      <div className="step-arrow">→</div>
                      <div className="step active">
                        <Bot size={12} /> Gemma 4 Planner
                      </div>
                      <div className="step-arrow">→</div>
                      <div className="step active">
                        <ShieldCheck size={12} /> Safety Guard
                      </div>
                      <div className="step-arrow">→</div>
                      <div className="step active">
                        <Database size={12} /> Snowflake Compute
                      </div>
                      <div className="step-arrow">→</div>
                      <div className="step">
                        <Fingerprint size={12} /> Provenance Ledger
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="error-banner"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <ShieldAlert size={20} />
                    <div>
                      <strong>Safety Guardrail or Validation Stop</strong>
                      <span>{error}</span>
                    </div>
                    <button onClick={() => setError('')} aria-label="Close error">
                      <X size={15} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pipeline Preview + Trust Rail */}
              <section className="workspace-grid">
                <div className="canvas-card">
                  <div className="card-head">
                    <div>
                      <span className="micro-label">Execution Architecture</span>
                      <h2>Interactive Pipeline Trace Graph</h2>
                    </div>
                    <div className="pipeline-head-actions">
                      <div className="legend">
                        <span>
                          <i className="violet" /> Gemma AI
                        </span>
                        <span>
                          <i className="lime" /> Guardrails
                        </span>
                        <span>
                          <i className="cyan" /> Snowflake
                        </span>
                      </div>
                      <button
                        className="open-full-flow-btn"
                        onClick={() => setActiveView('pipeline')}
                        title="Expand to Full Dedicated Pipeline View"
                      >
                        <Maximize2 size={13} /> Fullscreen Flow
                      </button>
                    </div>
                  </div>
                  <div className="flow-wrap">
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      nodeTypes={nodeTypes}
                      fitView
                      minZoom={0.6}
                      maxZoom={1.3}
                    >
                      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#27303f" />
                      <Controls showInteractive={false} />
                    </ReactFlow>
                  </div>
                </div>

                <aside className="insight-rail">
                  <div className="rail-card score-card">
                    <div className="rail-title">
                      <span>Trust & Verification</span>
                      <ShieldCheck size={17} />
                    </div>
                    <div className="trust-ring">
                      <div>
                        <strong>{answer ? '100%' : '—'}</strong>
                        <span>{answer ? 'grounded' : 'awaiting run'}</span>
                      </div>
                    </div>
                    <div className="trust-list">
                      <span>
                        <Check size={13} /> Parameterized SQL (AST)
                      </span>
                      <span>
                        <Check size={13} /> Read-only allowlist gate
                      </span>
                      <span>
                        <Check size={13} /> Real question-time data
                      </span>
                      <span>
                        <Check size={13} /> Bounded query timeouts
                      </span>
                    </div>
                  </div>

                  <div className="rail-card model-card">
                    <div className="rail-title">
                      <span>{semanticModel?.name.toUpperCase() || 'TPCH'} Catalog</span>
                      <Braces size={16} />
                    </div>
                    <div className="model-stat">
                      <strong>{semanticModel?.tables.length ?? 8}</strong>
                      <span>tables</span>
                    </div>
                    <div className="model-stat">
                      <strong>{semanticModel?.dimensions.length ?? 14}</strong>
                      <span>dimensions</span>
                    </div>
                    <div className="model-stat">
                      <strong>{semanticModel?.metrics.length ?? 9}</strong>
                      <span>metrics</span>
                    </div>
                  </div>
                </aside>
              </section>

              {/* RESULT SECTION */}
              <section className="result-card">
                <div className="result-topline">
                  <div>
                    <span className="micro-label">Verified Output</span>
                    <h2>{answer ? 'Audit Ledger & Computed Result' : 'No query run yet'}</h2>
                  </div>
                  <div className="tabs">
                    {(['result', 'evidence', 'sql'] as const).map((tab) => (
                      <button
                        className={activeTab === tab ? 'active' : ''}
                        onClick={() => setActiveTab(tab)}
                        key={tab}
                      >
                        {tab === 'result' ? (
                          <BarChart3 size={14} />
                        ) : tab === 'evidence' ? (
                          <Table2 size={14} />
                        ) : (
                          <Code2 size={14} />
                        )}
                        {tab === 'result'
                          ? 'Summary & Visual'
                          : tab === 'evidence'
                          ? `Evidence Table (${answer?.result.rows.length ?? 0})`
                          : 'Compiled SQL'}
                      </button>
                    ))}
                  </div>
                </div>

                {!answer ? (
                  <EmptyResult onSelectQuestion={(q) => submit(undefined, q)} />
                ) : (
                  <div className="result-body">
                    {/* RESULT & VISUAL TAB */}
                    {activeTab === 'result' && (
                      <div className="result-layout">
                        <div className="answer-copy">
                          <div className="verified-header-row">
                            <span className="verified-pill">
                              <Check size={13} /> Verified from {answer.result.rows.length} rows in Snowflake
                            </span>
                            <button
                              className="copy-id-chip"
                              onClick={() => copyText(answer.result.query_id, 'queryId')}
                              title="Copy Snowflake Query ID"
                            >
                              <Fingerprint size={13} />
                              <code>{answer.result.query_id.slice(0, 18)}…</code>
                              {copiedQueryId ? <Check size={12} className="copied" /> : <Copy size={12} />}
                            </button>
                          </div>

                          <h3>{answer.summary}</h3>
                          <p className="explanation-paragraph">{answer.explanation}</p>

                          {/* Grounded Claims list */}
                          {answer.claims && answer.claims.length > 0 && (
                            <div className="claims-block">
                              <div className="claims-title">
                                <Sparkles size={12} /> Row-Grounding Claims:
                              </div>
                              {answer.claims.map((claim, idx) => (
                                <div className="claim-item" key={idx}>
                                  <span className="claim-bullet">•</span>
                                  <span>{claim.text}</span>
                                  <span className="claim-badge">row {claim.row_indexes.map((i) => i + 1).join(', ')}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {answer.limitations && answer.limitations.length > 0 && (
                            <div className="limitations-box">
                              <strong>Disclosed Limitations:</strong>
                              {answer.limitations.map((item, idx) => (
                                <div key={idx}>{item}</div>
                              ))}
                            </div>
                          )}

                          <div className="run-metadata">
                            <span>
                              <Clock3 size={13} /> {answer.result.elapsed_ms} ms
                            </span>
                            <span>
                              <Database size={13} /> Warehouse: {answer.result.warehouse}
                            </span>
                            <span>
                              <Table2 size={13} /> {answer.result.rows.length} rows returned
                            </span>
                            <span>
                              <Cpu size={13} /> Planner: {status?.gemma.model || 'gemma4:e4b'}
                            </span>
                          </div>
                        </div>

                        {/* Chart Visualization */}
                        {chartData.length > 1 ? (
                          <div className="chart-wrap">
                            <div className="chart-header">
                              <span>Distribution Visualizer</span>
                              <small>{chartData.length} records plotted</small>
                            </div>
                            <ResponsiveContainer width="100%" height={230}>
                              <BarChart data={chartData} margin={{ top: 12, right: 12, bottom: 25, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222a37" vertical={false} />
                                <XAxis
                                  dataKey="label"
                                  tick={{ fill: '#8893a7', fontSize: 10 }}
                                  axisLine={false}
                                  tickLine={false}
                                  angle={-20}
                                  textAnchor="end"
                                />
                                <YAxis
                                  tick={{ fill: '#8893a7', fontSize: 10 }}
                                  axisLine={false}
                                  tickLine={false}
                                  width={48}
                                />
                                <Tooltip
                                  contentStyle={{
                                    background: '#0d131f',
                                    border: '1px solid #303a4d',
                                    borderRadius: 10,
                                    fontSize: 12,
                                  }}
                                />
                                <Bar dataKey="value" fill="#8f7cff" radius={[6, 6, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="metric-single-kpi">
                            <div className="kpi-icon">
                              <BarChart3 size={28} />
                            </div>
                            <strong>{answer.result.rows.length}</strong>
                            <span>Rows computed live by Snowflake</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* EVIDENCE TAB */}
                    {activeTab === 'evidence' && (
                      <div className="evidence-panel">
                        <div className="evidence-toolbar">
                          <div className="table-search-box">
                            <Search size={14} />
                            <input
                              placeholder="Filter rows by text or value…"
                              value={tableSearch}
                              onChange={(e) => setTableSearch(e.target.value)}
                            />
                            {tableSearch && (
                              <button onClick={() => setTableSearch('')}>
                                <X size={12} />
                              </button>
                            )}
                          </div>
                          <div className="table-actions">
                            <span className="row-counter">
                              Showing {filteredRows.length} of {answer.result.rows.length} rows
                            </span>
                            <button className="download-btn" onClick={downloadCsv}>
                              <Download size={13} /> Export CSV
                            </button>
                          </div>
                        </div>

                        <div className="table-shell">
                          <table>
                            <thead>
                              <tr>
                                <th>#</th>
                                {answer.result.columns.map((col) => (
                                  <th key={col}>{col.replaceAll('_', ' ')}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {filteredRows.map((row, index) => (
                                <tr key={index}>
                                  <td className="row-num">{String(index + 1).padStart(2, '0')}</td>
                                  {row.map((val, cellIdx) => (
                                    <td key={cellIdx}>
                                      {val === null ? (
                                        <span className="null-value">null</span>
                                      ) : typeof val === 'number' ? (
                                        val.toLocaleString()
                                      ) : (
                                        String(val)
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* SQL TAB */}
                    {activeTab === 'sql' && (
                      <div className="sql-panel">
                        <div className="sql-toolbar">
                          <div className="sql-title">
                            <CircleDot size={13} className="live-dot" />
                            <span>Executed in Snowflake {answer.result.warehouse}</span>
                          </div>
                          <div className="sql-actions">
                            <span className="tables-tag">
                              Tables: {answer.query.tables.join(' ↔ ')}
                            </span>
                            <button
                              className="copy-sql-btn"
                              onClick={() => copyText(answer.query.sql, 'sql')}
                            >
                              {copiedSql ? <Check size={13} /> : <Copy size={13} />}
                              {copiedSql ? 'Copied!' : 'Copy SQL'}
                            </button>
                          </div>
                        </div>
                        <pre>
                          <code>{answer.query.sql}</code>
                        </pre>
                        <div className="parameter-row">
                          <strong>Bound AST Parameters:</strong>
                          <code>
                            {answer.query.parameters.length > 0
                              ? JSON.stringify(answer.query.parameters)
                              : 'None (Safe parameterized constants)'}
                          </code>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* VIEW 2: DEDICATED PIPELINE CANVAS */}
          {activeView === 'pipeline' && (
            <div className="pipeline-deep-dive-view">
              <div className="view-banner">
                <div>
                  <h2>End-to-End Execution Pipeline (React Flow)</h2>
                  <p>
                    Inspect how DataMind translates natural language into verified Snowflake
                    queries. Click on any stage node to inspect its runtime payload.
                  </p>
                </div>
                <div className="view-banner-badges">
                  <span className="badge-pill violet">
                    <Bot size={13} /> Gemma 4 E4B
                  </span>
                  <span className="badge-pill cyan">
                    <Database size={13} /> Snowflake DATAMIND_WH
                  </span>
                  <span className="badge-pill lime">
                    <ShieldCheck size={13} /> Read-Only Compiler
                  </span>
                </div>
              </div>

              <div className="full-flow-container">
                <div className="flow-canvas-large">
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    fitView
                    minZoom={0.5}
                    maxZoom={1.5}
                  >
                    <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#2b3648" />
                    <Controls />
                    <MiniMap
                      nodeColor={(n) => {
                        if (n.data?.tone === 'violet') return '#8f7cff'
                        if (n.data?.tone === 'lime') return '#a5f56a'
                        if (n.data?.tone === 'amber') return '#ffc766'
                        return '#53d7ff'
                      }}
                      maskColor="rgba(8, 11, 17, 0.85)"
                      style={{ background: '#0d131f', borderRadius: 8, border: '1px solid #232d3d' }}
                    />
                  </ReactFlow>
                </div>

                {/* Inspection Drawer */}
                <aside className="stage-inspector-drawer">
                  <div className="inspector-head">
                    <Sparkles size={16} />
                    <h3>Stage Inspector</h3>
                    {selectedNodeStage && (
                      <button onClick={() => setSelectedNodeStage(null)}>
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  {!selectedNodeStage ? (
                    <div className="inspector-placeholder">
                      <TerminalSquare size={28} />
                      <p>Click any node in the React Flow canvas to inspect its real-time payload, telemetry, and contract.</p>
                    </div>
                  ) : (
                    <div className="inspector-content">
                      <StageDetail
                        stageId={selectedNodeStage}
                        answer={answer}
                        question={question}
                        status={status}
                      />
                    </div>
                  )}
                </aside>
              </div>
            </div>
          )}

          {/* VIEW 3: AUDIT HISTORY */}
          {activeView === 'history' && (
            <div className="history-view">
              <div className="view-banner">
                <div>
                  <h2>Provenance & Query Run History</h2>
                  <p>
                    Immutable trace of every question, compiled query, and Snowflake Query ID
                    executed in this workspace.
                  </p>
                </div>
                <div className="view-banner-actions">
                  <button
                    className="action-btn"
                    onClick={() => {
                      const data = JSON.stringify(history, null, 2)
                      const blob = new Blob([data], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `datamind_audit_history.json`
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                  >
                    <Download size={14} /> Export Audit JSON
                  </button>
                </div>
              </div>

              <div className="history-table-card">
                <table>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Question</th>
                      <th>Snowflake Query ID</th>
                      <th>Latency</th>
                      <th>Rows</th>
                      <th>Warehouse</th>
                      <th>Timestamp</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span className={`status-pill ${item.status}`}>
                            {item.status === 'verified' && <Check size={11} />}
                            {item.status === 'blocked' && <ShieldAlert size={11} />}
                            {item.status}
                          </span>
                        </td>
                        <td className="question-col">
                          <strong>{item.question}</strong>
                        </td>
                        <td>
                          <code className="query-id-code">
                            {item.query_id}
                          </code>
                        </td>
                        <td>{item.elapsed_ms} ms</td>
                        <td>{item.rows_count}</td>
                        <td>{item.warehouse}</td>
                        <td>{new Date(item.timestamp).toLocaleTimeString()}</td>
                        <td>
                          <button
                            className="inspect-history-btn"
                            onClick={() => loadFromHistory(item)}
                          >
                            <Play size={12} /> Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 4: SEMANTIC MODEL EXPLORER */}
          {activeView === 'models' && (
            <div className="models-view">
              <div className="view-banner">
                <div>
                  <h2>Semantic Catalog & Dataset Architecture</h2>
                  <p>
                    Dimensions, metrics, joins, and table definitions allowlisted for the
                    compiler. Add custom business schemas without modifying backend code.
                  </p>
                </div>
                <div className="view-banner-actions">
                  <button className="primary-action-btn" onClick={() => setCustomModalOpen(true)}>
                    <Plus size={14} /> Add Dataset
                  </button>
                </div>
              </div>

              {/* Dataset cards row */}
              <div className="datasets-grid">
                {datasets.map((d) => (
                  <div
                    key={d.id}
                    className={`dataset-card ${d.id === activeDatasetId ? 'active' : ''}`}
                    onClick={() => handleDatasetSelect(d.id)}
                  >
                    <div className="dataset-card-top">
                      <span className="dataset-badge">
                        <Database size={13} /> {d.id}
                      </span>
                      {d.id === activeDatasetId && (
                        <span className="active-pill">
                          <Check size={11} /> Active
                        </span>
                      )}
                    </div>
                    <h4>{d.name.toUpperCase()}</h4>
                    <p>{d.description}</p>
                    <div className="dataset-stats">
                      <span>{d.table_count} tables</span>
                      <span>{d.dimension_count} dimensions</span>
                      <span>{d.metric_count} metrics</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Detailed Tables & Dimensions View */}
              {semanticModel && (
                <div className="model-details-section">
                  <div className="details-card">
                    <div className="details-header">
                      <h3>Allowlisted Tables ({semanticModel.tables.length})</h3>
                      <small>
                        Target: {semanticModel.database}.{semanticModel.schema}
                      </small>
                    </div>
                    <div className="table-list-grid">
                      {semanticModel.tables.map((t) => (
                        <div className="table-item" key={t.name}>
                          <strong>{t.name}</strong>
                          <small>Physical: {t.physical}</small>
                          <p>{t.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="details-card">
                    <div className="details-header">
                      <h3>Dimensions & Metrics</h3>
                    </div>
                    <div className="fields-split-grid">
                      <div>
                        <h4>Dimensions ({semanticModel.dimensions.length})</h4>
                        <div className="field-list">
                          {semanticModel.dimensions.map((d) => (
                            <div className="field-item" key={d.name}>
                              <code>{d.name}</code>
                              <span>{d.description}</span>
                              <small>Table: {d.table}</small>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4>Metrics ({semanticModel.metrics.length})</h4>
                        <div className="field-list">
                          {semanticModel.metrics.map((m) => (
                            <div className="field-item" key={m.name}>
                              <code>{m.name}</code>
                              <span>{m.description}</span>
                              <small>Expr: {m.expression}</small>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 5: EVALS */}
          {activeView === 'evals' && (
            <div className="evals-view">
              <div className="view-banner">
                <div>
                  <h2>ZeroDay Hackathon Evaluation Suite</h2>
                  <p>
                    Live test matrix covering multi-table joins, aggregations, time-series,
                    safety injection blocking, and ambiguity handling for judges.
                  </p>
                </div>
                <div className="view-banner-actions">
                  <button
                    className="primary-action-btn"
                    onClick={handleRunAllEvals}
                    disabled={evalRunning !== null}
                  >
                    {evalRunning ? <Loader2 size={14} className="spin" /> : <Play size={14} />}
                    Run All 7 Benchmarks
                  </button>
                </div>
              </div>

              <div className="evals-table-card">
                <table>
                  <thead>
                    <tr>
                      <th>Test ID</th>
                      <th>Category</th>
                      <th>Question / Challenge</th>
                      <th>Expected Criteria</th>
                      <th>Status</th>
                      <th>Query ID / Proof</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evalList.map((ec) => {
                      const res = evalResults[ec.id]
                      return (
                        <tr key={ec.id}>
                          <td>
                            <code>{ec.id}</code>
                          </td>
                          <td>
                            <span className="category-pill">{ec.category}</span>
                          </td>
                          <td className="eval-question-cell">
                            <strong>{ec.question}</strong>
                            <p>{ec.description}</p>
                          </td>
                          <td className="eval-criteria-cell">
                            <small>{ec.criteria}</small>
                          </td>
                          <td>
                            {res ? (
                              <span className={`status-pill ${res.status}`}>
                                {res.passed ? <Check size={11} /> : <AlertTriangle size={11} />}
                                {res.status}
                              </span>
                            ) : ec.sample_query_id ? (
                              <span className="status-pill verified">
                                <Check size={11} /> pre-verified
                              </span>
                            ) : (
                              <span className="status-pill idle">ready</span>
                            )}
                          </td>
                          <td>
                            <code className="query-id-code">
                              {res?.query_id || ec.sample_query_id || '—'}
                            </code>
                          </td>
                          <td>
                            <button
                              className="run-single-eval-btn"
                              onClick={() => handleRunEval(ec)}
                              disabled={evalRunning === ec.id}
                            >
                              {evalRunning === ec.id ? (
                                <Loader2 size={12} className="spin" />
                              ) : (
                                <Play size={12} />
                              )}
                              Run Test
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
      </main>

      {/* CUSTOM DATASET MODAL */}
      <AnimatePresence>
        {customModalOpen && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="modal-dialog">
              <div className="modal-header">
                <div className="modal-title">
                  <Database size={18} />
                  <h3>Register Custom Semantic Dataset</h3>
                </div>
                <button
                  className="icon-button"
                  onClick={() => setCustomModalOpen(false)}
                  aria-label="Close"
                >
                  <X size={17} />
                </button>
              </div>
              <form onSubmit={handleCreateCustomDataset}>
                <div className="modal-body">
                  <p>
                    Define your custom database, schema, tables, joins, dimensions, and
                    metrics in YAML format. The system will compile and activate it instantly.
                  </p>
                  {customError && <div className="modal-error">{customError}</div>}
                  <textarea
                    rows={15}
                    value={customYaml}
                    onChange={(e) => setCustomYaml(e.target.value)}
                    className="yaml-editor"
                    spellCheck={false}
                  />
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setCustomModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="primary-action-btn">
                    Validate & Activate Dataset
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function EmptyResult({ onSelectQuestion }: { onSelectQuestion: (q: string) => void }) {
  return (
    <div className="empty-result">
      <div className="empty-orbit">
        <TerminalSquare size={24} />
      </div>
      <strong>No black boxes. Pure verified intelligence.</strong>
      <p>
        Submit a natural language question or click any suggested prompt to trace the entire
        reasoning pipeline from Gemma 4 planning to live Snowflake query execution.
      </p>
      <div className="empty-quick-prompts">
        <button onClick={() => onSelectQuestion('Which five customer nations generated the most revenue in 1995?')}>
          Top 5 Customer Nations in 1995
        </button>
        <button onClick={() => onSelectQuestion('How many orders did each market segment place?')}>
          Market Segment Order Breakdown
        </button>
      </div>
    </div>
  )
}

function StageDetail({
  stageId,
  answer,
  question,
  status,
}: {
  stageId: string
  answer: Answer | null
  question: string
  status: Status | null
}) {
  switch (stageId) {
    case 'question':
      return (
        <div className="stage-detail-card">
          <h4>01. Natural Language Intent</h4>
          <p>The user prompt is received without preprocessing or local cache matching.</p>
          <div className="inspector-field">
            <label>Raw Question:</label>
            <div className="code-box">{answer?.question || question || 'None'}</div>
          </div>
          <div className="inspector-field">
            <label>Target Dataset:</label>
            <div className="code-box">{answer?.plan.dataset || 'tpch'}</div>
          </div>
        </div>
      )
    case 'gemma':
      return (
        <div className="stage-detail-card">
          <h4>02. Google Gemma 4 Semantic Planner</h4>
          <p>
            Gemma maps natural language into a strict JSON-schema QueryPlan contract. Gemma
            is forbidden from writing SQL directly.
          </p>
          <div className="inspector-field">
            <label>Model Runtime:</label>
            <div className="code-box">{status?.gemma.model || 'gemma4:e4b'} (GPU Metal)</div>
          </div>
          <div className="inspector-field">
            <label>Planned QueryPlan Output:</label>
            <pre className="code-box">
              <code>{answer ? JSON.stringify(answer.plan, null, 2) : 'Awaiting query plan…'}</code>
            </pre>
          </div>
        </div>
      )
    case 'guard':
      return (
        <div className="stage-detail-card">
          <h4>03. Deterministic Safety & Policy Gate</h4>
          <p>
            Strict boundary verification. Validates read-only assertions, blocks DDL (DROP,
            UPDATE, INSERT), and enforces table allowlists.
          </p>
          <div className="inspector-field">
            <label>Policy Enforcements:</label>
            <ul className="bullet-list">
              <li>Exactly one SELECT statement</li>
              <li>Forbidden: DROP, INSERT, ALTER, DELETE, MERGE</li>
              <li>Only allowlisted semantic tables can be queried</li>
            </ul>
          </div>
          <div className="inspector-field">
            <label>Allowlisted Tables:</label>
            <div className="code-box">LINEITEM, ORDERS, CUSTOMER, NATION, REGION, SUPPLIER, PART</div>
          </div>
        </div>
      )
    case 'compiler':
      return (
        <div className="stage-detail-card">
          <h4>04. SQL Compiler & Parameterizer</h4>
          <p>
            Deterministic Python compiler generates the exact Snowflake SQL AST and binds
            all filter values as parameters.
          </p>
          <div className="inspector-field">
            <label>Generated Statement:</label>
            <pre className="code-box">
              <code>{answer?.query.sql || 'Awaiting compiled SQL…'}</code>
            </pre>
          </div>
        </div>
      )
    case 'snowflake':
      return (
        <div className="stage-detail-card">
          <h4>05. Snowflake Live Execution</h4>
          <p>
            Query sent to Snowflake via SQL API using Programmatic Access Tokens. Zero
            fixtures or cached rows used.
          </p>
          <div className="inspector-field">
            <label>Query ID:</label>
            <div className="code-box">{answer?.result.query_id || '—'}</div>
          </div>
          <div className="inspector-field">
            <label>Warehouse & Role:</label>
            <div className="code-box">
              {answer?.result.warehouse || 'DATAMIND_WH'} · {answer?.result.role || 'DATAMIND_READER'}
            </div>
          </div>
          <div className="inspector-field">
            <label>Execution Latency:</label>
            <div className="code-box">{answer?.result.elapsed_ms ?? '—'} ms</div>
          </div>
        </div>
      )
    case 'evidence':
      return (
        <div className="stage-detail-card">
          <h4>06. Evidence Ledger & Provenance</h4>
          <p>
            Row-level lineage mapped directly to claims. Judges can verify which exact row
            and column supported every statement.
          </p>
          <div className="inspector-field">
            <label>Rows Returned:</label>
            <div className="code-box">{answer?.result.rows.length ?? 0} rows</div>
          </div>
          <div className="inspector-field">
            <label>Verified Claims:</label>
            <div className="code-box">
              {answer?.claims?.length ? `${answer.claims.length} claims verified against rows` : 'Grounded'}
            </div>
          </div>
        </div>
      )
    case 'answer':
      return (
        <div className="stage-detail-card">
          <h4>07. Grounded Output Envelope</h4>
          <p>
            The final answer envelope containing question, plan, query, result rows, query
            ID, and Gemma explanation.
          </p>
          <div className="inspector-field">
            <label>Headline Summary:</label>
            <div className="code-box">{answer?.summary || '—'}</div>
          </div>
        </div>
      )
    default:
      return null
  }
}
