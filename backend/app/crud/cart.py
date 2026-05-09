from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.cart import CartItem, PartOffer
from app.models.catalog import Part, PartBrand, Category
from app.schemas.cart import CartItemResponse, CartSummaryResponse


async def get_part_with_meta(db: AsyncSession, part_id: int) -> Part | None:
    result = await db.execute(
        select(Part)
        .options(selectinload(Part.part_brand), selectinload(Part.category))
        .where(Part.id == part_id)
    )
    return result.scalars().one_or_none()


async def get_part_offer(db: AsyncSession, part_id: int) -> PartOffer | None:
    result = await db.execute(select(PartOffer).where(PartOffer.part_id == part_id))
    return result.scalars().one_or_none()


async def get_cart_item_by_id(
    db: AsyncSession, user_id: int, item_id: int,
) -> CartItem | None:
    result = await db.execute(
        select(CartItem).where(CartItem.id == item_id, CartItem.user_id == user_id)
    )
    return result.scalars().one_or_none()


async def get_cart_item_by_part(
    db: AsyncSession, user_id: int, part_id: int,
) -> CartItem | None:
    result = await db.execute(
        select(CartItem).where(CartItem.user_id == user_id, CartItem.part_id == part_id)
    )
    return result.scalars().one_or_none()


async def list_cart_items(db: AsyncSession, user_id: int) -> list[CartItem]:
    result = await db.execute(
        select(CartItem).where(CartItem.user_id == user_id).order_by(CartItem.created_at.desc())
    )
    return list(result.scalars().all())


async def upsert_cart_item(
    db: AsyncSession, user_id: int, part_id: int, quantity: int,
) -> CartItem:
    item = await get_cart_item_by_part(db, user_id, part_id)
    if item:
        item.quantity = quantity
    else:
        item = CartItem(user_id=user_id, part_id=part_id, quantity=quantity)
        db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def update_cart_item_quantity(
    db: AsyncSession, item: CartItem, quantity: int,
) -> CartItem:
    item.quantity = quantity
    await db.commit()
    await db.refresh(item)
    return item


async def delete_cart_item(db: AsyncSession, item: CartItem) -> None:
    await db.delete(item)
    await db.commit()


async def clear_cart(db: AsyncSession, user_id: int) -> None:
    await db.execute(delete(CartItem).where(CartItem.user_id == user_id))
    await db.commit()


async def build_cart_summary(db: AsyncSession, user_id: int) -> CartSummaryResponse:
    items = await list_cart_items(db, user_id)
    response_items: list[CartItemResponse] = []
    total = 0.0
    for item in items:
        part = await get_part_with_meta(db, item.part_id)
        offer = await get_part_offer(db, item.part_id)
        if not part or not offer:
            continue
        unit_price = float(offer.price)
        subtotal = unit_price * item.quantity
        total += subtotal
        response_items.append(
            CartItemResponse(
                id=item.id,
                part_id=part.id,
                part_name=part.name,
                article=part.article,
                part_brand=part.part_brand.name if isinstance(part.part_brand, PartBrand) else "",
                category=part.category.name if isinstance(part.category, Category) else "",
                quantity=item.quantity,
                unit_price=unit_price,
                subtotal=subtotal,
                created_at=item.created_at,
                updated_at=item.updated_at,
            )
        )
    return CartSummaryResponse(items=response_items, total=total)
