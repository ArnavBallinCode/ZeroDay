export type Status = {
  status: string
  snowflake: { ready: boolean; warehouse: string; dataset: string }
  gemma: { ready: boolean; model: string }
  semantic_model: {
    id: string
    name: string
    description: string
    dimensions: number
    metrics: number
    tables: number
    database: string
    schema: string
  }
}

export type QueryPlan = {
  dataset: string
  dimensions: string[]
  metrics: string[]
  filters: Array<{ field: string; operator: string; value: unknown }>
  sort: Array<{ field: string; direction: string }>
  limit: number
  assumptions: string[]
  clarification?: string | null
}

export type Claim = {
  text: string
  row_indexes: number[]
  columns: string[]
}

export type SentenceGrounding = {
  sentence: string
  grounded: boolean
  matched_values: string[]
  matched_row_indexes: number[]
}

export type Answer = {
  question: string
  summary: string
  explanation: string
  plan: QueryPlan
  query: {
    sql: string
    parameters: unknown[]
    tables: string[]
    selected_fields: string[]
  }
  result: {
    query_id: string
    columns: string[]
    rows: unknown[][]
    elapsed_ms: number
    warehouse: string
    role?: string
    executed_at?: string
    bytes_scanned?: number
    partitions_scanned?: number
    credits_used?: number
    cache_hit?: boolean
  }
  claims?: Claim[]
  sentence_grounding?: SentenceGrounding[]
  limitations: string[]
}

export type MutationProofResult = {
  mode: string
  table: string
  question: string
  initial_value: number
  initial_metric?: number
  initial_query_id: string
  initial_window?: string
  mutation_event: string
  mutation_query_id?: string
  mutated_value: number
  mutated_metric?: number
  mutated_query_id: string
  mutated_window?: string
  delta: number
  metric_delta?: number
  verified: boolean
  timestamp: number
}

export type BenchmarkItemResult = {
  id: string
  question: string
  category: string
  status: 'passed' | 'failed' | 'warning'
  passed: boolean
  query_id?: string
  rows_count?: number
  summary?: string
  tables?: string[]
  elapsed_ms: number
  credits_used?: number
  reason: string
}

export type BenchmarkSuiteResult = {
  total_cases: number
  passed_cases: number
  failed_cases: number
  accuracy_percent: number
  total_elapsed_ms: number
  avg_latency_ms: number
  category_summary: Record<string, { total: number; passed: number }>
  results: BenchmarkItemResult[]
}

export type DatasetMeta = {
  id: string
  name: string
  description: string
  database: string
  schema: string
  table_count: number
  dimension_count: number
  metric_count: number
  is_active: boolean
}

export type TableSpec = {
  name: string
  physical: string
  description: string
}

export type JoinSpec = {
  from: string
  to: string
  on: string
}

export type DimensionSpec = {
  name: string
  table: string
  expression: string
  description: string
}

export type MetricSpec = {
  name: string
  table: string
  expression: string
  description: string
}

export type SemanticModelFull = {
  id: string
  name: string
  description: string
  database: string
  schema: string
  tables: TableSpec[]
  joins: JoinSpec[]
  dimensions: DimensionSpec[]
  metrics: MetricSpec[]
  examples: Array<{
    question: string
    dimensions?: string[]
    metrics?: string[]
    filters?: Array<{ field: string; operator: string; value: unknown }>
    sort?: Array<{ field: string; direction: string }>
    limit?: number
  }>
}

export type EvalCase = {
  id: string
  category: string
  question: string
  description: string
  expected_tables: string[]
  criteria: string
  sample_query_id?: string | null
}

export type EvalResult = {
  id: string
  status: 'passed' | 'failed' | 'warning' | 'clarification'
  passed: boolean
  query_id?: string
  elapsed_ms?: number
  rows_count?: number
  summary?: string
  tables?: string[]
  sql?: string
  reason?: string
}

export type RunHistoryItem = {
  id: string
  timestamp: string
  question: string
  status: 'verified' | 'clarification' | 'blocked'
  dataset: string
  query_id: string
  elapsed_ms: number
  rows_count: number
  warehouse: string
  answer?: Answer
}

export type PipelineStep = {
  id: string
  name: string
  detail: string
  status: 'pending' | 'active' | 'done' | 'error'
  elapsed_ms?: number
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  answer?: Answer
  status?: 'pending' | 'completed' | 'error'
  steps?: PipelineStep[]
  error?: string
}

export type EngineSettings = {
  gemma: {
    model: string
    temperature: number
    timeout: number
    keep_alive: string
    ready: boolean
  }
  snowflake: {
    warehouse: string
    role: string
    statement_timeout: number
    max_rows: number
    query_tag: string
    database: string
    schema: string
    ready: boolean
  }
}

export type SnowflakeExplainResult = {
  query_id: string
  elapsed_ms: number
  warehouse: string
  plan_lines: string[]
}
