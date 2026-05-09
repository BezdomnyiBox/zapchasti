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

## CI/CD с тестами (GitHub Actions)

В репозитории используются 2 workflow:

- `.github/workflows/ci.yml` — только проверки (tests/lint/build);
- `.github/workflows/cd.yml` — только деплой, запускается после успешного `CI` для ветки `main`.

### Что делает `ci.yml`

- backend:
  - установка `requirements.txt` + `requirements-dev.txt`;
  - запуск `python -m pytest -q`;
- frontend:
  - `npm ci`;
  - `npm run lint`;
  - `npm run build`.

### Что делает `cd.yml`

- триггер: `workflow_run` после workflow `CI`;
- условие: только успешный `CI` и только `main`;
- деплой по SSH:
  - `git fetch/reset` до `origin/main`;
  - `docker compose build --no-cache`;
  - `docker compose up -d`.

Деплой использует environment `production`, что удобно для required approvals.

### Где заполнять secrets в GitHub

1. Открой репозиторий на GitHub.
2. Перейди: **Settings → Secrets and variables → Actions**.
3. Нажми **New repository secret** и добавь:
   - `DEPLOY_HOST`
   - `DEPLOY_USER`
   - `DEPLOY_SSH_KEY`
   - `DEPLOY_PATH`

### Что именно указывать в secrets

- `DEPLOY_HOST`  
  Публичный IP или домен сервера, например: `92.242.63.245`.

- `DEPLOY_USER`  
  SSH-пользователь, например: `root` или отдельный deploy-user.

- `DEPLOY_SSH_KEY`  
  Приватный ключ, которым GitHub Actions подключается к серверу.  
  Вставляется полным содержимым файла (включая строки `-----BEGIN ...-----` и `-----END ...-----`).

- `DEPLOY_PATH`  
  Абсолютный путь к проекту на сервере, где лежит `docker-compose.yml`, например: `/opt/zapchasti`.

### Как включить approvals перед деплоем (рекомендуется)

1. Открой: **Settings → Environments → New environment**.
2. Создай environment с именем `production`.
3. Добавь **Required reviewers** (кто должен подтверждать деплой).
4. При необходимости добавь environment-level secrets (вместо repository-level).

Если `DEPLOY_*` secrets не заданы, deploy job автоматически пропускается, а CI продолжает работать.
