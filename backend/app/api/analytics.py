from __future__ import annotations

import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy import (
    select, func, Table, MetaData, Column, Text, Float, Integer, case, text
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.dynamic_session import get_org_engine
from app.auth.deps import get_current_user
from app.models.user import User
from app.models.datasource import DataSource

router = APIRouter()


# ── Public schema for datasource list ────────────────────────────────────────

class DataSourcePublic(BaseModel):
    id: int
    name: str
    db_type: str
    datasource_key: Optional[str]
    is_active: bool
    is_default: bool
    status: str

    class Config:
        from_attributes = True


@router.get("/my-datasources", response_model=list[DataSourcePublic])
async def get_my_datasources(
    app_db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.organisation_id:
        return []
    rows = (await app_db.execute(
        select(DataSource)
        .where(DataSource.organisation_id == current_user.organisation_id,
               DataSource.is_active == True)
        .order_by(DataSource.is_default.desc(), DataSource.name)
    )).scalars().all()
    return rows


# ── Orders table — no schema so it works on both PostgreSQL and MySQL ─────────

_meta = MetaData()
Orders = Table(
    'Orders', _meta,
    Column('Row ID',        Integer, primary_key=True),
    Column('Order_ID',      Text),
    Column('Order_Date',    Text),
    Column('Ship_Date',     Text),
    Column('ShipMode',      Text),
    Column('Customer ID',   Text),
    Column('CustomerName',  Text),
    Column('Segment',       Text),
    Column('City',          Text),
    Column('State',         Text),
    Column('Country',       Text),
    Column('PostalCode',    Text),
    Column('Market',        Text),
    Column('Region',        Text),
    Column('ProductID',     Text),
    Column('Category',      Text),
    Column('Sub-Category',  Text),
    Column('ProductName',   Text),
    Column('Sales',         Float),
    Column('Quantity',      Integer),
    Column('Discount',      Float),
    Column('Profit',        Float),
    Column('ShippingCost',  Float),
    Column('OrderPriority', Text),
)


# ── DB-type aware date helpers ────────────────────────────────────────────────

def _parse_date(col, db_type: str):
    """Parse a 'DD-MM-YYYY' text column into a date value."""
    if db_type == 'mysql':
        return func.str_to_date(col, '%d-%m-%Y')
    return func.to_date(col, 'DD-MM-YYYY')          # postgres / redshift


def _trunc_month(date_expr, db_type: str):
    """Truncate date expression to the first day of its month."""
    if db_type == 'mysql':
        return func.date_format(date_expr, '%Y-%m-01')
    return func.date_trunc('month', date_expr)       # postgres


def _extract_year(date_expr, db_type: str):
    if db_type == 'mysql':
        return func.year(date_expr)
    return func.extract('year', date_expr)


def _date_diff_days(end_col, start_col, db_type: str):
    """Number of days between two date columns (both text DD-MM-YYYY)."""
    if db_type == 'mysql':
        return func.datediff(
            func.str_to_date(end_col, '%d-%m-%Y'),
            func.str_to_date(start_col, '%d-%m-%Y'),
        )
    return func.to_date(end_col, 'DD-MM-YYYY') - func.to_date(start_col, 'DD-MM-YYYY')


def _fmt_month(val) -> str:
    """Convert a month value (datetime or str) to 'Jan 2023' label."""
    if val is None:
        return ''
    if isinstance(val, str):
        try:
            val = datetime.datetime.strptime(val[:7], '%Y-%m')
        except ValueError:
            return val
    return val.strftime('%b %Y')


def _fmt_mon(val) -> str:
    """Short month label 'Jan'."""
    if val is None:
        return ''
    if isinstance(val, str):
        try:
            val = datetime.datetime.strptime(val[:7], '%Y-%m')
        except ValueError:
            return val
    return val.strftime('%b')


# Must match `requiredDatasourceKey` set in frontend/src/config/dashboards.ts for
# the sales dashboard. The backend uses this key to pick the right active datasource
# when an org has multiple databases active simultaneously (e.g. sales_db + procurement_db).
_SALES_DS_KEY = "sales_db"


# ── Dependency: resolve client engine for current user ────────────────────────

async def _client(
    app_db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """FastAPI dependency — returns (engine, db_type) for the org's sales DB."""
    if not current_user.organisation_id:
        raise HTTPException(status_code=400, detail="You are not assigned to an organisation.")
    return await get_org_engine(current_user.organisation_id, app_db, datasource_key=_SALES_DS_KEY)


# ── Filter helpers ────────────────────────────────────────────────────────────

def apply_filters(query, db_type: str, category=None, region=None,
                  time_period=None, sub_category=None, segment=None):
    if category and category != 'All Categories':
        query = query.where(Orders.c.Category == category)
    if region and region != 'All Regions':
        query = query.where(Orders.c.Country == region)
    if sub_category and sub_category != 'All Sub-Categories':
        query = query.where(Orders.c['Sub-Category'] == sub_category)
    if segment and segment != 'All Segments':
        query = query.where(Orders.c.Segment == segment)
    if time_period and time_period != 'All Time':
        now = datetime.datetime.utcnow()
        start_date = None
        if time_period == 'Last 7 Days':
            start_date = now - datetime.timedelta(days=7)
        elif time_period == 'Last 30 Days':
            start_date = now - datetime.timedelta(days=30)
        elif time_period == 'This Year':
            start_date = datetime.datetime(now.year, 1, 1)
        if start_date:
            query = query.where(_parse_date(Orders.c.Order_Date, db_type) >= start_date)
    return query


def apply_executive_filters(query, db_type: str, market=None, segment=None, year=None):
    if market and market != 'All Markets':
        query = query.where(Orders.c.Market == market)
    if segment and segment != 'All Segments':
        query = query.where(Orders.c.Segment == segment)
    if year and year != 'All Years':
        od = _parse_date(Orders.c.Order_Date, db_type)
        query = query.where(_extract_year(od, db_type) == int(year))
    return query


def apply_geography_filters(query, db_type: str, market=None, region=None,
                            category=None, year=None):
    if market and market != 'All Markets':
        query = query.where(Orders.c.Market == market)
    if region and region != 'All Regions':
        query = query.where(Orders.c.Region == region)
    if category and category != 'All Categories':
        query = query.where(Orders.c.Category == category)
    if year and year != 'All Years':
        od = _parse_date(Orders.c.Order_Date, db_type)
        query = query.where(_extract_year(od, db_type) == int(year))
    return query


def apply_shipping_filters(query, db_type: str, region=None, ship_mode=None, time_period=None):
    if region and region != 'All Regions':
        query = query.where(Orders.c.Region == region)
    if ship_mode and ship_mode != 'All Ship Modes':
        query = query.where(Orders.c.ShipMode == ship_mode)
    if time_period and time_period != 'All Time':
        now = datetime.datetime.utcnow()
        start_date = None
        if time_period == 'Last 7 Days':
            start_date = now - datetime.timedelta(days=7)
        elif time_period == 'Last 30 Days':
            start_date = now - datetime.timedelta(days=30)
        elif time_period == 'This Year':
            start_date = datetime.datetime(now.year, 1, 1)
        if start_date:
            query = query.where(_parse_date(Orders.c.Order_Date, db_type) >= start_date)
    return query


def _ship_days(db_type: str):
    return _date_diff_days(Orders.c.Ship_Date, Orders.c.Order_Date, db_type)


def _expected_days():
    return case(
        (Orders.c.ShipMode == 'Same Day',    1),
        (Orders.c.ShipMode == 'First Class', 3),
        (Orders.c.ShipMode == 'Second Class', 7),
        else_=14,
    )


def _is_on_time(db_type: str):
    return case((_ship_days(db_type) <= _expected_days(), 1), else_=0)


# ── Sales dashboard endpoints ─────────────────────────────────────────────────

@router.get("/filters")
async def get_filter_options(client=Depends(_client)):
    engine, db_type = client
    async with engine.connect() as conn:
        cats    = (await conn.execute(select(Orders.c.Category.distinct()).order_by(Orders.c.Category))).fetchall()
        regions = (await conn.execute(select(Orders.c.Country.distinct()).order_by(Orders.c.Country))).fetchall()
        subs    = (await conn.execute(select(Orders.c['Sub-Category'].distinct()).order_by(Orders.c['Sub-Category']))).fetchall()
        segs    = (await conn.execute(select(Orders.c.Segment.distinct()).order_by(Orders.c.Segment))).fetchall()
    return {
        "categories":     [r[0] for r in cats    if r[0]],
        "regions":        [r[0] for r in regions if r[0]],
        "sub_categories": [r[0] for r in subs    if r[0]],
        "segments":       [r[0] for r in segs    if r[0]],
    }


@router.get("/kpis")
async def get_dashboard_kpis(client=Depends(_client)):
    engine, db_type = client
    async with engine.connect() as conn:
        od = _parse_date(Orders.c.Order_Date, db_type)
        month_expr = _trunc_month(od, db_type)

        latest_raw = (await conn.execute(
            select(month_expr).order_by(month_expr.desc()).limit(1)
        )).scalar_one_or_none()

        total_revenue = float((await conn.execute(
            select(func.coalesce(func.sum(Orders.c.Sales), 0))
        )).scalar_one())

        active_customers = int((await conn.execute(
            select(func.count(func.distinct(Orders.c['Customer ID'])))
        )).scalar_one())

        sales_growth = 0.0
        if latest_raw is not None:
            if isinstance(latest_raw, str):
                latest_month = datetime.datetime.strptime(latest_raw[:7], '%Y-%m')
            else:
                latest_month = latest_raw
            current_start  = latest_month
            previous_start = (latest_month - datetime.timedelta(days=1)).replace(day=1)
            next_start     = (current_start + datetime.timedelta(days=32)).replace(day=1)

            cur_rev = float((await conn.execute(
                select(func.coalesce(func.sum(Orders.c.Sales), 0))
                .where(od >= current_start).where(od < next_start)
            )).scalar_one())
            prev_rev = float((await conn.execute(
                select(func.coalesce(func.sum(Orders.c.Sales), 0))
                .where(od >= previous_start).where(od < current_start)
            )).scalar_one())

            if prev_rev > 0:
                sales_growth = (cur_rev - prev_rev) / prev_rev * 100
            elif cur_rev > 0:
                sales_growth = 100.0

        total_orders = float((await conn.execute(
            select(func.coalesce(func.count(Orders.c['Row ID']), 0))
        )).scalar_one())

        aov = round(total_revenue / total_orders, 2) if total_orders > 0 else 0.0

    return {
        "total_revenue": total_revenue,
        "active_customers": active_customers,
        "sales_growth": round(sales_growth, 1),
        "average_order_value": aov,
        "total_revenue_change": f"{sales_growth:+.1f}%",
        "active_customers_change": "+5.2%",
        "sales_growth_change": f"{sales_growth:+.1f}%",
        "average_order_value_change": "+0.0%",
    }


@router.get("/revenue-country")
async def get_revenue_by_country(
    category: Optional[str] = Query(None), region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None), sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None), client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        q = select(Orders.c.Country.label('country'), func.sum(Orders.c.Sales).label('revenue'))
        q = apply_filters(q, db_type, category, region, time_period, sub_category, segment)
        q = q.group_by(Orders.c.Country).order_by(func.sum(Orders.c.Sales).desc())
        data = (await conn.execute(q)).fetchall()
    return [{"country": r.country, "revenue": float(r.revenue or 0)} for r in data]


@router.get("/sales-trend")
async def get_sales_trend(
    category: Optional[str] = Query(None), region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None), sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None), client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        od = _parse_date(Orders.c.Order_Date, db_type)
        month_expr = _trunc_month(od, db_type)
        q = select(month_expr.label('month'), func.sum(Orders.c.Sales).label('sales'))
        q = apply_filters(q, db_type, category, region, time_period, sub_category, segment)
        q = q.group_by(month_expr).order_by(month_expr)
        data = (await conn.execute(q)).fetchall()
    return [{"month": _fmt_mon(r.month), "sales": float(r.sales or 0)} for r in data if r.month]


@router.get("/top-products")
async def get_top_products(
    category: Optional[str] = Query(None), region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None), sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None), client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        q = select(Orders.c.ProductName.label('product'), func.sum(Orders.c.Sales).label('revenue'))
        q = apply_filters(q, db_type, category, region, time_period, sub_category, segment)
        q = q.group_by(Orders.c.ProductName).order_by(func.sum(Orders.c.Sales).desc()).limit(5)
        data = (await conn.execute(q)).fetchall()
    return [{"product": r.product, "revenue": float(r.revenue or 0)} for r in data]


