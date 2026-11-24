
import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Languages,
  Megaphone,
} from 'lucide-react'

type TulMovement = {
  id: number
  tul_id: number
  movement_number: number
  stance: string | null
  technique: string
  technique_original: string | null
  direction: string | null
  execution: string | null
  execution_original: string | null
  kihap: boolean
  notes: string | null
}

type Props = {
  tulId: number
  tulName: string
  expectedMovements: number
  movements: TulMovement[]
}

type Language = 'ca' | 'en'

const STORAGE_PREFIX = 'itf-hub:academy-progress:v1:'

function getStoredProgress(tulId: number): number[] {
  try {
    const value = localStorage.getItem(
      `${STORAGE_PREFIX}${tulId}`,
    )

    if (!value) return []

    const parsed: unknown = JSON.parse(value)

    if (!Array.isArray(parsed)) return []

    return parsed.filter(
      (number): number is number =>
        typeof number === 'number' &&
        Number.isInteger(number) &&
        number > 0,
    )
  } catch {
    return []
  }
}

function isPending(value: string | null): boolean {
  if (!value?.trim()) return true

  return /pendent|pending translation|per traduir/i.test(value)
}

function DirectionDiagram({
  direction,
}: {
  direction: string | null
}) {
  const active = direction?.trim().toUpperCase() ?? ''

  const positions = [
    { label: 'D', x: 100, y: 18 },
    { label: 'C', x: 100, y: 190 },
    { label: 'B', x: 18, y: 105 },
    { label: 'A', x: 182, y: 105 },
  ]

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
      <p className="mb-2 text-center text-xs font-semibold text-slate-400">
        Direcció del moviment
      </p>

      <svg
        viewBox="0 0 200 205"
        role="img"
        aria-label={`Diagrama de direccions. Direcció actual: ${
          active || 'no indicada'
        }`}
        className="mx-auto h-auto w-full max-w-44"
      >
        <path
          d="M100 32 V175 M32 102 H168"
          stroke="#ef4444"
          strokeWidth="7"
          strokeLinecap="round"
        />

        <circle cx="100" cy="102" r="7" fill="#f8fafc" />

        {positions.map((item) => (
          <text
            key={item.label}
            x={item.x}
            y={item.y}
            textAnchor="middle"
            fontSize={active === item.label ? 22 : 15}
            fontWeight="bold"
            fill={
              active === item.label ? '#fb7185' : '#94a3b8'
            }
          >
            {item.label}
          </text>
        ))}
      </svg>

      <p className="mt-1 text-center text-xs text-slate-400">
        {active && ['A', 'B', 'C', 'D'].includes(active)
          ? `Direcció ${active}`
          : 'Direcció no disponible'}
      </p>
    </div>
  )
}

