
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.core.database import Base, check_database, engine
from app.models import Grade, Tul  # Registra els models
from app.modules.academy.router import router as academy_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialització de l'esquema per a ITF Hub v2.
    # Posteriorment utilitzarem migracions amb Alembic.
    Base.metadata.create_all(bind=engine)

    yield


app = FastAPI(
    title="ITF Hub API",
    description="API REST per a la plataforma ITF Hub",
    version="2.0.0",
    lifespan=lifespan,
)

app.include_router(academy_router)


@app.get("/")
def root():
    return {
        "application": "ITF Hub",
        "version": "2.0.0",
        "message": "Benvingut a ITF Hub API",
    }


@app.get("/api/health")
def health():
    try:
        check_database()

        return {
            "status": "healthy",
            "services": {
                "fastapi": "ok",
                "postgresql": "ok",
            },
        }

    except Exception:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "services": {
                    "fastapi": "ok",
                    "postgresql": "error",
                },
            },
        )


@app.get("/api/info")
def info():
    return {
        "name": "ITF Hub",
        "version": "2.0.0",
        "modules": [
            "ITF Academy",
            "Dojang Manager",
            "Training Tracker",
            "TKD Vision AI",
            "Tournament Manager",
            "Exam Simulator",
            "Breaking Lab",
            "Dojang Analytics",
        ],
    }
