import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    register = await client.post(
        "/api/auth/register",
        json={
            "email": "new_user@example.com",
            "username": "new_user",
            "password": "password123",
        },
    )
    assert register.status_code == 200, register.text
    assert "access_token" in register.json()

    login = await client.post(
        "/api/auth/login",
        json={"username": "new_user", "password": "password123"},
    )
    assert login.status_code == 200, login.text
    assert "access_token" in login.json()


@pytest.mark.asyncio
async def test_catalog_brands_models_parts_and_part_detail(
    client: AsyncClient,
    catalog_seed,
):
    brands = await client.get("/api/catalog/car-brands")
    assert brands.status_code == 200
    assert any(item["id"] == catalog_seed["car_brand_id"] for item in brands.json())

    models = await client.get(f"/api/catalog/car-brands/{catalog_seed['car_brand_id']}/models")
    assert models.status_code == 200
    assert any(item["id"] == catalog_seed["car_model_id"] for item in models.json())

    parts = await client.get(
        "/api/catalog/parts",
        params={
            "q": "Колодки",
            "car_brand_id": catalog_seed["car_brand_id"],
            "car_model_id": catalog_seed["car_model_id"],
            "part_brand_id": catalog_seed["part_brand_id"],
            "category_id": catalog_seed["category_id"],
        },
    )
    assert parts.status_code == 200
    part_ids = {item["id"] for item in parts.json()}
    assert catalog_seed["part_id"] in part_ids

    detail = await client.get(f"/api/catalog/parts/{catalog_seed['part_id']}")
    assert detail.status_code == 200
    assert detail.json()["id"] == catalog_seed["part_id"]
    assert len(detail.json()["applicability"]) >= 1


@pytest.mark.asyncio
async def test_catalog_analogs_smoke(client: AsyncClient, catalog_seed):
    analogs = await client.get(f"/api/catalog/parts/{catalog_seed['part_id']}/analogs")
    assert analogs.status_code == 200
    returned_ids = {item["id"] for item in analogs.json()}
    assert catalog_seed["part_id_second"] in returned_ids


@pytest.mark.asyncio
async def test_cart_add_update_checkout_and_clear(
    client: AsyncClient,
    client_headers,
    catalog_seed,
):
    add = await client.post(
        "/api/cart/items",
        headers=client_headers,
        json={"part_id": catalog_seed["part_id"], "quantity": 1},
    )
    assert add.status_code == 200, add.text
    cart = add.json()
    assert len(cart["items"]) == 1
    item_id = cart["items"][0]["id"]

    update = await client.patch(
        f"/api/cart/items/{item_id}",
        headers=client_headers,
        json={"quantity": 2},
    )
    assert update.status_code == 200, update.text
    assert update.json()["items"][0]["quantity"] == 2

    checkout = await client.post(
        "/api/cart/checkout",
        headers=client_headers,
        json={
            "delivery_address": "Якутск, Тестовая 1",
            "cargo_size": "small",
            "comment": "test checkout",
        },
    )
    assert checkout.status_code == 200, checkout.text
    order = checkout.json()
    assert order["client_id"] is not None
    assert len(order["items"]) == 1
    assert order["items"][0]["part_id"] == catalog_seed["part_id"]

    cart_after = await client.get("/api/cart", headers=client_headers)
    assert cart_after.status_code == 200
    assert cart_after.json()["items"] == []


@pytest.mark.asyncio
async def test_forbid_access_to_foreign_order(
    client: AsyncClient,
    client_headers,
    other_client_headers,
    catalog_seed,
):
    await client.post(
        "/api/cart/items",
        headers=client_headers,
        json={"part_id": catalog_seed["part_id"], "quantity": 1},
    )
    checkout = await client.post(
        "/api/cart/checkout",
        headers=client_headers,
        json={"delivery_address": "Якутск, Тестовая 1", "cargo_size": "small"},
    )
    assert checkout.status_code == 200
    order_id = checkout.json()["id"]

    forbidden = await client.get(f"/api/orders/{order_id}", headers=other_client_headers)
    assert forbidden.status_code == 403


@pytest.mark.asyncio
async def test_mock_payment_only_owner_and_no_repeat(
    client: AsyncClient,
    client_headers,
    other_client_headers,
    catalog_seed,
):
    await client.post(
        "/api/cart/items",
        headers=client_headers,
        json={"part_id": catalog_seed["part_id"], "quantity": 1},
    )
    checkout = await client.post(
        "/api/cart/checkout",
        headers=client_headers,
        json={"delivery_address": "Якутск, Тестовая 1", "cargo_size": "small"},
    )
    assert checkout.status_code == 200
    order_id = checkout.json()["id"]

    forbidden = await client.post(f"/api/orders/{order_id}/pay/mock", headers=other_client_headers)
    assert forbidden.status_code == 403

    paid = await client.post(f"/api/orders/{order_id}/pay/mock", headers=client_headers)
    assert paid.status_code == 200, paid.text
    assert paid.json()["payment_status"] == "paid"
    assert paid.json()["payment_id"] == f"mock-{order_id}"

    repeat = await client.post(f"/api/orders/{order_id}/pay/mock", headers=client_headers)
    assert repeat.status_code == 400


@pytest.mark.asyncio
async def test_admin_orders_endpoint_admin_only(
    client: AsyncClient,
    client_headers,
    admin_headers,
    catalog_seed,
):
    # ensure at least one order exists
    await client.post(
        "/api/cart/items",
        headers=client_headers,
        json={"part_id": catalog_seed["part_id"], "quantity": 1},
    )
    await client.post(
        "/api/cart/checkout",
        headers=client_headers,
        json={"delivery_address": "Якутск, Тестовая 1", "cargo_size": "small"},
    )

    as_admin = await client.get("/api/admin/orders", headers=admin_headers)
    assert as_admin.status_code == 200, as_admin.text
    assert "items" in as_admin.json()

    as_client = await client.get("/api/admin/orders", headers=client_headers)
    assert as_client.status_code == 403
