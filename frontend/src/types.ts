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
  }
  claims?: Claim[]
  limitations: string[]
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