@router.get("/monthly-revenue")
async def get_monthly_revenue(
    category: Optional[str] = Query(None), region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None), sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None), client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        od = _parse_date(Orders.c.Order_Date, db_type)
        month_expr = _trunc_month(od, db_type)
        q = select(month_expr.label('month'), func.sum(Orders.c.Sales).label('revenue'))
        q = apply_filters(q, db_type, category, region, time_period, sub_category, segment)
        q = q.group_by(month_expr).order_by(month_expr)
        data = (await conn.execute(q)).fetchall()
    return [{"month": _fmt_month(r.month), "revenue": float(r.revenue or 0)} for r in data if r.month]


@router.get("/orders-category")
async def get_orders_by_category(
    category: Optional[str] = Query(None), region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None), sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None), client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        q = select(Orders.c.Category.label('category'), func.count().label('value'))
        q = apply_filters(q, db_type, category, region, time_period, sub_category, segment)
        q = q.group_by(Orders.c.Category).order_by(func.count().desc())
        data = (await conn.execute(q)).fetchall()
    return [{"category": r.category, "value": int(r.value or 0)} for r in data]


@router.get("/profit-by-category")
async def get_profit_by_category(
    category: Optional[str] = Query(None), region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None), sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None), client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        q = select(
            Orders.c.Category.label('category'),
            func.sum(Orders.c.Sales).label('revenue'),
            func.sum(Orders.c.Profit).label('profit'),
        )
        q = apply_filters(q, db_type, category, region, time_period, sub_category, segment)
        q = q.group_by(Orders.c.Category).order_by(func.sum(Orders.c.Sales).desc())
        data = (await conn.execute(q)).fetchall()
    return [{"category": r.category, "revenue": float(r.revenue or 0), "profit": float(r.profit or 0)} for r in data]


