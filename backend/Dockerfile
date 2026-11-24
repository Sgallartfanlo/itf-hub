
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Instal·lar dependències
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copiar el codi de FastAPI
COPY app ./app

# Copiar la configuració i les migracions d'Alembic
COPY alembic.ini ./alembic.ini
COPY migrations ./migrations

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
