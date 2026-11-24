
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  GraduationCap,
  Hash,
  Languages,
  ListOrdered,
  LoaderCircle,
  Megaphone,
  RefreshCw,
  Search,
} from 'lucide-react'

import AcademyProgress from '../components/AcademyProgress'
import AcademyStudy from '../components/AcademyStudy'
import TulDiagram from '../components/TulDiagram'

// =====================================================
// TIPUS
// =====================================================

type Tul = {
  id: number
  name: string
  meaning: string
  movements: number
  diagram: string | null
  description: string | null
  grade_id: number | null
}

type Grade = {
  id: number
  name: string
  level: number
  category: string
  belt_color: string
  description: string | null
}

type AcademyStats = {
  total_tuls: number
  total_grades: number
  total_movements: number
}

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

type Language = 'ca' | 'en'
type ViewMode = 'list' | 'study'
type LoadStatus = 'loading' | 'success' | 'error'

const STORAGE_PREFIX = 'itf-hub:academy-progress:v1:'

const roman: Record<number, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
  6: 'VI',
  7: 'VII',
  8: 'VIII',
  9: 'IX',
}

// =====================================================
// FUNCIONS AUXILIARS
// =====================================================

async function getJson<T>(
  url: string,
  signal: AbortSignal,
): Promise<T> {
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}: ${url}`)
  }

  return response.json() as Promise<T>
}

function getGradeLabel(grade?: Grade): string {
  if (!grade) return 'Grau no assignat'

  if (grade.category.toUpperCase() === 'DAN') {
    return `${roman[grade.level] ?? grade.level} DAN`
  }

  return grade.name
}

function isPending(value: string | null | undefined): boolean {
  if (!value?.trim()) return true

  return /pendent|pending translation|per traduir|to be translated/i.test(
    value,
  )
}

function getTechnique(
  movement: TulMovement,
  language: Language,
): string {
  if (language === 'en') {
    return (
      movement.technique_original?.trim() ||
      movement.technique?.trim() ||
      'Tècnica no disponible'
    )
  }

  return isPending(movement.technique)
    ? 'Traducció catalana pendent'
    : movement.technique
}

function getExecution(
  movement: TulMovement,
  language: Language,
): string | null {
  if (language === 'en') {
    return (
      movement.execution_original?.trim() ||
      movement.execution?.trim() ||
      null
    )
  }

  return isPending(movement.execution)
    ? null
    : movement.execution
}

function getStoredNumbers(tulId: number): number[] {
  try {
    const raw = localStorage.getItem(
      `${STORAGE_PREFIX}${tulId}`,
    )

    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)

    if (!Array.isArray(parsed)) return []

    return parsed.filter(
      (value): value is number =>
        typeof value === 'number' &&
        Number.isInteger(value) &&
        value > 0,
    )
  } catch {
    return []
  }
}

function getTulProgress(
  tulId: number,
  totalMovements: number,
): number {
  if (totalMovements <= 0) return 0

  const validNumbers = new Set(
    getStoredNumbers(tulId).filter(
      (number) => number <= totalMovements,
    ),
  )

  return Math.round(
    (validNumbers.size / totalMovements) * 100,
  )
}

function getGlobalProgress(tuls: Tul[]) {
  let completedMovements = 0
  let totalMovements = 0

  for (const tul of tuls) {
    totalMovements += tul.movements

    completedMovements += new Set(
      getStoredNumbers(tul.id).filter(
        (number) => number <= tul.movements,
      ),
    ).size
  }

  const percentage =
    totalMovements > 0
      ? Math.round(
          (completedMovements / totalMovements) * 100,
        )
      : 0

  return {
    completedMovements,
    totalMovements,
    percentage,
  }
}

// =====================================================
// INSÍGNIA DEL GRAU
// =====================================================

function GradeBadge({ grade }: { grade?: Grade }) {
  const isDan = grade?.category.toUpperCase() === 'DAN'

  return (
    <span
      className={`inline-flex rounded-lg border px-3 py-1 text-xs font-semibold ${
        isDan
          ? 'border-red-500/30 bg-red-500/10 text-red-300'
          : 'border-blue-500/30 bg-blue-500/10 text-blue-300'
      }`}
    >
      {getGradeLabel(grade)}
    </span>
  )
}

// =====================================================
// TARGETA D'UN MOVIMENT
// =====================================================

function MovementCard({
  movement,
  language,
}: {
  movement: TulMovement
  language: Language
}) {
  const [showOriginal, setShowOriginal] = useState(false)

  const technique = getTechnique(movement, language)
  const execution = getExecution(movement, language)

  const hasOriginal = Boolean(
    movement.technique_original ||
    movement.execution_original,
  )

  return (
    <article className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-lg font-bold text-red-400">
          {movement.movement_number}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold leading-relaxed text-white">
              {technique}
            </h3>

            {movement.kihap && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-300">
                <Megaphone size={14} />
                KI-HAP
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {movement.stance && (
              <span className="rounded-lg bg-slate-700 px-3 py-1.5 text-slate-200">
                Posició: {movement.stance}
              </span>
            )}

            {movement.direction && (
              <span className="rounded-lg bg-slate-700 px-3 py-1.5 text-slate-200">
                Direcció: {movement.direction}
              </span>
            )}
          </div>

          {execution && (
            <p className="whitespace-pre-line leading-7 text-slate-300">
              {execution}
            </p>
          )}

          {language === 'ca' &&
            isPending(movement.technique) && (
              <p className="text-xs text-amber-300">
                Traducció catalana pendent de revisió.
              </p>
            )}

          {language === 'ca' && hasOriginal && (
            <div>
              <button
                type="button"
                onClick={() =>
                  setShowOriginal((value) => !value)
                }
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-300 hover:text-blue-200"
              >
                <Languages size={16} />

                {showOriginal
                  ? 'Amagar el text original'
                  : 'Consultar el text original'}

                <ChevronDown
                  size={15}
                  className={
                    showOriginal ? 'rotate-180' : ''
                  }
                />
              </button>

              {showOriginal && (
                <div className="mt-3 space-y-2 rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                  {movement.technique_original && (
                    <p className="font-medium text-slate-200">
                      {movement.technique_original}
                    </p>
                  )}

                  {movement.execution_original && (
                    <p className="whitespace-pre-line text-sm leading-6 text-slate-400">
                      {movement.execution_original}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {movement.notes && (
            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3 text-sm text-slate-400">
              <strong className="text-slate-200">
                Observacions:
              </strong>{' '}
              {movement.notes}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

// =====================================================
// COMPONENT PRINCIPAL
// =====================================================

export default function Academy() {
  const [tuls, setTuls] = useState<Tul[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [stats, setStats] = useState<AcademyStats | null>(
    null,
  )

  const [status, setStatus] =
    useState<LoadStatus>('loading')

  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')

  const [selectedTul, setSelectedTul] =
    useState<Tul | null>(null)

  const [movements, setMovements] = useState<TulMovement[]>(
    [],
  )

  const [movementsStatus, setMovementsStatus] =
    useState<LoadStatus>('loading')

  const [movementsError, setMovementsError] = useState('')

  const [language, setLanguage] =
    useState<Language>('ca')

  const [viewMode, setViewMode] =
    useState<ViewMode>('list')

  const [reload, setReload] = useState(0)
  const [reloadMovements, setReloadMovements] = useState(0)

  // Força el recàlcul del progrés quan tornem
  // al catàleg o quan canviem de vista.
  const [progressVersion, setProgressVersion] = useState(0)

  // ---------------------------------------------------
  // CARREGAR CATÀLEG
  // ---------------------------------------------------

  useEffect(() => {
    const controller = new AbortController()

    async function loadAcademy() {
      setStatus('loading')
      setError('')

      try {
        const [tulData, gradeData, statsData] =
          await Promise.all([
            getJson<Tul[]>(
              '/api/academy/tuls',
              controller.signal,
            ),
            getJson<Grade[]>(
              '/api/academy/grades',
              controller.signal,
            ),
            getJson<AcademyStats>(
              '/api/academy/stats',
              controller.signal,
            ),
          ])

        if (controller.signal.aborted) return

        setTuls(tulData)
        setGrades(gradeData)
        setStats(statsData)
        setStatus('success')
      } catch (err) {
        if (controller.signal.aborted) return

        setError(
          err instanceof Error
            ? err.message
            : 'No s’ha pogut carregar ITF Academy.',
        )

        setStatus('error')
      }
    }

    void loadAcademy()

    return () => controller.abort()
  }, [reload])

  // ---------------------------------------------------
  // CARREGAR MOVIMENTS
  // ---------------------------------------------------

  useEffect(() => {
    if (!selectedTul) {
      setMovements([])
      return
    }

    const controller = new AbortController()
    const tulId = selectedTul.id

    async function loadMovements() {
      setMovementsStatus('loading')
      setMovementsError('')
      setMovements([])

      try {
        const data = await getJson<TulMovement[]>(
          `/api/academy/tuls/${tulId}/movements`,
          controller.signal,
        )

        if (controller.signal.aborted) return

        setMovements(
          [...data].sort(
            (a, b) =>
              a.movement_number - b.movement_number,
          ),
        )

        setMovementsStatus('success')
      } catch (err) {
        if (controller.signal.aborted) return

        setMovementsError(
          err instanceof Error
            ? err.message
            : 'No s’han pogut carregar els moviments.',
        )

        setMovementsStatus('error')
      }
    }

    void loadMovements()

    return () => controller.abort()
  }, [selectedTul?.id, reloadMovements])

  // ---------------------------------------------------
  // FILTRES I PROGRÉS
  // ---------------------------------------------------

  const gradeMap = useMemo(
    () =>
      new Map(grades.map((grade) => [grade.id, grade])),
    [grades],
  )

  const filteredTuls = useMemo(() => {
    const query = search.trim().toLowerCase()

    return tuls.filter((tul) => {
      const matchesSearch =
        !query ||
        tul.name.toLowerCase().includes(query) ||
        (tul.meaning || '').toLowerCase().includes(query)

      const matchesGrade =
        gradeFilter === 'all' ||
        String(tul.grade_id) === gradeFilter

      return matchesSearch && matchesGrade
    })
  }, [tuls, search, gradeFilter])

  const globalProgress = useMemo(
    () => getGlobalProgress(tuls),
    [tuls, progressVersion],
  )

  const uniqueMovementCount = new Set(
    movements.map((movement) => movement.movement_number),
  ).size

  const sequenceComplete =
    selectedTul !== null &&
    movements.length === selectedTul.movements &&
    uniqueMovementCount === selectedTul.movements &&
    movements.every(
      (movement, index) =>
        movement.movement_number === index + 1,
    )

  // ---------------------------------------------------
  // NAVEGACIÓ
  // ---------------------------------------------------

  function openTul(tul: Tul) {
    setSelectedTul(tul)
    setViewMode('list')
  }

  function closeTul() {
    setSelectedTul(null)
    setMovements([])
    setViewMode('list')

    setProgressVersion((value) => value + 1)
  }

  function changeViewMode(mode: ViewMode) {
    setViewMode(mode)

    if (mode === 'list') {
      setProgressVersion((value) => value + 1)
    }
  }

  // ---------------------------------------------------
  // ESTAT DE CÀRREGA
  // ---------------------------------------------------

  if (status === 'loading') {
    return (
      <div className="flex min-h-80 items-center justify-center gap-3 text-slate-400">
        <LoaderCircle className="animate-spin" size={24} />
        Carregant ITF Academy...
      </div>
    )
  }

  if (status === 'error') {
    return (
      <section className="rounded-2xl border border-red-500/30 bg-slate-800 p-6">
        <div className="mb-3 flex items-center gap-2 text-red-300">
          <CircleAlert size={20} />
          <h2 className="font-semibold">
            Error de connexió amb ITF Academy
          </h2>
        </div>

        <p className="mb-5 text-sm text-slate-400">
          {error}
        </p>

        <button
          type="button"
          onClick={() => setReload((value) => value + 1)}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-500"
        >
          <RefreshCw size={16} />
          Tornar-ho a provar
        </button>
      </section>
    )
  }

  // =====================================================
  // FITXA INDIVIDUAL DEL TUL
  // =====================================================

  if (selectedTul) {
    const grade = selectedTul.grade_id
      ? gradeMap.get(selectedTul.grade_id)
      : undefined

    const showStudyMode = viewMode === 'study'

    return (
      <div className="space-y-5 text-slate-100">
        <button
          type="button"
          onClick={closeTul}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={17} />
          Tornar als 24 tuls
        </button>

        {/* CAPÇALERA COMPACTA */}
        <section className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-white">
                  {selectedTul.name}
                </h2>

                <GradeBadge grade={grade} />
              </div>

              {!showStudyMode && (
                <p className="max-w-3xl leading-7 text-slate-400">
                  {selectedTul.meaning ||
                    'Significat pendent d’incorporar.'}
                </p>
              )}
            </div>

            <div className="rounded-xl bg-slate-900/70 px-4 py-2 text-center">
              <p className="text-xl font-bold text-red-400">
                {selectedTul.movements}
              </p>

              <p className="text-xs text-slate-400">
                Moviments
              </p>
            </div>
          </div>

          {!showStudyMode && selectedTul.description && (
            <p className="mt-4 whitespace-pre-line border-t border-slate-700 pt-4 leading-7 text-slate-400">
              {selectedTul.description}
            </p>
          )}
        </section>

        {/* MODES DE VISUALITZACIÓ */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-slate-700 bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => changeViewMode('list')}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                viewMode === 'list'
                  ? 'bg-red-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Llista completa
            </button>

            <button
              type="button"
              onClick={() => changeViewMode('study')}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                viewMode === 'study'
                  ? 'bg-red-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mode estudi compacte
            </button>
          </div>

          {!showStudyMode && (
            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2">
              <Languages size={16} className="text-slate-400" />

              <select
                aria-label="Idioma dels moviments"
                value={language}
                onChange={(event) =>
                  setLanguage(
                    event.target.value as Language,
                  )
                }
                className="bg-transparent text-sm text-white outline-none"
              >
                <option
                  value="ca"
                  className="bg-slate-800"
                >
                  Català
                </option>

                <option
                  value="en"
                  className="bg-slate-800"
                >
                  Anglès original
                </option>
              </select>
            </label>
          )}
        </div>

        {/* ESTAT DE CÀRREGA DE MOVIMENTS */}
        {movementsStatus === 'loading' ? (
          <div className="flex items-center justify-center gap-3 py-12 text-slate-400">
            <LoaderCircle className="animate-spin" />
            Carregant moviments...
          </div>
        ) : movementsStatus === 'error' ? (
          <div className="rounded-2xl border border-red-500/30 bg-slate-800 p-6">
            <p className="mb-4 text-red-300">
              {movementsError}
            </p>

            <button
              type="button"
              onClick={() =>
                setReloadMovements((value) => value + 1)
              }
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
            >
              <RefreshCw size={16} />
              Tornar-ho a provar
            </button>
          </div>
        ) : movements.length === 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-800 p-8 text-center">
            <BookOpen
              className="mx-auto mb-4 text-slate-500"
              size={36}
            />

            <h3 className="mb-2 text-lg font-semibold">
              Encara no hi ha moviments registrats
            </h3>

            <p className="text-sm text-slate-400">
              Importa els moviments d'aquest tul per
              començar a estudiar-los.
            </p>
          </div>
        ) : showStudyMode ? (
          // MODE ESTUDI COMPACTE
          <AcademyStudy
            key={selectedTul.id}
            tulId={selectedTul.id}
            tulName={selectedTul.name}
            expectedMovements={selectedTul.movements}
            movements={movements}
          />
        ) : (
          // LLISTA COMPLETA
          <div className="space-y-5">
            <TulDiagram
              key={selectedTul.id}
              tulName={selectedTul.name}
              diagram={selectedTul.diagram}
            />

            <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-white">
                    <ListOrdered
                      size={20}
                      className="text-red-400"
                    />
                    Seqüència de moviments
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    {movements.length} de{' '}
                    {selectedTul.movements} moviments
                  </p>
                </div>

                {sequenceComplete ? (
                  <span className="inline-flex items-center gap-2 text-sm text-emerald-400">
                    <CheckCircle2 size={17} />
                    Numeració completa
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-sm text-amber-300">
                    <CircleAlert size={17} />
                    Seqüència pendent de revisar
                  </span>
                )}
              </div>
            </div>

            <AcademyProgress
              key={`${selectedTul.id}-${progressVersion}`}
              tulId={selectedTul.id}
              tulName={selectedTul.name}
              expectedMovements={selectedTul.movements}
              movements={movements}
            />

            <div className="space-y-4">
              {movements.map((movement) => (
                <MovementCard
                  key={movement.id}
                  movement={movement}
                  language={language}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // =====================================================
  // CATÀLEG DELS 24 TULS
  // =====================================================

  return (
    <div className="space-y-7 text-slate-100">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <BookOpen className="text-red-400" size={28} />

          <h2 className="text-3xl font-bold text-white">
            ITF Academy
          </h2>
        </div>

        <p className="text-slate-400">
          Biblioteca de tuls Chang-Hon, tècniques
          i moviments de Taekwon-Do ITF.
        </p>
      </header>

      {/* ESTADÍSTIQUES GENERALS */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
          <BookOpen className="mb-3 text-red-400" />
          <p className="text-3xl font-bold">
            {stats?.total_tuls ?? tuls.length}
          </p>
          <p className="text-sm text-slate-400">
            Tuls registrats
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
          <GraduationCap className="mb-3 text-blue-400" />
          <p className="text-3xl font-bold">
            {stats?.total_grades ?? grades.length}
          </p>
          <p className="text-sm text-slate-400">
            Graus registrats
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
          <Hash className="mb-3 text-emerald-400" />
          <p className="text-3xl font-bold">
            {stats?.total_movements ?? 0}
          </p>
          <p className="text-sm text-slate-400">
            Moviments previstos
          </p>
        </div>
      </div>

      {/* PROGRÉS GLOBAL */}
      <section className="rounded-2xl border border-slate-700 bg-slate-800 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <CheckCircle2
                size={22}
                className="text-emerald-400"
              />

              <h3 className="text-xl font-bold text-white">
                El meu progrés global
              </h3>
            </div>

            <p className="text-sm text-slate-400">
              Seguiment dels moviments dominats dels 24 tuls.
            </p>
          </div>

          <div className="text-right">
            <p className="text-3xl font-bold text-emerald-400">
              {globalProgress.percentage}%
            </p>

            <p className="text-xs text-slate-400">
              {globalProgress.completedMovements} de{' '}
              {globalProgress.totalMovements} moviments
            </p>
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{
              width: `${globalProgress.percentage}%`,
            }}
          />
        </div>

        <p className="mt-3 text-xs text-slate-500">
          El progrés es desa en aquest navegador.
        </p>
      </section>

      {/* CERCADOR I FILTRES */}
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 px-4">
          <Search size={19} className="text-slate-400" />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Cercar tul o significat..."
            className="w-full bg-transparent py-3 text-white outline-none placeholder:text-slate-500"
          />
        </label>

        <select
          aria-label="Filtrar per grau"
          value={gradeFilter}
          onChange={(event) =>
            setGradeFilter(event.target.value)
          }
          className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none"
        >
          <option value="all">Tots els graus</option>

          {grades.map((grade) => (
            <option key={grade.id} value={grade.id}>
              {getGradeLabel(grade)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {filteredTuls.length} tuls trobats
        </p>

        <button
          type="button"
          onClick={() =>
            setReload((value) => value + 1)
          }
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <RefreshCw size={15} />
          Actualitzar
        </button>
      </div>

      {/* TARGETES DELS TULS */}
      {filteredTuls.length === 0 ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-10 text-center text-slate-400">
          No s'han trobat tuls amb aquests filtres.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTuls.map((tul) => {
            const grade = tul.grade_id
              ? gradeMap.get(tul.grade_id)
              : undefined

            const progress = getTulProgress(
              tul.id,
              tul.movements,
            )

            return (
              <button
                type="button"
                key={tul.id}
                onClick={() => openTul(tul)}
                className="group rounded-2xl border border-slate-700 bg-slate-800 p-5 text-left transition hover:border-red-500/50 hover:bg-slate-800/90"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <GradeBadge grade={grade} />

                  <ChevronRight
                    size={20}
                    className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-red-400"
                  />
                </div>

                <h3 className="mb-2 text-xl font-bold text-white">
                  {tul.name}
                </h3>

                <p className="mb-5 line-clamp-3 min-h-12 text-sm leading-6 text-slate-400">
                  {tul.meaning ||
                    'Significat pendent d’incorporar.'}
                </p>

                <div className="space-y-4 border-t border-slate-700 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-sm text-slate-300">
                      <ListOrdered size={16} />
                      {tul.movements} moviments
                    </span>

                    <span className="text-sm font-semibold text-red-400">
                      Estudiar
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        El meu progrés
                      </span>

                      <span className="text-xs font-semibold text-emerald-400">
                        {progress}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