export default function AcademyStudy({
  tulId,
  tulName,
  expectedMovements,
  movements,
}: Props) {
  const [index, setIndex] = useState(0)
  const [language, setLanguage] = useState<Language>('ca')
  const [completed, setCompleted] = useState<number[]>(
    () => getStoredProgress(tulId),
  )
  const [storageError, setStorageError] = useState(false)
  const [autoAdvance, setAutoAdvance] = useState(false)
  const [memoryMode, setMemoryMode] = useState(false)
const [showAnswer, setShowAnswer] = useState(false)
  const orderedMovements = useMemo(
    () =>
      [...movements].sort(
        (a, b) => a.movement_number - b.movement_number,
      ),
    [movements],
  )

  const current = orderedMovements[index] ?? null

  const completedSet = useMemo(
    () => new Set(completed),
    [completed],
  )

  const completedCount = orderedMovements.filter((movement) =>
    completedSet.has(movement.movement_number),
  ).length

  const percentage =
    expectedMovements > 0
      ? Math.round(
          (completedCount / expectedMovements) * 100,
        )
      : 0

  const isCompleted = current
    ? completedSet.has(current.movement_number)
    : false

  useEffect(() => {
    setIndex(0)
  }, [tulId])
  useEffect(() => {
  setShowAnswer(false)
}, [index])

  // Navegació amb les fletxes del teclat
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // No interferim amb inputs, desplegables
      // ni elements editables.
      const target = event.target

      if (target instanceof HTMLElement) {
        const tag = target.tagName.toLowerCase()

        if (
          ['input', 'textarea', 'select'].includes(tag) ||
          target.isContentEditable
        ) {
          return
        }
      }

      if (event.altKey || event.ctrlKey || event.metaKey) {
        return
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()

        setIndex((previous) =>
          Math.min(
            orderedMovements.length - 1,
            previous + 1,
          ),
        )
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()

        setIndex((previous) =>
          Math.max(0, previous - 1),
        )
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [orderedMovements.length])


  
function toggleCompleted() {
  if (!current) return

  const number = current.movement_number
  const next = new Set(completed)

  // Comprovem si ja estava dominat.
  const wasCompleted = next.has(number)

  if (wasCompleted) {
    next.delete(number)
  } else {
    next.add(number)
  }

  const updated = [...next].sort((a, b) => a - b)

  // Guardem el progrés al navegador.
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${tulId}`,
      JSON.stringify(updated),
    )

    setStorageError(false)
  } catch {
    setStorageError(true)
  }

  setCompleted(updated)

  // Avancem només quan el moviment s'acaba
  // de marcar com a dominat.
  if (
    autoAdvance &&
    !wasCompleted &&
    index < orderedMovements.length - 1
  ) {
    setIndex((previous) => previous + 1)
  }
}


  if (!current) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 text-slate-400">
        Aquest tul encara no té moviments disponibles.
      </div>
    )
  }

  const technique =
    language === 'en'
      ? current.technique_original ||
        current.technique ||
        'Tècnica no disponible'
      : isPending(current.technique)
        ? 'Traducció catalana pendent'
        : current.technique

  const execution =
    language === 'en'
      ? current.execution_original || current.execution
      : isPending(current.execution)
        ? null
        : current.execution

  return (
    <section className="space-y-4 rounded-2xl border border-slate-700 bg-slate-800 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-white">
            {tulName} — Mode estudi
          </h3>

<label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-3">
  <div>
    <p className="text-sm font-semibold text-white">
      Mode memorització
    </p>

    <p className="text-xs text-slate-400">
      Oculta les tècniques per practicar de memòria.
    </p>
  </div>

  <input
    type="checkbox"
    checked={memoryMode}
    onChange={(event) => {
      setMemoryMode(event.target.checked)
      setShowAnswer(false)
    }}
    className="h-5 w-5 accent-red-500"
  />
</label>


          
<div className="flex flex-wrap items-center gap-3">
  <label
    htmlFor="study-movement-selector"
    className="text-sm text-slate-400"
  >
    Moviment:
  </label>

  <select
    id="study-movement-selector"
    value={index}
    onChange={(event) =>
      setIndex(Number(event.target.value))
    }
    className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-red-500"
  >
    {orderedMovements.map((movement, movementIndex) => (
      <option
        key={movement.id}
        value={movementIndex}
      >
        {movement.movement_number} de {orderedMovements.length}
      </option>
    ))}
  </select>
</div>

        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <Languages size={17} />

          <select
            value={language}
            onChange={(event) =>
              setLanguage(event.target.value as Language)
            }
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white"
          >
            <option value="ca">Català</option>
            <option value="en">Anglès original</option>
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">
          {completedCount} de {expectedMovements} dominats
        </span>

        <span className="font-semibold text-emerald-400">
          {percentage}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-700">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-[210px_1fr]">
        <DirectionDiagram direction={current.direction} />

        <div className="flex flex-col justify-center space-y-4 rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-red-500/10 px-3 py-2 text-lg font-bold text-red-400">
              {current.movement_number}
            </span>

            {current.kihap && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-300">
                <Megaphone size={14} />
                KI-HAP
              </span>
            )}
          </div>

          
{!memoryMode || showAnswer ? (
  <>
    <h4 className="text-lg font-semibold leading-relaxed text-white">
      {technique}
    </h4>

    {current.stance && (
      <p className="text-sm text-blue-300">
        Posició: {current.stance}
      </p>
    )}

    {execution && (
      <p className="whitespace-pre-line text-sm leading-7 text-slate-300">
        {execution}
      </p>
    )}

    {current.notes && (
      <p className="text-xs leading-6 text-slate-400">
        Observacions: {current.notes}
      </p>
    )}
  </>
) : (
  <div className="space-y-3 rounded-xl border border-dashed border-slate-600 bg-slate-900/60 p-5 text-center">
    <p className="text-lg font-semibold text-white">
      Recordes aquest moviment?
    </p>

    <p className="text-sm text-slate-400">
      Intenta recordar la posició, la tècnica
      i l'execució abans de revelar la resposta.
    </p>

    <button
      type="button"
      onClick={() => setShowAnswer(true)}
      className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-500"
    >
      Mostrar resposta
    </button>
  </div>
)}


          {current.stance && (
            <p className="text-sm text-blue-300">
              Posició: {current.stance}
            </p>
          )}

          {execution && (
            <p className="whitespace-pre-line text-sm leading-7 text-slate-300">
              {execution}
            </p>
          )}

          {current.notes && (
            <p className="text-xs leading-6 text-slate-400">
              Observacions: {current.notes}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={toggleCompleted}
        aria-pressed={isCompleted}
        className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 font-semibold transition ${
          isCompleted
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
            : 'border-red-500 bg-red-600 text-white hover:bg-red-500'
        }`}
      >
        {isCompleted ? (
          <>
            <CheckCircle2 size={20} />
            Moviment dominat — Desmarcar
          </>
        ) : (
          <>
            <Circle size={20} />
            Marcar com a dominat
          </>
        )}
      </button>
      
<label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-3">
  <div>
    <p className="text-sm font-medium text-white">
      Avanç automàtic
    </p>

    <p className="text-xs text-slate-400">
      Passa al moviment següent quan el marques
      com a dominat.
    </p>
  </div>

  <input
    type="checkbox"
    checked={autoAdvance}
    onChange={(event) =>
      setAutoAdvance(event.target.checked)
    }
    className="h-5 w-5 accent-red-500"
  />
</label>
    
      {storageError && (
        <p className="text-sm text-amber-300">
          No s'ha pogut desar el progrés al navegador.
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={index === 0}
          onClick={() =>
            setIndex((value) => Math.max(0, value - 1))
          }
          className="inline-flex items-center gap-1 rounded-xl border border-slate-600 px-4 py-2.5 text-sm text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={18} />
          Anterior
        </button>

        <span className="text-sm text-slate-400">
          {index + 1} / {orderedMovements.length}
        </span>

        <button
          type="button"
          disabled={index === orderedMovements.length - 1}
          onClick={() =>
            setIndex((value) =>
              Math.min(
                orderedMovements.length - 1,
                value + 1,
              ),
            )
          }
          className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Següent
          <ChevronRight size={18} />
        </button>
      </div>

      <p className="text-center text-xs text-slate-500">
        Diagrama esquemàtic de referència A/B/C/D.
        No representa la trajectòria exacta dels peus.
      </p>
    </section>
  )
}
