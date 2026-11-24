
import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  ChartColumnIncreasing,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Database,
  Dumbbell,
  Eye,
  GraduationCap,
  LoaderCircle,
  RefreshCw,
  Server,
  Shield,
  Trophy,
} from 'lucide-react'

import Academy from './pages/Academy'

type Health = {
  status: string
  services: {
    fastapi: string
    postgresql: string
  }
}

type ModuleId =
  | 'academy'
  | 'dojang'
  | 'training'
  | 'vision'
  | 'tournaments'
  | 'exams'
  | 'breaking'
  | 'analytics'

type Module = {
  id: ModuleId
  title: string
  description: string
  icon: typeof BookOpen
  color: string
}

const modules: Module[] = [
  {
    id: 'academy',
    title: 'ITF Academy',
    description: 'Consulta els 24 tuls, els graus i la història.',
    icon: BookOpen,
    color: 'text-red-400',
  },
  {
    id: 'dojang',
    title: 'Dojang Manager',
    description: 'Gestió dels alumnes i del dojang.',
    icon: GraduationCap,
    color: 'text-blue-400',
  },
  {
    id: 'training',
    title: 'Training Tracker',
    description: 'Seguiment dels entrenaments.',
    icon: Dumbbell,
    color: 'text-green-400',
  },
  {
    id: 'vision',
    title: 'TKD Vision AI',
    description: 'Anàlisi tècnica amb intel·ligència artificial.',
    icon: Eye,
    color: 'text-purple-400',
  },
  {
    id: 'tournaments',
    title: 'Tournament Manager',
    description: 'Organització de tornejos.',
    icon: Trophy,
    color: 'text-amber-400',
  },
  {
    id: 'exams',
    title: 'Exam Simulator',
    description: 'Preparació de proves de grau.',
    icon: ClipboardCheck,
    color: 'text-cyan-400',
  },
  {
    id: 'breaking',
    title: 'Breaking Lab',
    description: 'Seguiment de trencaments.',
    icon: Shield,
    color: 'text-orange-400',
  },
  {
    id: 'analytics',
    title: 'Dojang Analytics',
    description: 'Estadístiques del dojang.',
    icon: ChartColumnIncreasing,
    color: 'text-pink-400',
  },
]

