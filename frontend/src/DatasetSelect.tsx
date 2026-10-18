import React, { useState, useRef, useEffect } from 'react'
import {
  Check,
  ChevronsUpDown,
  Database,
  Layers3,
  Plus,
  Sparkles,
} from 'lucide-react'
import { DatasetMeta } from './types'

interface DatasetSelectProps {
  datasets: DatasetMeta[]
  activeDatasetId: string
  onSelect: (id: string) => void
  onOpenNew: () => void
  onOpenModels?: () => void
  isCollapsed?: boolean
  variant?: 'sidebar' | 'header'
}

export function DatasetSelect({
  datasets,
  activeDatasetId,
  onSelect,
  onOpenNew,
  onOpenModels,
  isCollapsed = false,
  variant = 'sidebar',
}: DatasetSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeDataset = datasets.find((d) => d.id === activeDatasetId) || datasets[0]

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Collapsed rail mode view
  if (isCollapsed && variant === 'sidebar') {
    return (
      <div className="shadcn-dataset-collapsed" ref={containerRef}>
        <button
          type="button"
          className="shadcn-dataset-icon-trigger"
          onClick={() => setIsOpen(!isOpen)}
          title={`Active Dataset: ${activeDataset?.name || 'TPC-H'} (Click to change)`}
          aria-expanded={isOpen}
        >
          <Database size={16} color="var(--accent-primary)" />
          <span className="dataset-dot-indicator" />
        </button>

        {isOpen && (
          <div className="shadcn-dropdown-popover floating-rail-popover">
            <div className="dropdown-popover-header">
              <div className="header-title-row">
                <Layers3 size={13} color="var(--accent-emerald)" />
                <span>SELECT SEMANTIC MODEL</span>
              </div>
              <span className="header-subtitle">Snowflake allowlisted catalog</span>
            </div>

            <div className="dropdown-items-list">
              {datasets.map((d) => {
                const isSelected = d.id === activeDatasetId
                return (
                  <button
                    key={d.id}
                    type="button"
                    className={`shadcn-dropdown-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onSelect(d.id)
                      setIsOpen(false)
                    }}
                  >
                    <div className="item-check">
                      {isSelected ? <Check size={14} color="var(--accent-emerald)" /> : <span className="check-placeholder" />}
                    </div>
                    <div className="item-body">
                      <div className="item-title-row">
                        <span className="item-name">{d.name}</span>
                        {isSelected && <span className="active-tag">Active</span>}
                      </div>
                      <span className="item-desc">{d.description}</span>
                      <div className="item-pills">
                        <span className="mini-pill">{d.table_count} tables</span>
                        <span className="mini-pill">{d.dimension_count} dims</span>
                        <span className="mini-pill db-pill">{d.schema}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="dropdown-popover-footer">
              <button
                type="button"
                className="dropdown-footer-action"
                onClick={() => {
                  setIsOpen(false)
                  onOpenNew()
                }}
              >
                <Plus size={13} />
                <span>Add Custom Semantic Model…</span>
              </button>
              {onOpenModels && (
                <button
                  type="button"
                  className="dropdown-footer-link"
                  onClick={() => {
                    setIsOpen(false)
                    onOpenModels()
                  }}
                >
                  Manage in Models tab →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Expanded sidebar or Header bar trigger
  return (
    <div className={`shadcn-dataset-container ${variant}`} ref={containerRef}>
      <button
        type="button"
        className={`shadcn-dataset-trigger ${isOpen ? 'active-open' : ''} ${variant}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="trigger-left">
          <div className="dataset-badge-icon">
            <Database size={14} color="var(--accent-primary)" />
          </div>
          <div className="trigger-text-col">
            <div className="trigger-title-row">
              <span className="trigger-dataset-name">{activeDataset?.name || 'Dataset'}</span>
              <span className="trigger-count-badge">{activeDataset?.table_count ?? 8} tables</span>
            </div>
            <span className="trigger-subtext">
              {activeDataset?.database ? `${activeDataset.database}.${activeDataset.schema}` : 'Snowflake Engine'}
            </span>
          </div>
        </div>
        <ChevronsUpDown size={14} className="trigger-chevron" />
      </button>

      {isOpen && (
        <div className="shadcn-dropdown-popover">
          <div className="dropdown-popover-header">
            <div className="header-title-row">
              <Sparkles size={13} color="var(--accent-emerald)" />
              <span>SELECT SEMANTIC MODEL</span>
            </div>
            <span className="header-subtitle">Bound to Snowflake warehouse execution</span>
          </div>

          <div className="dropdown-items-list">
            {datasets.map((d) => {
              const isSelected = d.id === activeDatasetId
              return (
                <button
                  key={d.id}
                  type="button"
                  className={`shadcn-dropdown-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onSelect(d.id)
                    setIsOpen(false)
                  }}
                >
                  <div className="item-check">
                    {isSelected ? <Check size={14} color="var(--accent-emerald)" /> : <span className="check-placeholder" />}
                  </div>
                  <div className="item-body">
                    <div className="item-title-row">
                      <span className="item-name">{d.name}</span>
                      {isSelected && <span className="active-tag">Active</span>}
                    </div>
                    <span className="item-desc">{d.description}</span>
                    <div className="item-pills">
                      <span className="mini-pill">{d.table_count} tables</span>
                      <span className="mini-pill">{d.dimension_count} dims</span>
                      <span className="mini-pill">{d.metric_count} metrics</span>
                      <span className="mini-pill db-pill">{d.schema}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="dropdown-popover-footer">
            <button
              type="button"
              className="dropdown-footer-action"
              onClick={() => {
                setIsOpen(false)
                onOpenNew()
              }}
            >
              <Plus size={13} />
              <span>Add Custom Semantic Model…</span>
            </button>
            {onOpenModels && (
              <button
                type="button"
                className="dropdown-footer-link"
                onClick={() => {
                  setIsOpen(false)
                  onOpenModels()
                }}
              >
                Manage in Models tab →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