@router.get("/discount-profit-scatter")
async def get_discount_profit_scatter(
    category: Optional[str] = Query(None), region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None), sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None), client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        q = select(Orders.c.Discount.label('discount'), Orders.c.Profit.label('profit'), Orders.c.Sales.label('sales'))
        q = apply_filters(q, db_type, category, region, time_period, sub_category, segment)
        q = q.order_by(Orders.c.Profit.desc()).limit(200)
        data = (await conn.execute(q)).fetchall()
    return [{"discount": float(r.discount or 0), "profit": float(r.profit or 0), "sales": float(r.sales or 0)} for r in data]


@router.get("/shipping-cost-region")
async def get_shipping_cost_by_region(
    category: Optional[str] = Query(None), region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None), sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None), client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        q = select(Orders.c.Region.label('region'), func.sum(Orders.c.ShippingCost).label('shipping_cost'))
        q = apply_filters(q, db_type, category, region, time_period, sub_category, segment)
        q = q.group_by(Orders.c.Region).order_by(func.sum(Orders.c.ShippingCost).desc())
        data = (await conn.execute(q)).fetchall()
    return [{"region": r.region, "shipping_cost": float(r.shipping_cost or 0)} for r in data]


@router.get("/order-priority")
async def get_order_priority_distribution(
    category: Optional[str] = Query(None), region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None), sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None), client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        q = select(Orders.c.OrderPriority.label('priority'), func.count().label('value'))
        q = apply_filters(q, db_type, category, region, time_period, sub_category, segment)
        q = q.group_by(Orders.c.OrderPriority).order_by(func.count().desc())
        data = (await conn.execute(q)).fetchall()
    return [{"priority": r.priority, "value": int(r.value or 0)} for r in data]