export default function App() {
  const [activeModule, setActiveModule] =
    useState<ModuleId | null>(null)

  const [health, setHealth] = useState<Health | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadHealth() {
      setLoading(true)
      setError(false)

      try {
        const response = await fetch('/api/health', {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Error consultant FastAPI')
        }

        const data: Health = await response.json()

        if (!controller.signal.aborted) {
          setHealth(data)
        }
      } catch {
        if (!controller.signal.aborted) {
          setHealth(null)
          setError(true)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadHealth()

    return () => controller.abort()
  }, [])

  const selectedModule = modules.find(
    (module) => module.id === activeModule
  )

  const apiOk = health?.services.fastapi === 'ok'
  const databaseOk = health?.services.postgresql === 'ok'

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* CAPÇALERA */}
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <button
            onClick={() => setActiveModule(null)}
            className="flex items-center gap-3 text-left"
          >
            <div className="rounded-xl bg-red-600 p-3">
              <BrainCircuit size={26} />
            </div>

            <div>
              <h1 className="text-xl font-bold">
                ITF Hub
              </h1>

              <p className="text-xs text-slate-400">
                Taekwon-Do ITF · Plataforma intel·ligent
              </p>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400">
              v2.0
            </span>

            {activeModule && (
              <button
                onClick={() => setActiveModule(null)}
                className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
              >
                <ArrowLeft size={16} />
                Dashboard
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10">
        {/* ITF ACADEMY */}
        {activeModule === 'academy' ? (
          <Academy />
        ) : activeModule && selectedModule ? (
          <div>
            <button
              onClick={() => setActiveModule(null)}
              className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white"
            >
              <ArrowLeft size={18} />
              Tornar al dashboard
            </button>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
              <selectedModule.icon
                className={selectedModule.color}
                size={36}
              />

              <h2 className="mt-5 text-3xl font-bold">
                {selectedModule.title}
              </h2>

              <p className="mt-3 text-slate-400">
                {selectedModule.description}
              </p>

              <p className="mt-7 rounded-xl bg-slate-800 p-5 text-sm text-slate-400">
                Aquest mòdul està pendent de desenvolupar.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* DASHBOARD */}
            <div className="mb-10">
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-red-500">
                Dashboard
              </p>

              <h2 className="text-3xl font-bold sm:text-4xl">
                Benvingut a ITF Hub
              </h2>

              <p className="mt-4 max-w-3xl text-slate-400">
                Plataforma de gestió, entrenament i
                aprenentatge del Taekwon-Do ITF.
              </p>
            </div>

            {/* ESTAT DEL SISTEMA */}
            <section className="mb-12">
              <h3 className="mb-5 flex items-center gap-2 text-xl font-semibold">
                <Activity className="text-red-400" size={22} />
                Estat del sistema
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <StatusCard
                  title="FastAPI"
                  description="Servidor backend"
                  ok={apiOk}
                  loading={loading}
                  icon={Server}
                />

                <StatusCard
                  title="PostgreSQL"
                  description="Base de dades"
                  ok={databaseOk}
                  loading={loading}
                  icon={Database}
                />
              </div>

              {error && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
                  <CircleAlert size={20} />
                  No s'ha pogut consultar l'estat del backend.
                </div>
              )}
            </section>

            {/* MÒDULS */}
            <section>
              <h3 className="mb-2 text-xl font-semibold">
                Mòduls de la plataforma
              </h3>

              <p className="mb-6 text-sm text-slate-400">
                Selecciona un mòdul per accedir-hi.
              </p>

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {modules.map((module) => {
                  const Icon = module.icon

                  return (
                    <button
                      key={module.id}
                      onClick={() => setActiveModule(module.id)}
                      className="group rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left transition hover:-translate-y-1 hover:border-red-500 hover:bg-slate-800"
                    >
                      <Icon
                        className={module.color}
                        size={30}
                      />

                      <h4 className="mt-5 text-lg font-bold">
                        {module.title}
                      </h4>

                      <p className="mt-3 min-h-16 text-sm leading-6 text-slate-400">
                        {module.description}
                      </p>

                      <span
                        className={
                          module.id === 'academy'
                            ? 'text-xs font-semibold text-green-400'
                            : 'text-xs text-slate-500'
                        }
                      >
                        {module.id === 'academy'
                          ? 'Obrir ITF Academy'
                          : 'Pròximament'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          </>
        )}

        <footer className="mt-14 border-t border-slate-800 pt-6 text-xs text-slate-500">
          ITF Hub v2 · React · FastAPI · PostgreSQL
        </footer>
      </main>
    </div>
  )
}

function StatusCard({
  title,
  description,
  ok,
  loading,
  icon: Icon,
}: {
  title: string
  description: string
  ok: boolean
  loading: boolean
  icon: typeof Server
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-start justify-between">
        <div>
          <Icon
            className="mb-4 text-slate-400"
            size={28}
          />

          <h4 className="text-lg font-semibold">
            {title}
          </h4>

          <p className="mt-1 text-sm text-slate-400">
            {description}
          </p>
        </div>

        {loading ? (
          <LoaderCircle className="animate-spin text-slate-400" />
        ) : ok ? (
          <CheckCircle2 className="text-green-400" />
        ) : (
          <CircleAlert className="text-red-400" />
        )}
      </div>

      <div className="mt-5 border-t border-slate-800 pt-4">
        <span
          className={
            loading
              ? 'text-slate-400'
              : ok
                ? 'text-green-400'
                : 'text-red-400'
          }
        >
          {loading
            ? 'Comprovant...'
            : ok
              ? 'Operatiu'
              : 'No disponible'}
        </span>
      </div>
    </div>
  )
}
