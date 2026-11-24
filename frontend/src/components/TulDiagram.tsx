
import { useState } from 'react'
import {
  Info,
  Maximize2,
  Minimize2,
  Route,
} from 'lucide-react'

type TulDiagramProps = {
  tulName: string
  diagram?: string | null
  activeDirection?: string | null
}

type DiagramDefinition = {
  label: string
  description: string
  paths: string[]
}

const DIAGRAMS: Record<string, DiagramDefinition> = {
  'Chon-Ji': {
    label: '十',
    description:
      'Diagrama tradicional de Chon-Ji en forma de creu.',
    paths: [
      'M 150 35 L 150 265',
      'M 35 150 L 265 150',
    ],
  },
}

export default function TulDiagram({
  tulName,
  diagram,
  activeDirection = null,
}: TulDiagramProps) { {
  const [expanded, setExpanded] = useState(false)

  const definition = DIAGRAMS[tulName]
  const highlightedDirection =
  activeDirection?.trim().toUpperCase() ?? null

function directionColor(direction: string): string {
  return highlightedDirection === direction
    ? '#f87171'
    : '#94a3b8'
}
  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-800 p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Route className="text-red-400" size={22} />

          <div>
            <h3 className="text-lg font-bold text-white">
              Diagrama del tul
            </h3>

            <p className="text-sm text-slate-400">
              {tulName}
            </p>
          </div>
        </div>

        {definition && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-700"
          >
            {expanded ? (
              <Minimize2 size={16} />
            ) : (
              <Maximize2 size={16} />
            )}

            {expanded ? 'Reduir' : 'Ampliar'}
          </button>
        )}
      </div>

      {definition ? (
        <div className="space-y-4">
          <div
            className={`mx-auto flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900/60 p-4 transition-all ${
              expanded ? 'max-w-2xl' : 'max-w-sm'
            }`}
          >
            <svg
              viewBox="0 0 300 300"
              role="img"
              aria-label={`Diagrama de ${tulName}`}
              className="h-auto w-full"
            >
              {/* Línies de referència */}
              <path
                d="M 150 15 V 285 M 15 150 H 285"
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="4 6"
              />

              {/* Diagrama tradicional */}
              {definition.paths.map((path, index) => (
                <path
                  key={index}
                  d={path}
                  stroke="#ef4444"
                  strokeWidth="9"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

              {/* Centre de referència */}
              <circle
                cx="150"
                cy="150"
                r="9"
                fill="#f8fafc"
                stroke="#ef4444"
                strokeWidth="3"
              />

              {/* Direccions de referència */}
              
{/* Direccions ITF: esquema de referència A-B-C-D */}
<text
  x="150"
  y="18"
  textAnchor="middle"
  fill={directionColor('D')}
  fontSize="15"
  fontWeight="bold"
>
  D
</text>

<text
  x="150"
  y="292"
  textAnchor="middle"
  fill={directionColor('C')}
  fontSize="15"
  fontWeight="bold"
>
  C
</text>

<text
  x="12"
  y="145"
  textAnchor="start"
  fill={directionColor('A')}
  fontSize="15"
  fontWeight="bold"
>
  A
</text>

<text
  x="288"
  y="145"
  textAnchor="end"
  	fill={directionColor('B')}
  fontSize="15"
  fontWeight="bold"
>
  B
</text>

            </svg>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-400">
            <Info size={18} className="mt-0.5 shrink-0 text-blue-400" />

            <p>
              {definition.description} Aquest dibuix és
              una representació esquemàtica, no una
              trajectòria detallada dels peus ni dels
              19 moviments.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-600 bg-slate-900/40 p-6">
          <div className="mb-3 flex items-center gap-2 text-slate-300">
            <Info size={18} />
            <h4 className="font-semibold">
              Diagrama gràfic pendent
            </h4>
          </div>

          {diagram ? (
            <p className="whitespace-pre-line font-mono text-xl text-white">
              {diagram}
            </p>
          ) : (
            <p className="text-sm text-slate-400">
              Encara no hem incorporat el diagrama
              d'aquest tul.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
}