
import { useMemo, useState } from 'react'
import {
  Check,
  CheckCircle2,
  Circle,
  RotateCcw,
  Target,
} from 'lucide-react'

type Movement = {
  id: number
  movement_number: number
  technique: string
  technique_original: string | null
}

type Props = {
  tulId: number
  tulName: string
  expectedMovements: number
  movements: Movement[]
}

type Filter = 'all' | 'completed' | 'pending'

const STORAGE_PREFIX = 'itf-hub:academy-progress:v1:'

function storageKey(tulId: number): string {
  return `${STORAGE_PREFIX}${tulId}`
}

function loadCompleted(tulId: number): number[] {
  try {
    const raw = localStorage.getItem(storageKey(tulId))
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)

    if (!Array.isArray(parsed)) return []

    return parsed.filter(
      (value): value is number =>
        Number.isInteger(value) && value > 0,
    )
  } catch {
    return []
  }
}

export default function AcademyProgress({
  tulId,
  tulName,
  expectedMovements,
  movements,
}: Props) {
  const [completed, setCompleted] = useState<number[]>(
    () => loadCompleted(tulId),
  )

  const [filter, setFilter] = useState<Filter>('all')
  const [storageError, setStorageError] = useState(false)

  const validNumbers = useMemo(
    () => new Set(movements.map((m) => m.movement_number)),
    [movements],
  )

  const completedSet = useMemo(
    () => new Set(completed),
    [completed],
  )

  const completedCount = movements.filter((movement) =>
    completedSet.has(movement.movement_number),
  ).length

  const percentage =
    expectedMovements > 0
      ? Math.min(
          100,
          Math.round(
            (completedCount / expectedMovements) * 100,
          ),
        )
      : 0

  const visibleMovements = movements.filter((movement) => {
    const isCompleted = completedSet.has(
      movement.movement_number,
    )

    if (filter === 'completed') return isCompleted
    if (filter === 'pending') return !isCompleted

    return true
  })

  function saveCompleted(next: number[]) {
    try {
      localStorage.setItem(
        storageKey(tulId),
        JSON.stringify(next),
      )
      setStorageError(false)
    } catch {
      setStorageError(true)
    }

    setCompleted(next)
  }

  function toggleMovement(number: number) {
    if (!validNumbers.has(number)) return

    const next = new Set(completed)

    if (next.has(number)) {
      next.delete(number)
    } else {
      next.add(number)
    }

    saveCompleted([...next].sort((a, b) => a - b))
  }

  function resetProgress() {
    const confirmed = window.confirm(
      `Vols reiniciar el progrés de ${tulName}?`,
    )

    if (confirmed) {
      saveCompleted([])
    }
  }

  return (
    <section className="space-y-5 rounded-2xl border border-slate-700 bg-slate-800 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Target className="text-red-400" size={22} />

            <h3 className="text-xl font-bold text-white">
              El meu progrés
            </h3>
          </div>

          <p className="text-sm text-slate-400">
            Marca els moviments que domines de {tulName}.
          </p>
        </div>

        <div className="text-right">
          <p className="text-3xl font-bold text-red-400">
            {percentage}%
          </p>

          <p className="text-xs text-slate-400">
            {completedCount} de {expectedMovements}
          </p>
        </div>
      </div>

      <div
        role="progressbar"
        aria-label={`Progrés de ${tulName}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        className="h-3 overflow-hidden rounded-full bg-slate-700"
      >
        <div
          className="h-full rounded-full bg-red-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {percentage === 100 && expectedMovements > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          <CheckCircle2 size={18} />
          Has marcat tots els moviments com a dominats!
        </div>
      )}

      {storageError && (
        <p className="text-sm text-amber-300">
          No s'ha pogut desar el progrés al navegador.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['all', 'Tots'],
            ['pending', 'Pendents'],
            ['completed', 'Dominats'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
              filter === value
                ? 'border-red-500 bg-red-600 text-white'
                : 'border-slate-600 bg-slate-900/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visibleMovements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
          No hi ha moviments en aquest filtre.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleMovements.map((movement) => {
            const isCompleted = completedSet.has(
              movement.movement_number,
            )

            return (
              <button
                key={movement.id}
                type="button"
                onClick={() =>
                  toggleMovement(movement.movement_number)
                }
                aria-pressed={isCompleted}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : 'border-slate-700 bg-slate-900/40 hover:border-slate-500'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {movement.movement_number}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-6 text-white">
                    {movement.technique &&
                    !/pendent|pending/i.test(movement.technique)
                      ? movement.technique
                      : movement.technique_original ||
                        'Tècnica pendent de revisió'}
                  </span>

                  <span
                    className={`mt-2 block text-xs ${
                      isCompleted
                        ? 'text-emerald-300'
                        : 'text-slate-400'
                    }`}
                  >
                    {isCompleted
                      ? 'Moviment dominat'
                      : 'Pendent de practicar'}
                  </span>
                </span>

                {isCompleted ? (
                  <Check
                    size={20}
                    className="shrink-0 text-emerald-400"
                  />
                ) : (
                  <Circle
                    size={20}
                    className="shrink-0 text-slate-500"
                  />
                )}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-700 pt-4">
        <p className="text-xs text-slate-500">
          Progrés desat en aquest navegador.
        </p>

        <button
          type="button"
          onClick={resetProgress}
          disabled={completedCount === 0}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw size={15} />
          Reiniciar progrés
        </button>
      </div>
    </section>
  )
}
