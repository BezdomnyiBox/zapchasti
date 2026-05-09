import os
from pathlib import Path

# Do not use production .env in tests.
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./tests/.tmp/placeholder.db")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/15")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("S3_ENDPOINT", "http://localhost:9000")
os.environ.setdefault("S3_ACCESS_KEY", "test")
os.environ.setdefault("S3_SECRET_KEY", "test")
os.environ.setdefault("S3_BUCKET", "test")

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.deps import get_db
from app.core.security import create_access_token
from app.core.database import Base
from app.core.security import hash_password
from app.main import app
from app.models import (  # noqa: F401
    CarBody,
    CarBrand,
    CarEngine,
    CarModel,
    Category,
    Part,
    PartAnalog,
    PartApplicability,
    PartBrand,
    PartOffer,
    User,
)
from app.models.user import UserRole


@pytest.fixture(scope="session")
def test_db_url() -> str:
    tmp_dir = Path(__file__).resolve().parent / ".tmp"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    return f"sqlite+aiosqlite:///{(tmp_dir / 'test.db').as_posix()}"


@pytest_asyncio.fixture(scope="session")
async def engine(test_db_url: str):
    engine = create_async_engine(test_db_url, future=True)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def session_maker(engine):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture(scope="function")
async def client(session_maker):
    async def _override_get_db():
        async with session_maker() as session:
            yield session

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def make_user(session_maker):
    async def _create(
        username: str,
        email: str,
        password: str,
        role: UserRole = UserRole.CLIENT,
        phone: str | None = "70000000000",
    ) -> User:
        async with session_maker() as session:
            user = User(
                username=username,
                email=email,
                hashed_password=await hash_password(password),
                role=role,
                phone=phone,
                is_active=True,
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            return user

    return _create


@pytest_asyncio.fixture(scope="function")
async def auth_headers(client: AsyncClient):
    async def _headers_for_user(user: User) -> dict[str, str]:
        token = create_access_token({"sub": str(user.id), "role": user.role.value})
        return {"Authorization": f"Bearer {token}"}

    return _headers_for_user


@pytest_asyncio.fixture(scope="function")
async def client_user(make_user):
    return await make_user("client_user", "client@test.local", "password123", UserRole.CLIENT, "79990000001")


@pytest_asyncio.fixture(scope="function")
async def other_client_user(make_user):
    return await make_user("other_client", "other@test.local", "password123", UserRole.CLIENT, "79990000002")


@pytest_asyncio.fixture(scope="function")
async def admin_user(make_user):
    return await make_user("admin_user", "admin@test.local", "password123", UserRole.ADMIN, "79990000003")


@pytest_asyncio.fixture(scope="function")
async def client_headers(auth_headers, client_user):
    return await auth_headers(client_user)


@pytest_asyncio.fixture(scope="function")
async def other_client_headers(auth_headers, other_client_user):
    return await auth_headers(other_client_user)


@pytest_asyncio.fixture(scope="function")
async def admin_headers(auth_headers, admin_user):
    return await auth_headers(admin_user)


@pytest_asyncio.fixture(scope="function")
async def catalog_seed(session_maker):
    async with session_maker() as session:
        car_brand = CarBrand(name="Toyota")
        session.add(car_brand)
        await session.flush()

        car_model = CarModel(name="Camry", car_brand_id=car_brand.id)
        session.add(car_model)
        await session.flush()

        car_body = CarBody(code="XV70", car_model_id=car_model.id)
        car_engine = CarEngine(code="2AR-FE", car_model_id=car_model.id)
        part_brand = PartBrand(name="Aisin")
        category = Category(name="Тормозная система", parent_id=None)
        session.add_all([car_body, car_engine, part_brand, category])
        await session.flush()

        part_1 = Part(
            part_brand_id=part_brand.id,
            category_id=category.id,
            article="04465-33471",
            name="Колодки тормозные передние",
        )
        part_2 = Part(
            part_brand_id=part_brand.id,
            category_id=category.id,
            article="04465-06090",
            name="Колодки тормозные задние",
        )
        session.add_all([part_1, part_2])
        await session.flush()

        applicability_1 = PartApplicability(
            part_id=part_1.id,
            car_brand_id=car_brand.id,
            car_model_id=car_model.id,
            car_body_id=car_body.id,
            car_engine_id=car_engine.id,
        )
        applicability_2 = PartApplicability(
            part_id=part_2.id,
            car_brand_id=car_brand.id,
            car_model_id=car_model.id,
            car_body_id=car_body.id,
            car_engine_id=car_engine.id,
        )
        analog = PartAnalog(part_id=min(part_1.id, part_2.id), analog_part_id=max(part_1.id, part_2.id))
        offer_1 = PartOffer(part_id=part_1.id, price=3500, quantity_available=10)
        offer_2 = PartOffer(part_id=part_2.id, price=2800, quantity_available=8)
        session.add_all([applicability_1, applicability_2, analog, offer_1, offer_2])

        await session.commit()
        return {
            "car_brand_id": car_brand.id,
            "car_model_id": car_model.id,
            "car_body_id": car_body.id,
            "car_engine_id": car_engine.id,
            "part_brand_id": part_brand.id,
            "category_id": category.id,
            "part_id": part_1.id,
            "part_id_second": part_2.id,
        }
