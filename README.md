# zapchasti

Сервис заказа и доставки автозапчастей. Клиент оформляет заказ по ссылке на деталь или оставляет заявку на подбор, курьер забирает деталь у продавца, перевозчик доставляет её клиенту. Ход заказа видят все участники.

## Возможности

- Каталог запчастей, карточка детали, корзина и оформление заказа
- Заявка на подбор детали, если у клиента нет ссылки
- Кабинеты по ролям: **клиент**, **курьер**, **перевозчик**, **администратор**
- Админка: управление заказами и пользователями
- Отзывы, профиль, загрузка медиа в объектное хранилище
- Карта (Leaflet) для точек выдачи и доставки
- JWT-авторизация и ограничение частоты запросов (rate limiting)

## Стек

**Backend:** Python, FastAPI, SQLAlchemy 2 (async, asyncpg), Alembic, Pydantic v2, Redis, MinIO (S3, boto3), pytest
**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, Axios, React-Leaflet
**Инфраструктура:** Docker Compose, PostgreSQL 15, nginx + Let's Encrypt, GitHub Actions (CI: тесты, линт, сборка; CD: деплой по SSH)

## Структура

```
backend/    FastAPI-приложение: api/, models/, schemas/, crud/, миграции Alembic, тесты
frontend/   SPA на React + TypeScript
nginx/      конфигурация обратного прокси
docs/       бизнес-процесс (PlantUML / Mermaid)
```

## Запуск

```bash
cp .env.example .env        # заполнить переменные
docker compose up -d --build
```

pgAdmin для разработки: `docker compose --profile dev up -d`, затем открыть http://127.0.0.1:5051.

Тесты бэкенда:

```bash
cd backend && pip install -r requirements-dev.txt && python -m pytest -q
```
