
import os

from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, sessionmaker


# ==========================================
# CONFIGURACIÓ DE POSTGRESQL
# ==========================================

DATABASE_URL = URL.create(
    drivername="postgresql+psycopg",
    username=os.getenv("POSTGRES_USER", "itfhub"),
    password=os.getenv("POSTGRES_PASSWORD"),
    host=os.getenv("POSTGRES_HOST", "postgres"),
    port=int(os.getenv("POSTGRES_PORT", "5432")),
    database=os.getenv("POSTGRES_DB", "itfhub"),
)


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def check_database():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return True
