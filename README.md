
<div align="center">

# 🥋 ITF Hub v2

### Plataforma de gestió, aprenentatge i entrenament de Taekwon-Do ITF

**React · TypeScript · FastAPI · PostgreSQL · Docker**

Una plataforma web modular dedicada al Taekwon-Do ITF, orientada a estudiants, instructors i escoles.

[Funcionalitats](#-funcionalitats) · [Tecnologies](#-tecnologies) · [Instal·lació](#-installació) · [Estructura](#-estructura-del-projecte)

</div>

---

## 📖 Sobre el projecte

**ITF Hub v2** és una plataforma web desenvolupada per centralitzar l'aprenentatge, la pràctica i la futura gestió d'activitats relacionades amb el Taekwon-Do ITF.

El projecte utilitza una arquitectura modular, amb un frontend React, una API REST desenvolupada amb FastAPI i una base de dades PostgreSQL.

Tots els serveis s'executen mitjançant Docker Compose.

## 🚀 Funcionalitats

### 🥋 ITF Academy

Mòdul d'aprenentatge i estudi dels tuls Chang-Hon.

- Catàleg dels 24 tuls.
- Informació sobre significat, grau i nombre de moviments.
- Consulta dels moviments individuals.
- Descripcions en català i textos originals en anglès.
- Cerca i filtres per grau.
- Diagrama visual de Chon-Ji.
- Indicadors de direcció A, B, C i D.
- Mode estudi compacte.
- Navegació entre moviments.
- Selector ràpid de moviment.
- Navegació amb el teclat.
- Mode memorització amb revelació de la resposta.
- Avanç automàtic opcional.
- Seguiment dels moviments dominats.
- Estadístiques de progrés per tul i globals.

El progrés personal es desa actualment al navegador mitjançant `localStorage`.

### 🧩 Mòduls previstos

La plataforma està dissenyada per incorporar progressivament:

| Mòdul | Objectiu |
|---|---|
| Dojang Manager | Gestió d'escoles i alumnes |
| Training Tracker | Registre d'entrenaments |
| TKD Vision AI | Anàlisi tècnica amb intel·ligència artificial |
| Tournament Manager | Gestió de competicions |
| Exam Simulator | Preparació d'exàmens ITF |
| Breaking Lab | Planificació i seguiment de trencaments |
| Dojang Analytics | Estadístiques i anàlisi de dades |

Aquests mòduls formen part del full de ruta i no s'han de considerar funcionalitats completament implementades.

## 🛠️ Tecnologies

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React

### Backend

- Python
- FastAPI
- SQLAlchemy
- Alembic
- Pydantic

### Base de dades

- PostgreSQL

### Infraestructura

- Docker
- Docker Compose
- Xarxa privada entre contenidors
- Volum persistent per a PostgreSQL

## 🏗️ Arquitectura

```text
                  ┌───────────────────┐
                  │     Navegador     │
                  └─────────┬─────────┘
                            │
                            ▼
                  ┌───────────────────┐
                  │  React + Vite     │
                  │  localhost:5173   │
                  └─────────┬─────────┘
                            │ /api
                            ▼
                  ┌───────────────────┐
                  │ FastAPI           │
                  │ localhost:8000    │
                  └─────────┬─────────┘
                            │
                            ▼
                  ┌───────────────────┐
                  │ PostgreSQL        │
                  │ Docker Network    │
                  └───────────────────┘
```

## 📂 Estructura del projecte

```text
itf-hub/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── modules/
│   │   ├── schemas/
│   │   └── academy_movements/
│   ├── migrations/
│   ├── alembic.ini
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   └── pages/
│   ├── package.json
│   └── Dockerfile
│
├── compose.yaml
├── .env.example
├── .gitignore
└── README.md
```

## ⚙️ Instal·lació

### Requisits

- Git
- Docker Desktop
- Docker Compose

No és necessari instal·lar Node.js ni Python localment si es treballa amb els contenidors del projecte.

### 1. Clonar el repositori

```bash
git clone https://github.com/Sgallartfanlo/itf-hub.git
cd itf-hub
```

### 2. Configurar les variables d'entorn

Crea un fitxer `.env` a partir de `.env.example`.

En PowerShell:

```powershell
Copy-Item .env.example .env
```

Edita `.env` i configura una contrasenya pròpia per a PostgreSQL.

### 3. Construir i iniciar els contenidors

```bash
docker compose up -d --build
```

### 4. Aplicar les migracions

```bash
docker compose exec backend alembic -c /app/alembic.ini upgrade head
```

### 5. Consultar els serveis

| Servei | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:8000 |
| Swagger | http://localhost:8000/docs |
| Health check | http://localhost:8000/api/health |

### 6. Inicialitzar les dades d'ITF Academy

El projecte incorpora scripts per gestionar el catàleg de tuls i els seus moviments.

Per exemple, per consultar el carregador de moviments:

```bash
docker compose exec backend python -m app.seed_tul_movements --list
```

Per validar els JSON disponibles sense modificar PostgreSQL:

```bash
docker compose exec backend python -m app.seed_tul_movements --dry-run
```

Abans d'importar les seqüències cal tenir inicialitzats els graus i els tuls, i haver aplicat les migracions.

## 🔌 API REST

Alguns endpoints disponibles:

```text
GET /api/health
GET /api/info

GET /api/academy/grades
GET /api/academy/grades/{grade_id}

GET /api/academy/tuls
GET /api/academy/tuls/{tul_id}

GET /api/academy/tuls/{tul_id}/movements
GET /api/academy/tuls/{tul_id}/movements/{movement_number}

GET /api/academy/stats
```

La documentació interactiva està disponible a `/docs`.

## 📈 Full de ruta

- [x] Infraestructura Docker
- [x] API FastAPI
- [x] Base de dades PostgreSQL
- [x] Migracions Alembic
- [x] Catàleg de 24 tuls
- [x] Moviments individuals
- [x] Suport per a català i anglès
- [x] Mode estudi compacte
- [x] Mode memorització
- [x] Seguiment local del progrés
- [ ] Diagrames visuals complets dels 24 tuls
- [ ] Autenticació i perfils d'usuari
- [ ] Progrés sincronitzat amb PostgreSQL
- [ ] Dojang Manager
- [ ] Training Tracker
- [ ] Exam Simulator
- [ ] Breaking Lab
- [ ] TKD Vision AI
- [ ] Tournament Manager
- [ ] Dojang Analytics

## 🛡️ Seguretat

Les credencials i configuracions privades es desen a `.env`, que està exclòs del control de versions.

El repositori inclou `.env.example` com a plantilla de configuració sense secrets reals.

## 👨‍💻 Desenvolupament

Projecte personal de desenvolupament i aprenentatge que combina:

- Desenvolupament web full stack
- Administració de sistemes
- DevOps i contenidors
- Bases de dades
- Intel·ligència artificial i Big Data
- Taekwon-Do ITF

---

<div align="center">

**ITF Hub v2**

*Tecnologia al servei de l'aprenentatge del Taekwon-Do ITF.*

</div>
