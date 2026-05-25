from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order
import random
import datetime

router = APIRouter()

@router.post("/refresh")
async def refresh_dashboard():
    # In a real app, this would invalidate caches
    return {"status": "success", "message": "Dashboard data refreshed successfully"}

@router.post("/seed")
async def seed_database(db: AsyncSession = Depends(get_db)):
    # Check if data already exists
    result = await db.execute(select(Product).limit(1))
    if result.scalar_one_or_none() is not None:
        return {"status": "skipped", "message": "Database already seeded"}

    # Seed Products
    products_data = [
        {"name": "Enterprise License", "category": "Software", "price": 5000.0},
        {"name": "Cloud Storage", "category": "Services", "price": 1000.0},
        {"name": "Support Package", "category": "Services", "price": 2500.0},
        {"name": "Implementation Fee", "category": "Training", "price": 1500.0},
        {"name": "Server Rack", "category": "Hardware", "price": 8000.0},
    ]
    
    products = [Product(**p) for p in products_data]
    db.add_all(products)
    await db.flush() # flush to get IDs

    # Seed Customers
    customers_data = [
        {"name": "Acme Corp", "email": "acme@example.com", "country": "United States"},
        {"name": "Global Tech", "email": "global@example.com", "country": "United Kingdom"},
        {"name": "DataSys", "email": "data@example.com", "country": "Germany"},
        {"name": "Innovate Inc", "email": "innovate@example.com", "country": "India"},
        {"name": "Oceanic", "email": "oceanic@example.com", "country": "Australia"},
    ]
    
    customers = [Customer(**c) for c in customers_data]
    db.add_all(customers)
    await db.flush()

    # Seed Orders
    now = datetime.datetime.utcnow()
    orders = []
    
    # Generate random orders over the last year
    for _ in range(100):
        customer = random.choice(customers)
        product = random.choice(products)
        quantity = random.randint(1, 5)
        days_ago = random.randint(0, 360)
        order_date = now - datetime.timedelta(days=days_ago)
        
        orders.append(Order(
            customer_id=customer.id,
            product_id=product.id,
            quantity=quantity,
            total_price=product.price * quantity,
            order_date=order_date
        ))
        
    db.add_all(orders)
    await db.commit()
    
    return {"status": "success", "message": "Database successfully seeded with mock data"}
