# Zapchasti

## Seed каталога автозапчастей

Перед заполнением каталога примените миграции:

```bash
cd backend
python -m alembic upgrade head
```

Запуск идемпотентного seed-скрипта внутри Docker-сети:

```bash
docker compose exec backend python scripts/seed_catalog.py
```

Локальный запуск с хоста возможен, если `DATABASE_URL` указывает на доступный host/port PostgreSQL, например `localhost`, а не Docker service name `db`:

```bash
cd backend
python scripts/seed_catalog.py
```

После запуска можно проверить endpoint-ы:

```text
GET /api/catalog/car-brands
GET /api/catalog/car-brands/{car_brand_id}/models
GET /api/catalog/car-models/{car_model_id}/bodies
GET /api/catalog/car-models/{car_model_id}/engines
GET /api/catalog/part-brands
GET /api/catalog/categories
GET /api/catalog/parts
GET /api/catalog/parts/{part_id}
GET /api/catalog/parts/{part_id}/analogs
```