@router.get("/segment-sales")
async def get_segment_sales(
    category: Optional[str] = Query(None), region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None), sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None), client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        q = select(Orders.c.Segment.label('segment'), Orders.c.Region.label('region'), func.sum(Orders.c.Sales).label('sales'))
        q = apply_filters(q, db_type, category, region, time_period, sub_category, segment)
        q = q.group_by(Orders.c.Segment, Orders.c.Region).order_by(Orders.c.Segment, Orders.c.Region)
        data = (await conn.execute(q)).fetchall()
    return [{"segment": r.segment, "region": r.region, "sales": float(r.sales or 0)} for r in data]


@router.get("/product-kpis")
async def get_product_kpis(
    category: Optional[str] = Query(None), region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None), sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None), client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        q = select(
            func.coalesce(func.sum(Orders.c.Profit), 0).label('profit'),
            func.coalesce(func.sum(Orders.c.Sales), 0).label('revenue'),
            func.coalesce(func.sum(Orders.c.Quantity), 0).label('units'),
            func.count(func.distinct(Orders.c.ProductName)).label('products'),
            func.coalesce(func.avg(Orders.c.Discount), 0).label('avg_discount'),
            func.count().label('total_lines'),
            func.coalesce(func.sum(case((Orders.c.Profit < 0, 1), else_=0)), 0).label('loss_lines'),
        )
        q = apply_filters(q, db_type, category, region, time_period, sub_category, segment)
        row = (await conn.execute(q)).one()

    profit      = float(row.profit or 0)
    revenue     = float(row.revenue or 0)
    units       = int(row.units or 0)
    products    = int(row.products or 0)
    avg_discount= round(float(row.avg_discount or 0) * 100, 1)
    total_lines = int(row.total_lines or 0)
    loss_lines  = int(row.loss_lines or 0)
    margin      = round(profit / revenue * 100, 1) if revenue > 0 else 0.0
    loss_pct    = round(loss_lines / total_lines * 100, 1) if total_lines > 0 else 0.0
    return {"profit": profit, "profit_margin": margin, "total_units": units,
            "unique_products": products, "avg_discount": avg_discount, "loss_orders_pct": loss_pct}


@router.get("/product-conversion-funnel")
async def get_product_conversion_funnel(
    category: Optional[str] = Query(None), region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None), sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None), client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        async def count_where(extra=None):
            q = select(func.count()).select_from(Orders)
            q = apply_filters(q, db_type, category, region, time_period, sub_category, segment)
            if extra is not None:
                q = q.where(extra)
            return int((await conn.execute(q)).scalar_one() or 0)

        total     = await count_where()
        profitable= await count_where(Orders.c.Profit > 0)
        high_val  = await count_where(Orders.c.Sales > 200)
        strong    = await count_where((Orders.c.Sales > 200) & (Orders.c.Profit > 0))
        premium   = await count_where(Orders.c.Sales > 500)

    return [
        {"stage": "Total Orders",          "value": total},
        {"stage": "Profitable Orders",     "value": profitable},
        {"stage": "High-Value (>$200)",    "value": high_val},
        {"stage": "Profitable High-Value", "value": strong},
        {"stage": "Premium (>$500)",       "value": premium},
    ]


@router.get("/product-revenue-profit-scatter")
async def get_product_revenue_profit_scatter(
    category: Optional[str] = Query(None), region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None), sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None), client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        q = select(
            Orders.c.ProductName.label('product'), Orders.c.Category.label('category'),
            func.sum(Orders.c.Sales).label('revenue'), func.sum(Orders.c.Profit).label('profit'),
            func.sum(Orders.c.Quantity).label('quantity'),
        )
        q = apply_filters(q, db_type, category, region, time_period, sub_category, segment)
        q = q.group_by(Orders.c.ProductName, Orders.c.Category).order_by(func.sum(Orders.c.Sales).desc()).limit(120)
        data = (await conn.execute(q)).fetchall()
    return [{"product": r.product, "category": r.category, "revenue": float(r.revenue or 0),
             "profit": float(r.profit or 0), "quantity": int(r.quantity or 0)} for r in data]


# ── Geography endpoints ───────────────────────────────────────────────────────

@router.get("/geography/filters")
async def get_geography_filter_options(client=Depends(_client)):
    engine, db_type = client
    async with engine.connect() as conn:
        od = _parse_date(Orders.c.Order_Date, db_type)
        markets  = (await conn.execute(select(Orders.c.Market.distinct()).order_by(Orders.c.Market))).fetchall()
        regions  = (await conn.execute(select(Orders.c.Region.distinct()).order_by(Orders.c.Region))).fetchall()
        cats     = (await conn.execute(select(Orders.c.Category.distinct()).order_by(Orders.c.Category))).fetchall()
        year_expr = _extract_year(od, db_type).label('year')
        years_r  = (await conn.execute(
            select(year_expr).distinct().order_by(year_expr)
        )).fetchall()
    return {
        "markets":    [r[0] for r in markets if r[0]],
        "regions":    [r[0] for r in regions if r[0]],
        "categories": [r[0] for r in cats    if r[0]],
        "years":      [str(int(r[0])) for r in years_r if r[0]],
    }


