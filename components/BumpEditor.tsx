"use client"

import { ChangeEvent } from 'react'
import clsx from 'clsx'
import { BUMP_POSITIONS, HIGHLIGHT_COLORS } from '@/lib/validation'

export interface BumpFormState {
  id?: string
  title: string
  description: string
  priceLabel: string
  planId: string
  badge?: string
  highlightColor?: (typeof HIGHLIGHT_COLORS)[number]
  position: (typeof BUMP_POSITIONS)[number]
  defaultSelected: boolean
  sortIndex: number
}

interface Props {
  index: number
  total: number
  bump: BumpFormState
  errors: Record<string, string>
  onChange: (updates: Partial<BumpFormState>) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  disableRemove: boolean
  onSelectDefault: () => void
}

export function BumpEditor({
  index,
  total,
  bump,
  errors,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  disableRemove,
  onSelectDefault,
}: Props) {
  const handleInput = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = event.currentTarget
    const { name, value } = target

    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      onChange({ [name]: target.checked } as Partial<BumpFormState>)
    } else {
      onChange({ [name]: value } as Partial<BumpFormState>)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm shadow-slate-900/10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">
          Bump {index + 1}
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-600 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Move bump up"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-600 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Move bump down"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={disableRemove}
            className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-sm text-rose-600 hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Title</span>
          <input
            name="title"
            value={bump.title}
            onChange={handleInput}
            className={clsx(
              'w-full rounded-lg border px-3 py-2 text-sm outline-none transition',
              errors.title ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-400'
            )}
            maxLength={80}
          />
          {errors.title ? <span className="text-xs text-rose-500">{errors.title}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Price label</span>
          <input
            name="priceLabel"
            value={bump.priceLabel}
            onChange={handleInput}
            className={clsx(
              'w-full rounded-lg border px-3 py-2 text-sm outline-none transition',
              errors.priceLabel ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-400'
            )}
            maxLength={80}
          />
          {errors.priceLabel ? <span className="text-xs text-rose-500">{errors.priceLabel}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm md:col-span-2">
          <span className="font-medium text-slate-700">Description</span>
          <textarea
            name="description"
            value={bump.description}
            onChange={handleInput}
            className={clsx(
              'w-full min-h-[80px] rounded-lg border px-3 py-2 text-sm outline-none transition',
              errors.description
                ? 'border-rose-400 focus:border-rose-500'
                : 'border-slate-200 focus:border-slate-400'
            )}
            maxLength={240}
          />
          {errors.description ? <span className="text-xs text-rose-500">{errors.description}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Whop plan ID</span>
          <input
            name="planId"
            value={bump.planId}
            onChange={handleInput}
            className={clsx(
              'w-full rounded-lg border px-3 py-2 text-sm outline-none transition',
              errors.planId ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-400'
            )}
            placeholder="plan_..."
          />
          {errors.planId ? <span className="text-xs text-rose-500">{errors.planId}</span> : null}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Badge (optional)</span>
          <input
            name="badge"
            value={bump.badge ?? ''}
            onChange={handleInput}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
            maxLength={40}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Highlight color</span>
          <select
            name="highlightColor"
            value={bump.highlightColor ?? ''}
            onChange={handleInput}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
          >
            <option value="">None</option>
            {HIGHLIGHT_COLORS.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Position</span>
          <select
            name="position"
            value={bump.position}
            onChange={handleInput}
            className={clsx(
              'w-full rounded-lg border px-3 py-2 text-sm outline-none transition',
              errors.position ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-400'
            )}
          >
            {BUMP_POSITIONS.map((position) => (
              <option key={position} value={position}>
                {position.charAt(0).toUpperCase() + position.slice(1)}
              </option>
            ))}
          </select>
          {errors.position ? <span className="text-xs text-rose-500">{errors.position}</span> : null}
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="defaultSelected"
            checked={bump.defaultSelected}
            onChange={onSelectDefault}
            className="h-4 w-4 accent-slate-900"
          />
          <span className="font-medium text-slate-700">Select by default</span>
        </label>
        <span className="text-xs text-slate-500">Buyers can switch to any other bump on the page.</span>
      </div>
    </div>
  )
}
