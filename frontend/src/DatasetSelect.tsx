import React, { useState, useRef, useEffect } from 'react'
import {
  Check,
  ChevronDown,
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

  // Close header dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen && variant === 'header') {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, variant])

  // Helper to format clean dataset names
  const getCleanName = (d: DatasetMeta | undefined) => {
    if (!d) return 'TPC-H SF1'
    if (d.id === 'tpch') return 'TPC-H SF1'
    if (d.id === 'tpch_sf10') return 'TPC-H SF10'
    if (d.id === 'ecommerce') return 'E-Commerce'
    return d.name.toUpperCase()
  }

  const getCleanScale = (d: DatasetMeta | undefined) => {
    if (!d) return '1.5M rows'
    if (d.id === 'tpch') return '1.5M rows'
    if (d.id === 'tpch_sf10') return '15M rows'
    if (d.id === 'ecommerce') return 'Retail store'
    return `${d.table_count} tables`
  }

  // 1. COMPACT RAIL MODE VIEW (58px sidebar)
  if (isCollapsed && variant === 'sidebar') {
    return (
      <div className="dataset-rail-view">
        <button
          type="button"
          className="dataset-rail-btn"
          onClick={onOpenModels}
          title={`Active Dataset: ${getCleanName(activeDataset)} (${activeDataset?.table_count ?? 8} tables)`}
          aria-label="Switch Semantic Model"
        >
          <Database size={16} color="var(--accent-primary)" />
          <span className="dataset-active-dot" />
        </button>
      </div>
    )
  }

  // 2. HEADER BAR DROPDOWN VIEW
  if (variant === 'header') {
    return (
      <div className="header-dataset-wrapper" ref={containerRef}>
        <button
          type="button"
          className={`header-dataset-btn ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          title="Switch active Snowflake semantic model"
        >
          <Database size={13} color="var(--accent-primary)" />
          <span className="header-ds-label">{getCleanName(activeDataset)}</span>
          <span className="header-ds-pill">{getCleanScale(activeDataset)}</span>
          <ChevronDown size={12} className={`header-ds-arrow ${isOpen ? 'rotated' : ''}`} />
        </button>

        {isOpen && (
          <div className="header-dropdown-menu">
            <div className="header-menu-top">
              <Sparkles size={12} color="var(--accent-emerald)" />
              <span>Active Snowflake Model</span>
            </div>
            <div className="header-menu-list">
              {datasets.map((d) => {
                const isSelected = d.id === activeDatasetId
                return (
                  <button
                    key={d.id}
                    type="button"
                    className={`header-menu-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onSelect(d.id)
                      setIsOpen(false)
                    }}
                  >
                    <div className="menu-item-check">
                      {isSelected ? <Check size={13} color="var(--accent-emerald)" /> : <span className="menu-empty-dot" />}
                    </div>
                    <div className="menu-item-info">
                      <div className="menu-item-title-row">
                        <span className="menu-item-name">{getCleanName(d)}</span>
                        <span className="menu-item-scale">{getCleanScale(d)}</span>
                      </div>
                      <span className="menu-item-db">{d.schema} · {d.table_count} tables</span>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="header-menu-bottom">
              <button
                type="button"
                className="header-menu-action"
                onClick={() => {
                  setIsOpen(false)
                  onOpenNew()
                }}
              >
                <Plus size={12} />
                <span>+ Custom Model</span>
              </button>
              {onOpenModels && (
                <button
                  type="button"
                  className="header-menu-action link"
                  onClick={() => {
                    setIsOpen(false)
                    onOpenModels()
                  }}
                >
                  Catalog →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // 3. SIDEBAR VIEW: Seamless inline collapsible card (NEVER overflows or clips!)
  return (
    <div className="sidebar-dataset-box" ref={containerRef}>
      {/* Active Selection Trigger Card */}
      <button
        type="button"
        className={`dataset-card-trigger ${isOpen ? 'expanded' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="ds-trigger-left">
          <div className="ds-icon-box">
            <Database size={14} color="var(--accent-primary)" />
          </div>
          <div className="ds-text-col">
            <div className="ds-name-row">
              <span className="ds-name">{getCleanName(activeDataset)}</span>
              <span className="ds-badge">{getCleanScale(activeDataset)}</span>
            </div>
            <span className="ds-sub">{activeDataset?.schema || 'TPCH_SF1'} · {activeDataset?.table_count ?? 8} tables</span>
          </div>
        </div>
        <div className="ds-trigger-right">
          <ChevronsUpDown size={13} className={`ds-chevron ${isOpen ? 'open' : ''}`} />
        </div>
      </button>

      {/* Inline Selection Drawer (seamless, in-flow, never clipped by overflow) */}
      {isOpen && (
        <div className="dataset-inline-drawer">
          <div className="drawer-header">
            <span>SWITCH MODEL</span>
            <span className="drawer-count">{datasets.length} available</span>
          </div>

          <div className="drawer-items">
            {datasets.map((d) => {
              const isSelected = d.id === activeDatasetId
              return (
                <button
                  key={d.id}
                  type="button"
                  className={`drawer-item ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    onSelect(d.id)
                    setIsOpen(false)
                  }}
                >
                  <div className="drawer-item-check">
                    {isSelected ? <Check size={13} color="var(--accent-emerald)" /> : <span className="drawer-empty-dot" />}
                  </div>
                  <div className="drawer-item-body">
                    <div className="drawer-item-title-row">
                      <span className="drawer-item-name">{getCleanName(d)}</span>
                      {isSelected && <span className="drawer-active-tag">Active</span>}
                    </div>
                    <span className="drawer-item-desc">{d.description}</span>
                    <div className="drawer-item-meta">
                      <span>{getCleanScale(d)}</span>
                      <span>·</span>
                      <span>{d.table_count} tables</span>
                      <span>·</span>
                      <span>{d.schema}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="drawer-footer">
            <button
              type="button"
              className="drawer-action-btn"
              onClick={() => {
                setIsOpen(false)
                onOpenNew()
              }}
            >
              <Plus size={12} />
              <span>Add Custom Model…</span>
            </button>
            {onOpenModels && (
              <button
                type="button"
                className="drawer-link-btn"
                onClick={() => {
                  setIsOpen(false)
                  onOpenModels()
                }}
              >
                Manage in Catalog →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