@router.get("/geography/kpis")
async def get_geography_kpis(
    market: Optional[str] = Query(None), region: Optional[str] = Query(None),
    category: Optional[str] = Query(None), year: Optional[str] = Query(None),
    client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        q = select(
            func.count(func.distinct(Orders.c.Country)).label('countries'),
            func.count(func.distinct(Orders.c.Region)).label('regions'),
            func.coalesce(func.sum(Orders.c.Sales), 0).label('sales'),
            func.coalesce(func.sum(Orders.c.Profit), 0).label('profit'),
            func.coalesce(func.sum(Orders.c.ShippingCost), 0).label('shipping_cost'),
        )
        q = apply_geography_filters(q, db_type, market, region, category, year)
        summary = (await conn.execute(q)).one()

        tq = select(Orders.c.Country.label('country'), func.sum(Orders.c.Sales).label('sales'))
        tq = apply_geography_filters(tq, db_type, market, region, category, year)
        tq = tq.group_by(Orders.c.Country).order_by(func.sum(Orders.c.Sales).desc()).limit(1)
        top = (await conn.execute(tq)).first()

    sales  = float(summary.sales or 0)
    profit = float(summary.profit or 0)
    margin = round(profit / sales * 100, 1) if sales else 0.0
    return {
        "countries": int(summary.countries or 0), "regions": int(summary.regions or 0),
        "sales": sales, "profit": profit, "profit_margin": margin,
        "shipping_cost": float(summary.shipping_cost or 0),
        "top_country": top.country if top else "N/A",
        "top_country_sales": float(top.sales or 0) if top else 0,
    }


@router.get("/geography/country-performance")
async def get_geography_country_performance(
    market: Optional[str] = Query(None), region: Optional[str] = Query(None),
    category: Optional[str] = Query(None), year: Optional[str] = Query(None),
    client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        q = select(
            Orders.c.Country.label('country'), Orders.c.Market.label('market'),
            func.sum(Orders.c.Sales).label('sales'), func.sum(Orders.c.Profit).label('profit'),
            func.count(func.distinct(Orders.c.Order_ID)).label('orders'),
        )
        q = apply_geography_filters(q, db_type, market, region, category, year)
        q = q.group_by(Orders.c.Country, Orders.c.Market).order_by(func.sum(Orders.c.Sales).desc())
        data = (await conn.execute(q)).fetchall()
    return [{"country": r.country, "market": r.market, "sales": float(r.sales or 0),
             "profit": float(r.profit or 0), "orders": int(r.orders or 0)} for r in data]


@router.get("/geography/market-sales")
async def get_geography_market_sales(
    market: Optional[str] = Query(None), region: Optional[str] = Query(None),
    category: Optional[str] = Query(None), year: Optional[str] = Query(None),
    client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        q = select(
            Orders.c.Market.label('market'), func.sum(Orders.c.Sales).label('sales'),
            func.sum(Orders.c.Profit).label('profit'),
        )
        q = apply_geography_filters(q, db_type, market, region, category, year)
        q = q.group_by(Orders.c.Market).order_by(func.sum(Orders.c.Sales).desc())
        data = (await conn.execute(q)).fetchall()
    return [{"market": r.market, "sales": float(r.sales or 0), "profit": float(r.profit or 0)} for r in data]


@router.get("/geography/monthly-market-trend")
async def get_geography_monthly_market_trend(
    market: Optional[str] = Query(None), region: Optional[str] = Query(None),
    category: Optional[str] = Query(None), year: Optional[str] = Query(None),
    client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        od = _parse_date(Orders.c.Order_Date, db_type)
        month_expr = _trunc_month(od, db_type)
        q = select(month_expr.label('month'), Orders.c.Market.label('market'), func.sum(Orders.c.Sales).label('sales'))
        q = apply_geography_filters(q, db_type, market, region, category, year)
        q = q.group_by(month_expr, Orders.c.Market).order_by(month_expr, Orders.c.Market)
        data = (await conn.execute(q)).fetchall()
    return [{"month": _fmt_month(r.month), "market": r.market, "sales": float(r.sales or 0)} for r in data if r.month]


@router.get("/geography/region-category")
async def get_geography_region_category(
    market: Optional[str] = Query(None), region: Optional[str] = Query(None),
    category: Optional[str] = Query(None), year: Optional[str] = Query(None),
    client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        q = select(
            Orders.c.Region.label('region'), Orders.c.Category.label('category'),
            func.sum(Orders.c.Sales).label('sales'),
        )
        q = apply_geography_filters(q, db_type, market, region, category, year)
        q = q.group_by(Orders.c.Region, Orders.c.Category).order_by(Orders.c.Region, Orders.c.Category)
        data = (await conn.execute(q)).fetchall()
    return [{"region": r.region, "category": r.category, "sales": float(r.sales or 0)} for r in data]


@router.get("/geography/sankey")
async def get_geography_sankey(
    market: Optional[str] = Query(None), region: Optional[str] = Query(None),
    category: Optional[str] = Query(None), year: Optional[str] = Query(None),
    client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        q = select(
            Orders.c.Market.label('market'), Orders.c.Region.label('region'),
            Orders.c.Category.label('category'), func.sum(Orders.c.Sales).label('sales'),
        )
        q = apply_geography_filters(q, db_type, market, region, category, year)
        q = q.group_by(Orders.c.Market, Orders.c.Region, Orders.c.Category)
        data = (await conn.execute(q)).fetchall()

    nodes, link_values = set(), {}
    for r in data:
        mn, rn, cn = f"Market: {r.market}", f"Region: {r.region}", f"Category: {r.category}"
        nodes.update([mn, rn, cn])
        link_values[(mn, rn)] = link_values.get((mn, rn), 0) + float(r.sales or 0)
        link_values[(rn, cn)] = link_values.get((rn, cn), 0) + float(r.sales or 0)
    return {
        "nodes": [{"name": n} for n in sorted(nodes)],
        "links": [{"source": s, "target": t, "value": v} for (s, t), v in link_values.items() if v > 0],
    }


@router.get("/geography/drilldown")
async def get_geography_drilldown(
    level: str = Query("market"),
    market_value: Optional[str] = Query(None), region_value: Optional[str] = Query(None),
    country_value: Optional[str] = Query(None),
    market: Optional[str] = Query(None), region: Optional[str] = Query(None),
    category: Optional[str] = Query(None), year: Optional[str] = Query(None),
    client=Depends(_client),
):
    engine, db_type = client
    levels = {
        "market":  (Orders.c.Market,  "region"),
        "region":  (Orders.c.Region,  "country"),
        "country": (Orders.c.Country, "city"),
        "city":    (Orders.c.City,    None),
    }
    group_col, next_level = levels.get(level, levels["market"])
    async with engine.connect() as conn:
        q = select(
            group_col.label('name'), func.sum(Orders.c.Sales).label('sales'),
            func.sum(Orders.c.Profit).label('profit'),
            func.count(func.distinct(Orders.c.Order_ID)).label('orders'),
        )
        q = apply_geography_filters(q, db_type, market, region, category, year)
        if market_value:  q = q.where(Orders.c.Market == market_value)
        if region_value:  q = q.where(Orders.c.Region == region_value)
        if country_value: q = q.where(Orders.c.Country == country_value)
        q = q.group_by(group_col).order_by(func.sum(Orders.c.Sales).desc()).limit(18)
        data = (await conn.execute(q)).fetchall()
    return {
        "level": level, "next_level": next_level,
        "items": [{"name": r.name, "sales": float(r.sales or 0),
                   "profit": float(r.profit or 0), "orders": int(r.orders or 0)}
                  for r in data if r.name],
    }


# ── Executive endpoints ───────────────────────────────────────────────────────

@router.get("/executive/filters")
async def get_executive_filter_options(client=Depends(_client)):
    engine, db_type = client
    async with engine.connect() as conn:
        od = _parse_date(Orders.c.Order_Date, db_type)
        markets  = (await conn.execute(select(Orders.c.Market.distinct()).order_by(Orders.c.Market))).fetchall()
        segments = (await conn.execute(select(Orders.c.Segment.distinct()).order_by(Orders.c.Segment))).fetchall()
        year_expr = _extract_year(od, db_type).label('year')
        years_r  = (await conn.execute(
            select(year_expr).distinct().order_by(year_expr)
        )).fetchall()
    return {
        "markets":  [r[0] for r in markets  if r[0]],
        "segments": [r[0] for r in segments if r[0]],
        "years":    [str(int(r[0])) for r in years_r if r[0]],
    }


@router.get("/executive/kpis")
async def get_executive_kpis(
    market: Optional[str] = Query(None), segment: Optional[str] = Query(None),
    year: Optional[str] = Query(None), client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        q = select(
            func.coalesce(func.sum(Orders.c.Sales), 0).label('revenue'),
            func.count(func.distinct(Orders.c.Order_ID)).label('orders'),
            func.count(func.distinct(Orders.c['Customer ID'])).label('customers'),
            func.count(func.distinct(Orders.c.Market)).label('markets'),
            func.count(func.distinct(Orders.c.Country)).label('countries'),
            func.coalesce(func.avg(Orders.c.Discount), 0).label('avg_discount'),
        )
        q = apply_executive_filters(q, db_type, market, segment, year)
        row = (await conn.execute(q)).one()

    revenue = float(row.revenue or 0)
    orders  = int(row.orders or 0)
    aov     = round(revenue / orders, 2) if orders > 0 else 0.0
    return {
        "revenue": revenue, "total_orders": orders, "active_customers": int(row.customers or 0),
        "active_markets": int(row.markets or 0), "active_countries": int(row.countries or 0),
        "avg_discount": round(float(row.avg_discount or 0) * 100, 1), "avg_order_value": aov,
    }


@router.get("/executive/monthly-sales-profit")
async def get_executive_monthly_sales_profit(
    market: Optional[str] = Query(None), segment: Optional[str] = Query(None),
    year: Optional[str] = Query(None), client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        od = _parse_date(Orders.c.Order_Date, db_type)
        month_expr = _trunc_month(od, db_type)
        q = select(
            month_expr.label('month'), func.sum(Orders.c.Sales).label('sales'),
            func.sum(Orders.c.Profit).label('profit'),
            func.count(func.distinct(Orders.c.Order_ID)).label('orders'),
        )
        q = apply_executive_filters(q, db_type, market, segment, year)
        q = q.group_by(month_expr).order_by(month_expr)
        data = (await conn.execute(q)).fetchall()
    return [{"month": _fmt_month(r.month), "sales": float(r.sales or 0),
             "profit": float(r.profit or 0), "orders": int(r.orders or 0)}
            for r in data if r.month]


@router.get("/executive/category-performance")
async def get_executive_category_performance(
    market: Optional[str] = Query(None), segment: Optional[str] = Query(None),
    year: Optional[str] = Query(None), client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        q = select(
            Orders.c.Category.label('category'), func.sum(Orders.c.Sales).label('sales'),
            func.sum(Orders.c.Profit).label('profit'),
            func.count(func.distinct(Orders.c.Order_ID)).label('orders'),
        )
        q = apply_executive_filters(q, db_type, market, segment, year)
        q = q.group_by(Orders.c.Category).order_by(func.sum(Orders.c.Sales).desc())
        data = (await conn.execute(q)).fetchall()
    return [{"category": r.category, "sales": float(r.sales or 0),
             "profit": float(r.profit or 0), "orders": int(r.orders or 0)} for r in data]


@router.get("/executive/segment-share")
async def get_executive_segment_share(
    market: Optional[str] = Query(None), segment: Optional[str] = Query(None),
    year: Optional[str] = Query(None), client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        q = select(
            Orders.c.Segment.label('segment'), func.sum(Orders.c.Sales).label('sales'),
            func.sum(Orders.c.Profit).label('profit'),
            func.count(func.distinct(Orders.c.Order_ID)).label('orders'),
        )
        q = apply_executive_filters(q, db_type, market, segment, year)
        q = q.group_by(Orders.c.Segment).order_by(func.sum(Orders.c.Sales).desc())
        data = (await conn.execute(q)).fetchall()
    return [{"segment": r.segment, "sales": float(r.sales or 0),
             "profit": float(r.profit or 0), "orders": int(r.orders or 0)} for r in data]


@router.get("/executive/pareto-countries")
async def get_executive_pareto_countries(
    market: Optional[str] = Query(None), segment: Optional[str] = Query(None),
    year: Optional[str] = Query(None), client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        q = select(Orders.c.Country.label('country'), func.sum(Orders.c.Sales).label('sales'))
        q = apply_executive_filters(q, db_type, market, segment, year)
        q = q.group_by(Orders.c.Country).order_by(func.sum(Orders.c.Sales).desc()).limit(12)
        rows_raw = (await conn.execute(q)).fetchall()

    display = [
        {"country": r.country, "sales": float(r.sales or 0)}
        for r in rows_raw if r.country and float(r.sales or 0) > 0
    ]

    shown_total = sum(r["sales"] for r in display)
    if shown_total == 0:
        return []

    # Cumulative % relative to the shown countries' total so the line always
    # builds from the first country's share up to 100%, making the 80% cutoff
    # visually meaningful regardless of how dominant one country is.
    cumulative = 0.0
    result = []
    for r in display:
        cumulative += r["sales"]
        result.append({
            "country": r["country"],
            "sales": r["sales"],
            "cumulative_pct": round(cumulative / shown_total * 100, 2),
        })
    return result


@router.get("/executive/profit-waterfall")
async def get_executive_profit_waterfall(
    market: Optional[str] = Query(None), segment: Optional[str] = Query(None),
    year: Optional[str] = Query(None), client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        gross_expr = func.sum(case(
            (Orders.c.Discount < 1, Orders.c.Sales / func.nullif(1 - Orders.c.Discount, 0)),
            else_=Orders.c.Sales,
        ))
        q = select(
            gross_expr.label('gross_sales'), func.sum(Orders.c.Sales).label('net_sales'),
            func.sum(Orders.c.Profit).label('profit'), func.sum(Orders.c.ShippingCost).label('shipping_cost'),
        )
        q = apply_executive_filters(q, db_type, market, segment, year)
        row = (await conn.execute(q)).one()

    gross   = float(row.gross_sales or 0)
    net     = float(row.net_sales or 0)
    profit  = float(row.profit or 0)
    ship    = float(row.shipping_cost or 0)
    disc    = max(gross - net, 0)
    opcost  = max(net - ship - profit, 0)
    return [
        {"label": "Gross Sales", "value": gross,   "type": "total"},
        {"label": "Discount",    "value": -disc,   "type": "decrease"},
        {"label": "Net Sales",   "value": net,     "type": "subtotal"},
        {"label": "Shipping",    "value": -ship,   "type": "decrease"},
        {"label": "Cost Base",   "value": -opcost, "type": "decrease"},
        {"label": "Profit",      "value": profit,  "type": "total"},
    ]


# ── Shipping endpoints ────────────────────────────────────────────────────────

@router.get("/shipping/filters")
async def get_shipping_filter_options(client=Depends(_client)):
    engine, db_type = client
    async with engine.connect() as conn:
        regions   = (await conn.execute(select(Orders.c.Region.distinct()).order_by(Orders.c.Region))).fetchall()
        shipmodes = (await conn.execute(select(Orders.c.ShipMode.distinct()).order_by(Orders.c.ShipMode))).fetchall()
    return {"regions": [r[0] for r in regions if r[0]], "ship_modes": [r[0] for r in shipmodes if r[0]]}


@router.get("/shipping/kpis")
async def get_shipping_kpis(
    region: Optional[str] = Query(None), ship_mode: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None), client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        sd = _ship_days(db_type)
        q = select(
            func.coalesce(func.sum(Orders.c.ShippingCost), 0).label('total_cost'),
            func.coalesce(func.avg(sd), 0).label('avg_days'),
            func.count(func.distinct(Orders.c.Order_ID)).label('shipments'),
            func.coalesce(func.avg(_is_on_time(db_type)), 0).label('on_time_rate'),
            func.coalesce(func.sum(case((Orders.c.ShipMode.in_(['First Class', 'Same Day']), 1), else_=0)), 0).label('express_count'),
            func.count().label('total_lines'),
        )
        q = apply_shipping_filters(q, db_type, region, ship_mode, time_period)
        row = (await conn.execute(q)).one()

    total_cost = float(row.total_cost or 0)
    shipments  = int(row.shipments or 0)
    return {
        "total_shipping_cost": total_cost,
        "avg_delivery_days": round(float(row.avg_days or 0), 1),
        "on_time_rate": round(float(row.on_time_rate or 0) * 100, 1),
        "total_shipments": shipments,
        "express_pct": round(float(row.express_count or 0) / max(int(row.total_lines or 1), 1) * 100, 1),
        "avg_cost_per_shipment": round(total_cost / max(shipments, 1), 2),
    }


@router.get("/shipping/region-performance")
async def get_shipping_region_performance(
    region: Optional[str] = Query(None), ship_mode: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None), client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        sd = _ship_days(db_type)
        q = select(
            Orders.c.Region.label('region'),
            func.count(func.distinct(Orders.c.Order_ID)).label('orders'),
            func.coalesce(func.sum(Orders.c.ShippingCost), 0).label('shipping_cost'),
            func.coalesce(func.avg(sd), 0).label('avg_days'),
            func.coalesce(func.avg(_is_on_time(db_type)), 0).label('on_time_rate'),
            func.coalesce(func.avg(Orders.c.ShippingCost), 0).label('avg_cost'),
        )
        q = apply_shipping_filters(q, db_type, region, ship_mode, time_period)
        q = q.group_by(Orders.c.Region).order_by(func.count(func.distinct(Orders.c.Order_ID)).desc()).limit(12)
        data = (await conn.execute(q)).fetchall()
    return [{"region": r.region, "orders": int(r.orders or 0), "shipping_cost": float(r.shipping_cost or 0),
             "avg_days": round(float(r.avg_days or 0), 1),
             "on_time_rate": round(float(r.on_time_rate or 0) * 100, 1),
             "avg_cost": round(float(r.avg_cost or 0), 2)} for r in data if r.region]


@router.get("/shipping/heatmap")
async def get_shipping_heatmap(
    region: Optional[str] = Query(None), ship_mode: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None), client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        q = select(
            Orders.c.Region.label('region'), Orders.c.ShipMode.label('ship_mode'),
            func.coalesce(func.avg(Orders.c.ShippingCost), 0).label('avg_cost'),
            func.count().label('orders'),
        )
        q = apply_shipping_filters(q, db_type, region, ship_mode, time_period)
        q = q.group_by(Orders.c.Region, Orders.c.ShipMode).order_by(Orders.c.Region, Orders.c.ShipMode)
        data = (await conn.execute(q)).fetchall()
    return [{"region": r.region, "ship_mode": r.ship_mode,
             "avg_cost": round(float(r.avg_cost or 0), 2), "orders": int(r.orders or 0)}
            for r in data if r.region and r.ship_mode]


@router.get("/shipping/delayed-orders")
async def get_delayed_orders(
    region: Optional[str] = Query(None), ship_mode: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None), client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        sd = _ship_days(db_type)
        ed = _expected_days()
        q = select(
            Orders.c.Order_ID.label('order_id'), Orders.c.CustomerName.label('customer'),
            Orders.c.Region.label('region'), Orders.c.ShipMode.label('ship_mode'),
            Orders.c.Order_Date.label('order_date'), Orders.c.Ship_Date.label('ship_date'),
            sd.label('actual_days'), ed.label('expected_days'), (sd - ed).label('delay_days'),
            Orders.c.Sales.label('sales'), Orders.c.OrderPriority.label('priority'),
        )
        q = apply_shipping_filters(q, db_type, region, ship_mode, time_period)
        q = q.where(sd > ed).order_by((sd - ed).desc()).limit(300)
        data = (await conn.execute(q)).fetchall()
    return [{"order_id": r.order_id, "customer": r.customer, "region": r.region,
             "ship_mode": r.ship_mode, "order_date": r.order_date, "ship_date": r.ship_date,
             "actual_days": int(r.actual_days or 0), "expected_days": int(r.expected_days or 0),
             "delay_days": int(r.delay_days or 0), "sales": round(float(r.sales or 0), 2),
             "priority": r.priority} for r in data]


@router.get("/shipping/delivery-trend")
async def get_delivery_trend(
    region: Optional[str] = Query(None), ship_mode: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None), client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        od = _parse_date(Orders.c.Order_Date, db_type)
        month_expr = _trunc_month(od, db_type)
        sd = _ship_days(db_type)
        q = select(
            month_expr.label('month'),
            func.count(func.distinct(Orders.c.Order_ID)).label('orders'),
            func.coalesce(func.sum(Orders.c.ShippingCost), 0).label('shipping_cost'),
            func.coalesce(func.avg(sd), 0).label('avg_days'),
            func.coalesce(func.avg(_is_on_time(db_type)), 0).label('on_time_rate'),
        )
        q = apply_shipping_filters(q, db_type, region, ship_mode, time_period)
        q = q.group_by(month_expr).order_by(month_expr)
        data = (await conn.execute(q)).fetchall()
    return [{"month": _fmt_month(r.month), "orders": int(r.orders or 0),
             "shipping_cost": float(r.shipping_cost or 0),
             "avg_days": round(float(r.avg_days or 0), 1),
             "on_time_rate": round(float(r.on_time_rate or 0) * 100, 1)}
            for r in data if r.month]


@router.get("/shipping/shipmode-mix")
async def get_shipmode_mix(
    region: Optional[str] = Query(None), ship_mode: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None), client=Depends(_client),
):
    engine, db_type = client
    async with engine.connect() as conn:
        q = select(
            Orders.c.Region.label('region'), Orders.c.ShipMode.label('ship_mode'),
            func.count().label('orders'),
        )
        q = apply_shipping_filters(q, db_type, region, ship_mode, time_period)
        q = q.group_by(Orders.c.Region, Orders.c.ShipMode).order_by(Orders.c.Region, Orders.c.ShipMode)
        data = (await conn.execute(q)).fetchall()
    return [{"region": r.region, "ship_mode": r.ship_mode, "orders": int(r.orders or 0)}
            for r in data if r.region and r.ship_mode]
