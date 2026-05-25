from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, Table, MetaData, case, Column, Text, Float, Integer
from typing import Optional
import datetime

from app.db.session import get_db, engine

router = APIRouter()

metadata = MetaData()
Orders = Table(
    'Orders',
    metadata,
    Column('Row ID', Integer, primary_key=True),
    Column('Order_ID', Text),
    Column('Order_Date', Text),
    Column('Ship_Date', Text),
    Column('ShipMode', Text),
    Column('Customer ID', Text),
    Column('CustomerName', Text),
    Column('Segment', Text),
    Column('City', Text),
    Column('State', Text),
    Column('Country', Text),
    Column('PostalCode', Text),
    Column('Market', Text),
    Column('Region', Text),
    Column('ProductID', Text),
    Column('Category', Text),
    Column('Sub-Category', Text),
    Column('ProductName', Text),
    Column('Sales', Float),
    Column('Quantity', Integer),
    Column('Discount', Float),
    Column('Profit', Float),
    Column('ShippingCost', Float),
    Column('OrderPriority', Text),
    schema='public',
)


@router.get("/filters")
async def get_filter_options(
    db: AsyncSession = Depends(get_db)
):
    category_result = await db.execute(
        select(Orders.c.Category.distinct()).order_by(Orders.c.Category)
    )
    region_result = await db.execute(
        select(Orders.c.Country.distinct()).order_by(Orders.c.Country)
    )
    sub_category_result = await db.execute(
        select(Orders.c['Sub-Category'].distinct()).order_by(Orders.c['Sub-Category'])
    )
    segment_result = await db.execute(
        select(Orders.c.Segment.distinct()).order_by(Orders.c.Segment)
    )

    return {
        "categories": [row[0] for row in category_result if row[0] is not None],
        "regions": [row[0] for row in region_result if row[0] is not None],
        "sub_categories": [row[0] for row in sub_category_result if row[0] is not None],
        "segments": [row[0] for row in segment_result if row[0] is not None],
    }


@router.get("/kpis")
async def get_dashboard_kpis(
    db: AsyncSession = Depends(get_db)
):
    order_date = func.to_date(Orders.c.Order_Date, 'DD-MM-YYYY')
    latest_month = await db.execute(
        select(func.date_trunc('month', order_date)).order_by(func.date_trunc('month', order_date).desc()).limit(1)
    )
    latest_month = latest_month.scalar_one()

    total_revenue_result = await db.execute(
        select(func.coalesce(func.sum(Orders.c.Sales), 0))
    )
    total_revenue = float(total_revenue_result.scalar_one())

    active_customers_result = await db.execute(
        select(func.count(func.distinct(Orders.c['Customer ID'])))
    )
    active_customers = int(active_customers_result.scalar_one())

    sales_growth = 0.0
    if latest_month is not None:
        current_month_start = latest_month
        previous_month_start = (latest_month - datetime.timedelta(days=1)).replace(day=1)
        next_month_start = (current_month_start + datetime.timedelta(days=32)).replace(day=1)

        current_revenue_result = await db.execute(
            select(func.coalesce(func.sum(Orders.c.Sales), 0))
            .where(order_date >= current_month_start)
            .where(order_date < next_month_start)
        )
        previous_revenue_result = await db.execute(
            select(func.coalesce(func.sum(Orders.c.Sales), 0))
            .where(order_date >= previous_month_start)
            .where(order_date < current_month_start)
        )

        current_revenue = float(current_revenue_result.scalar_one())
        previous_revenue = float(previous_revenue_result.scalar_one())

        if previous_revenue > 0:
            sales_growth = (current_revenue - previous_revenue) / previous_revenue * 100
        elif current_revenue > 0:
            sales_growth = 100.0

    positive_orders_result = await db.execute(
        select(func.coalesce(func.sum(case((Orders.c.Profit > 0, 1), else_=0)), 0))
    )
    positive_orders = float(positive_orders_result.scalar_one())

    total_orders_result = await db.execute(
        select(func.coalesce(func.count(), 0))
    )
    total_orders = float(total_orders_result.scalar_one())

    average_order_value = 0.0
    if total_orders > 0:
        average_order_value = total_revenue / total_orders

    return {
        "total_revenue": total_revenue,
        "active_customers": active_customers,
        "sales_growth": round(sales_growth, 1),
        "average_order_value": round(average_order_value, 2),
        "total_revenue_change": f"{sales_growth:+.1f}%",
        "active_customers_change": "+5.2%",
        "sales_growth_change": f"{sales_growth:+.1f}%",
        "average_order_value_change": "+0.0%",
    }


def apply_filters(query, category: str = None, region: str = None, time_period: str = None, sub_category: str = None, segment: str = None):
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
        if time_period == 'Last 7 Days':
            start_date = now - datetime.timedelta(days=7)
        elif time_period == 'Last 30 Days':
            start_date = now - datetime.timedelta(days=30)
        elif time_period == 'This Year':
            start_date = datetime.datetime(now.year, 1, 1)
        else:
            start_date = None

        if start_date:
            order_date = func.to_date(Orders.c.Order_Date, 'DD-MM-YYYY')
            query = query.where(order_date >= start_date)
    
    return query


def apply_executive_filters(
    query,
    market: str = None,
    segment: str = None,
    year: str = None,
):
    if market and market != 'All Markets':
        query = query.where(Orders.c.Market == market)
    if segment and segment != 'All Segments':
        query = query.where(Orders.c.Segment == segment)
    if year and year != 'All Years':
        order_date = func.to_date(Orders.c.Order_Date, 'DD-MM-YYYY')
        query = query.where(func.extract('year', order_date) == int(year))

    return query


def apply_geography_filters(
    query,
    market: str = None,
    region: str = None,
    category: str = None,
    year: str = None,
):
    if market and market != 'All Markets':
        query = query.where(Orders.c.Market == market)
    if region and region != 'All Regions':
        query = query.where(Orders.c.Region == region)
    if category and category != 'All Categories':
        query = query.where(Orders.c.Category == category)
    if year and year != 'All Years':
        order_date = func.to_date(Orders.c.Order_Date, 'DD-MM-YYYY')
        query = query.where(func.extract('year', order_date) == int(year))

    return query


@router.get("/geography/filters")
async def get_geography_filter_options(
    db: AsyncSession = Depends(get_db)
):
    order_date = func.to_date(Orders.c.Order_Date, 'DD-MM-YYYY')
    market_result = await db.execute(select(Orders.c.Market.distinct()).order_by(Orders.c.Market))
    region_result = await db.execute(select(Orders.c.Region.distinct()).order_by(Orders.c.Region))
    category_result = await db.execute(select(Orders.c.Category.distinct()).order_by(Orders.c.Category))
    year_result = await db.execute(
        select(func.extract('year', order_date).label('year')).distinct().order_by('year')
    )

    return {
        "markets": [row[0] for row in market_result if row[0] is not None],
        "regions": [row[0] for row in region_result if row[0] is not None],
        "categories": [row[0] for row in category_result if row[0] is not None],
        "years": [str(int(row[0])) for row in year_result if row[0] is not None],
    }


@router.get("/geography/kpis")
async def get_geography_kpis(
    market: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    year: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    base_query = select(
        func.count(func.distinct(Orders.c.Country)).label('countries'),
        func.count(func.distinct(Orders.c.Region)).label('regions'),
        func.coalesce(func.sum(Orders.c.Sales), 0).label('sales'),
        func.coalesce(func.sum(Orders.c.Profit), 0).label('profit'),
        func.coalesce(func.sum(Orders.c.ShippingCost), 0).label('shipping_cost'),
    )
    base_query = apply_geography_filters(base_query, market, region, category, year)
    summary = (await db.execute(base_query)).one()

    top_country_query = select(
        Orders.c.Country.label('country'),
        func.sum(Orders.c.Sales).label('sales'),
    )
    top_country_query = apply_geography_filters(top_country_query, market, region, category, year)
    top_country_query = top_country_query.group_by(Orders.c.Country).order_by(func.sum(Orders.c.Sales).desc()).limit(1)
    top_country = (await db.execute(top_country_query)).first()

    margin = 0.0
    sales = float(summary.sales or 0)
    if sales:
        margin = float(summary.profit or 0) / sales * 100

    return {
        "countries": int(summary.countries or 0),
        "regions": int(summary.regions or 0),
        "sales": sales,
        "profit": float(summary.profit or 0),
        "profit_margin": round(margin, 1),
        "shipping_cost": float(summary.shipping_cost or 0),
        "top_country": top_country.country if top_country else "N/A",
        "top_country_sales": float(top_country.sales or 0) if top_country else 0,
    }


@router.get("/geography/country-performance")
async def get_geography_country_performance(
    market: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    year: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(
        Orders.c.Country.label('country'),
        Orders.c.Market.label('market'),
        func.sum(Orders.c.Sales).label('sales'),
        func.sum(Orders.c.Profit).label('profit'),
        func.count(func.distinct(Orders.c.Order_ID)).label('orders'),
    )
    query = apply_geography_filters(query, market, region, category, year)
    query = query.group_by(Orders.c.Country, Orders.c.Market).order_by(func.sum(Orders.c.Sales).desc())

    data = (await db.execute(query)).all()
    return [
        {
            "country": row.country,
            "market": row.market,
            "sales": float(row.sales or 0),
            "profit": float(row.profit or 0),
            "orders": int(row.orders or 0),
        }
        for row in data
    ]


@router.get("/geography/market-sales")
async def get_geography_market_sales(
    market: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    year: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(
        Orders.c.Market.label('market'),
        func.sum(Orders.c.Sales).label('sales'),
        func.sum(Orders.c.Profit).label('profit'),
    )
    query = apply_geography_filters(query, market, region, category, year)
    query = query.group_by(Orders.c.Market).order_by(func.sum(Orders.c.Sales).desc())
    data = (await db.execute(query)).all()

    return [
        {"market": row.market, "sales": float(row.sales or 0), "profit": float(row.profit or 0)}
        for row in data
    ]


@router.get("/geography/monthly-market-trend")
async def get_geography_monthly_market_trend(
    market: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    year: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    order_date = func.to_date(Orders.c.Order_Date, 'DD-MM-YYYY')
    month_func = func.date_trunc('month', order_date)
    query = select(
        month_func.label('month'),
        Orders.c.Market.label('market'),
        func.sum(Orders.c.Sales).label('sales'),
    )
    query = apply_geography_filters(query, market, region, category, year)
    query = query.group_by(month_func, Orders.c.Market).order_by(month_func, Orders.c.Market)
    data = (await db.execute(query)).all()

    return [
        {"month": row.month.strftime('%b %Y'), "market": row.market, "sales": float(row.sales or 0)}
        for row in data if row.month
    ]


@router.get("/geography/region-category")
async def get_geography_region_category(
    market: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    year: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(
        Orders.c.Region.label('region'),
        Orders.c.Category.label('category'),
        func.sum(Orders.c.Sales).label('sales'),
    )
    query = apply_geography_filters(query, market, region, category, year)
    query = query.group_by(Orders.c.Region, Orders.c.Category).order_by(Orders.c.Region, Orders.c.Category)
    data = (await db.execute(query)).all()

    return [
        {"region": row.region, "category": row.category, "sales": float(row.sales or 0)}
        for row in data
    ]


@router.get("/geography/sankey")
async def get_geography_sankey(
    market: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    year: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(
        Orders.c.Market.label('market'),
        Orders.c.Region.label('region'),
        Orders.c.Category.label('category'),
        func.sum(Orders.c.Sales).label('sales'),
    )
    query = apply_geography_filters(query, market, region, category, year)
    query = query.group_by(Orders.c.Market, Orders.c.Region, Orders.c.Category)
    data = (await db.execute(query)).all()

    nodes = set()
    link_values = {}
    for row in data:
        market_name = f"Market: {row.market}"
        region_name = f"Region: {row.region}"
        category_name = f"Category: {row.category}"
        nodes.update([market_name, region_name, category_name])
        link_values[(market_name, region_name)] = link_values.get((market_name, region_name), 0) + float(row.sales or 0)
        link_values[(region_name, category_name)] = link_values.get((region_name, category_name), 0) + float(row.sales or 0)

    return {
        "nodes": [{"name": name} for name in sorted(nodes)],
        "links": [
            {"source": source, "target": target, "value": value}
            for (source, target), value in link_values.items()
            if value > 0
        ],
    }


@router.get("/geography/drilldown")
async def get_geography_drilldown(
    level: str = Query("market"),
    market_value: Optional[str] = Query(None),
    region_value: Optional[str] = Query(None),
    country_value: Optional[str] = Query(None),
    market: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    year: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    levels = {
        "market": (Orders.c.Market, "region"),
        "region": (Orders.c.Region, "country"),
        "country": (Orders.c.Country, "city"),
        "city": (Orders.c.City, None),
    }
    group_column, next_level = levels.get(level, levels["market"])

    query = select(
        group_column.label("name"),
        func.sum(Orders.c.Sales).label("sales"),
        func.sum(Orders.c.Profit).label("profit"),
        func.count(func.distinct(Orders.c.Order_ID)).label("orders"),
    )
    query = apply_geography_filters(query, market, region, category, year)

    if market_value:
        query = query.where(Orders.c.Market == market_value)
    if region_value:
        query = query.where(Orders.c.Region == region_value)
    if country_value:
        query = query.where(Orders.c.Country == country_value)

    query = query.group_by(group_column).order_by(func.sum(Orders.c.Sales).desc()).limit(18)
    data = (await db.execute(query)).all()

    return {
        "level": level,
        "next_level": next_level,
        "items": [
            {
                "name": row.name,
                "sales": float(row.sales or 0),
                "profit": float(row.profit or 0),
                "orders": int(row.orders or 0),
            }
            for row in data if row.name is not None
        ],
    }


@router.get("/executive/kpis")
async def get_executive_kpis(
    market: Optional[str] = Query(None),
    segment: Optional[str] = Query(None),
    year: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(
        func.coalesce(func.sum(Orders.c.Sales), 0).label('revenue'),
        func.count(func.distinct(Orders.c.Order_ID)).label('orders'),
        func.count(func.distinct(Orders.c['Customer ID'])).label('customers'),
        func.count(func.distinct(Orders.c.Market)).label('markets'),
        func.count(func.distinct(Orders.c.Country)).label('countries'),
        func.coalesce(func.avg(Orders.c.Discount), 0).label('avg_discount'),
    )
    query = apply_executive_filters(query, market, segment, year)
    row = (await db.execute(query)).one()

    revenue = float(row.revenue or 0)
    orders = int(row.orders or 0)
    customers = int(row.customers or 0)
    markets = int(row.markets or 0)
    countries = int(row.countries or 0)
    avg_discount = round(float(row.avg_discount or 0) * 100, 1)
    aov = round(revenue / orders, 2) if orders > 0 else 0.0

    return {
        "revenue": revenue,
        "total_orders": orders,
        "active_customers": customers,
        "active_markets": markets,
        "active_countries": countries,
        "avg_discount": avg_discount,
        "avg_order_value": aov,
    }


@router.get("/executive/filters")
async def get_executive_filter_options(
    db: AsyncSession = Depends(get_db)
):
    order_date = func.to_date(Orders.c.Order_Date, 'DD-MM-YYYY')
    market_result = await db.execute(
        select(Orders.c.Market.distinct()).order_by(Orders.c.Market)
    )
    segment_result = await db.execute(
        select(Orders.c.Segment.distinct()).order_by(Orders.c.Segment)
    )
    year_result = await db.execute(
        select(func.extract('year', order_date).label('year')).distinct().order_by('year')
    )

    return {
        "markets": [row[0] for row in market_result if row[0] is not None],
        "segments": [row[0] for row in segment_result if row[0] is not None],
        "years": [str(int(row[0])) for row in year_result if row[0] is not None],
    }


@router.get("/executive/monthly-sales-profit")
async def get_executive_monthly_sales_profit(
    market: Optional[str] = Query(None),
    segment: Optional[str] = Query(None),
    year: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    order_date = func.to_date(Orders.c.Order_Date, 'DD-MM-YYYY')
    month_func = func.date_trunc('month', order_date)
    query = select(
        month_func.label('month'),
        func.sum(Orders.c.Sales).label('sales'),
        func.sum(Orders.c.Profit).label('profit'),
        func.count(func.distinct(Orders.c.Order_ID)).label('orders'),
    )
    query = apply_executive_filters(query, market, segment, year)
    query = query.group_by(month_func).order_by(month_func)

    result = await db.execute(query)
    data = result.all()

    return [
        {
            "month": row.month.strftime('%b %Y'),
            "sales": float(row.sales or 0),
            "profit": float(row.profit or 0),
            "orders": int(row.orders or 0),
        }
        for row in data if row.month
    ]


@router.get("/executive/category-performance")
async def get_executive_category_performance(
    market: Optional[str] = Query(None),
    segment: Optional[str] = Query(None),
    year: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(
        Orders.c.Category.label('category'),
        func.sum(Orders.c.Sales).label('sales'),
        func.sum(Orders.c.Profit).label('profit'),
        func.count(func.distinct(Orders.c.Order_ID)).label('orders'),
    )
    query = apply_executive_filters(query, market, segment, year)
    query = query.group_by(Orders.c.Category).order_by(func.sum(Orders.c.Sales).desc())

    result = await db.execute(query)
    data = result.all()

    return [
        {
            "category": row.category,
            "sales": float(row.sales or 0),
            "profit": float(row.profit or 0),
            "orders": int(row.orders or 0),
        }
        for row in data
    ]


@router.get("/executive/segment-share")
async def get_executive_segment_share(
    market: Optional[str] = Query(None),
    segment: Optional[str] = Query(None),
    year: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(
        Orders.c.Segment.label('segment'),
        func.sum(Orders.c.Sales).label('sales'),
        func.sum(Orders.c.Profit).label('profit'),
        func.count(func.distinct(Orders.c.Order_ID)).label('orders'),
    )
    query = apply_executive_filters(query, market, segment, year)
    query = query.group_by(Orders.c.Segment).order_by(func.sum(Orders.c.Sales).desc())

    result = await db.execute(query)
    data = result.all()

    return [
        {
            "segment": row.segment,
            "sales": float(row.sales or 0),
            "profit": float(row.profit or 0),
            "orders": int(row.orders or 0),
        }
        for row in data
    ]


@router.get("/executive/pareto-countries")
async def get_executive_pareto_countries(
    market: Optional[str] = Query(None),
    segment: Optional[str] = Query(None),
    year: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(
        Orders.c.Country.label('country'),
        func.sum(Orders.c.Sales).label('sales'),
    )
    query = apply_executive_filters(query, market, segment, year)
    query = query.group_by(Orders.c.Country).order_by(func.sum(Orders.c.Sales).desc()).limit(11)

    total_query = select(func.coalesce(func.sum(Orders.c.Sales), 0))
    total_query = apply_executive_filters(total_query, market, segment, year)

    rows_result = await db.execute(query)
    total_result = await db.execute(total_query)
    total_sales = float(total_result.scalar_one() or 0)

    display_rows = []
    for row in rows_result.all():
        sales = float(row.sales or 0)
        display_rows.append({
            "country": row.country,
            "sales": sales,
        })

    top_sales = sum(row["sales"] for row in display_rows)
    other_sales = max(total_sales - top_sales, 0)
    if other_sales > 0:
        display_rows.append({
            "country": "Other",
            "sales": other_sales,
        })

    display_rows.sort(key=lambda row: row["sales"], reverse=True)

    cumulative = 0.0
    rows = []
    for row in display_rows:
        cumulative += row["sales"]
        rows.append({
            "country": row["country"],
            "sales": row["sales"],
            "cumulative_pct": round((cumulative / total_sales * 100) if total_sales else 0, 2),
        })

    return rows


@router.get("/executive/profit-waterfall")
async def get_executive_profit_waterfall(
    market: Optional[str] = Query(None),
    segment: Optional[str] = Query(None),
    year: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    gross_sales_expr = func.sum(
        case(
            (Orders.c.Discount < 1, Orders.c.Sales / func.nullif(1 - Orders.c.Discount, 0)),
            else_=Orders.c.Sales,
        )
    )
    query = select(
        gross_sales_expr.label('gross_sales'),
        func.sum(Orders.c.Sales).label('net_sales'),
        func.sum(Orders.c.Profit).label('profit'),
        func.sum(Orders.c.ShippingCost).label('shipping_cost'),
    )
    query = apply_executive_filters(query, market, segment, year)

    result = await db.execute(query)
    row = result.one()

    gross_sales = float(row.gross_sales or 0)
    net_sales = float(row.net_sales or 0)
    profit = float(row.profit or 0)
    shipping_cost = float(row.shipping_cost or 0)
    discount_impact = max(gross_sales - net_sales, 0)
    operating_cost = max(net_sales - shipping_cost - profit, 0)

    return [
        {"label": "Gross Sales", "value": gross_sales, "type": "total"},
        {"label": "Discount", "value": -discount_impact, "type": "decrease"},
        {"label": "Net Sales", "value": net_sales, "type": "subtotal"},
        {"label": "Shipping", "value": -shipping_cost, "type": "decrease"},
        {"label": "Cost Base", "value": -operating_cost, "type": "decrease"},
        {"label": "Profit", "value": profit, "type": "total"},
    ]


@router.get("/revenue-country")
async def get_revenue_by_country(
    category: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None),
    sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(
        Orders.c.Country.label('country'),
        func.sum(Orders.c.Sales).label('revenue')
    )
    query = apply_filters(query, category, region, time_period, sub_category, segment)
    query = query.group_by(Orders.c.Country).order_by(func.sum(Orders.c.Sales).desc())

    result = await db.execute(query)
    data = result.all()

    return [{"country": row.country, "revenue": row.revenue} for row in data]


@router.get("/sales-trend")
async def get_sales_trend(
    category: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None),
    sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    order_date = func.to_date(Orders.c.Order_Date, 'DD-MM-YYYY')
    month_func = func.date_trunc('month', order_date)
    query = select(
        month_func.label('month'),
        func.sum(Orders.c.Sales).label('sales')
    )
    query = apply_filters(query, category, region, time_period, sub_category, segment)
    query = query.group_by('month').order_by('month')

    result = await db.execute(query)
    data = result.all()

    return [{"month": row.month.strftime('%b'), "sales": row.sales} for row in data if row.month]


@router.get("/top-products")
async def get_top_products(
    category: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None),
    sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(
        Orders.c.ProductName.label('product'),
        func.sum(Orders.c.Sales).label('revenue')
    )
    query = apply_filters(query, category, region, time_period, sub_category, segment)
    query = query.group_by(Orders.c.ProductName).order_by(func.sum(Orders.c.Sales).desc()).limit(5)

    result = await db.execute(query)
    data = result.all()

    return [{"product": row.product, "revenue": row.revenue} for row in data]


@router.get("/monthly-revenue")
async def get_monthly_revenue(
    category: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None),
    sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    order_date = func.to_date(Orders.c.Order_Date, 'DD-MM-YYYY')
    month_func = func.date_trunc('month', order_date)
    query = select(
        month_func.label('month'),
        func.sum(Orders.c.Sales).label('revenue')
    )
    query = apply_filters(query, category, region, time_period, sub_category, segment)
    query = query.group_by(month_func).order_by(month_func)

    result = await db.execute(query)
    data = result.all()

    return [
        {"month": row.month.strftime('%b %Y'), "revenue": row.revenue}
        for row in data if row.month
    ]


@router.get("/orders-category")
async def get_orders_by_category(
    category: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None),
    sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(
        Orders.c.Category.label('category'),
        func.count().label('value')
    )
    query = apply_filters(query, category, region, time_period, sub_category, segment)
    query = query.group_by(Orders.c.Category).order_by(func.count().desc())

    result = await db.execute(query)
    data = result.all()

    return [{"category": row.category, "value": row.value} for row in data]


@router.get("/profit-by-category")
async def get_profit_by_category(
    category: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None),
    sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(
        Orders.c.Category.label('category'),
        func.sum(Orders.c.Sales).label('revenue'),
        func.sum(Orders.c.Profit).label('profit')
    )
    query = apply_filters(query, category, region, time_period, sub_category, segment)
    query = query.group_by(Orders.c.Category).order_by(func.sum(Orders.c.Sales).desc())

    result = await db.execute(query)
    data = result.all()

    return [
        {"category": row.category, "revenue": row.revenue, "profit": row.profit}
        for row in data
    ]


@router.get("/discount-profit-scatter")
async def get_discount_profit_scatter(
    category: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None),
    sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(
        Orders.c.Discount.label('discount'),
        Orders.c.Profit.label('profit'),
        Orders.c.Sales.label('sales')
    )
    query = apply_filters(query, category, region, time_period, sub_category, segment)
    query = query.order_by(Orders.c.Profit.desc()).limit(200)

    result = await db.execute(query)
    data = result.all()

    return [
        {"discount": float(row.discount or 0), "profit": float(row.profit or 0), "sales": float(row.sales or 0)}
        for row in data
    ]


@router.get("/shipping-cost-region")
async def get_shipping_cost_by_region(
    category: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None),
    sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(
        Orders.c.Region.label('region'),
        func.sum(Orders.c.ShippingCost).label('shipping_cost')
    )
    query = apply_filters(query, category, region, time_period, sub_category, segment)
    query = query.group_by(Orders.c.Region).order_by(func.sum(Orders.c.ShippingCost).desc())

    result = await db.execute(query)
    data = result.all()

    return [{"region": row.region, "shipping_cost": row.shipping_cost} for row in data]


@router.get("/order-priority")
async def get_order_priority_distribution(
    category: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None),
    sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(
        Orders.c.OrderPriority.label('priority'),
        func.count().label('value')
    )
    query = apply_filters(query, category, region, time_period, sub_category, segment)
    query = query.group_by(Orders.c.OrderPriority).order_by(func.count().desc())

    result = await db.execute(query)
    data = result.all()

    return [{"priority": row.priority, "value": row.value} for row in data]


@router.get("/product-kpis")
async def get_product_kpis(
    category: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None),
    sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    main_q = select(
        func.coalesce(func.sum(Orders.c.Profit), 0).label('profit'),
        func.coalesce(func.sum(Orders.c.Sales), 0).label('revenue'),
        func.coalesce(func.sum(Orders.c.Quantity), 0).label('units'),
        func.count(func.distinct(Orders.c.ProductName)).label('products'),
        func.coalesce(func.avg(Orders.c.Discount), 0).label('avg_discount'),
        func.count().label('total_lines'),
        func.coalesce(func.sum(case((Orders.c.Profit < 0, 1), else_=0)), 0).label('loss_lines'),
    )
    main_q = apply_filters(main_q, category, region, time_period, sub_category, segment)
    row = (await db.execute(main_q)).one()

    profit = float(row.profit or 0)
    revenue = float(row.revenue or 0)
    units = int(row.units or 0)
    products = int(row.products or 0)
    avg_discount = round(float(row.avg_discount or 0) * 100, 1)
    total_lines = int(row.total_lines or 0)
    loss_lines = int(row.loss_lines or 0)
    margin = round(profit / revenue * 100, 1) if revenue > 0 else 0.0
    loss_pct = round(loss_lines / total_lines * 100, 1) if total_lines > 0 else 0.0

    return {
        "profit": profit,
        "profit_margin": margin,
        "total_units": units,
        "unique_products": products,
        "avg_discount": avg_discount,
        "loss_orders_pct": loss_pct,
    }


@router.get("/product-conversion-funnel")
async def get_product_conversion_funnel(
    category: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None),
    sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    async def count_where(extra_where=None):
        q = select(func.count()).select_from(Orders)
        q = apply_filters(q, category, region, time_period, sub_category, segment)
        if extra_where is not None:
            q = q.where(extra_where)
        return int((await db.execute(q)).scalar_one() or 0)

    total = await count_where()
    profitable = await count_where(Orders.c.Profit > 0)
    high_value = await count_where(Orders.c.Sales > 200)
    strong = await count_where((Orders.c.Sales > 200) & (Orders.c.Profit > 0))
    premium = await count_where(Orders.c.Sales > 500)

    return [
        {"stage": "Total Orders", "value": total},
        {"stage": "Profitable Orders", "value": profitable},
        {"stage": "High-Value (>$200)", "value": high_value},
        {"stage": "Profitable High-Value", "value": strong},
        {"stage": "Premium (>$500)", "value": premium},
    ]


@router.get("/product-revenue-profit-scatter")
async def get_product_revenue_profit_scatter(
    category: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None),
    sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(
        Orders.c.ProductName.label('product'),
        Orders.c.Category.label('category'),
        func.sum(Orders.c.Sales).label('revenue'),
        func.sum(Orders.c.Profit).label('profit'),
        func.sum(Orders.c.Quantity).label('quantity'),
    )
    query = apply_filters(query, category, region, time_period, sub_category, segment)
    query = query.group_by(Orders.c.ProductName, Orders.c.Category)
    query = query.order_by(func.sum(Orders.c.Sales).desc()).limit(120)

    data = (await db.execute(query)).all()
    return [
        {
            "product": row.product,
            "category": row.category,
            "revenue": float(row.revenue or 0),
            "profit": float(row.profit or 0),
            "quantity": int(row.quantity or 0),
        }
        for row in data
    ]


@router.get("/segment-sales")
async def get_segment_sales(
    category: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None),
    sub_category: Optional[str] = Query(None),
    segment: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(
        Orders.c.Segment.label('segment'),
        Orders.c.Region.label('region'),
        func.sum(Orders.c.Sales).label('sales')
    )
    query = apply_filters(query, category, region, time_period, sub_category, segment)
    query = query.group_by(Orders.c.Segment, Orders.c.Region).order_by(Orders.c.Segment, Orders.c.Region)

    result = await db.execute(query)
    data = result.all()

    return [
        {"segment": row.segment, "region": row.region, "sales": row.sales}
        for row in data
    ]


# ─── Shipping Operations ────────────────────────────────────────────────────

def apply_shipping_filters(query, region=None, ship_mode=None, time_period=None):
    if region and region != 'All Regions':
        query = query.where(Orders.c.Region == region)
    if ship_mode and ship_mode != 'All Ship Modes':
        query = query.where(Orders.c.ShipMode == ship_mode)
    if time_period and time_period != 'All Time':
        now = datetime.datetime.utcnow()
        if time_period == 'Last 7 Days':
            start_date = now - datetime.timedelta(days=7)
        elif time_period == 'Last 30 Days':
            start_date = now - datetime.timedelta(days=30)
        elif time_period == 'This Year':
            start_date = datetime.datetime(now.year, 1, 1)
        else:
            start_date = None
        if start_date:
            query = query.where(func.to_date(Orders.c.Order_Date, 'DD-MM-YYYY') >= start_date)
    return query


def _ship_days():
    return (
        func.to_date(Orders.c.Ship_Date, 'DD-MM-YYYY') -
        func.to_date(Orders.c.Order_Date, 'DD-MM-YYYY')
    )


def _expected_days():
    return case(
        (Orders.c.ShipMode == 'Same Day', 1),
        (Orders.c.ShipMode == 'First Class', 3),
        (Orders.c.ShipMode == 'Second Class', 7),
        else_=14,
    )


def _is_on_time():
    return case((_ship_days() <= _expected_days(), 1), else_=0)


@router.get("/shipping/filters")
async def get_shipping_filter_options(db: AsyncSession = Depends(get_db)):
    region_result = await db.execute(select(Orders.c.Region.distinct()).order_by(Orders.c.Region))
    shipmode_result = await db.execute(select(Orders.c.ShipMode.distinct()).order_by(Orders.c.ShipMode))
    return {
        "regions": [r[0] for r in region_result if r[0]],
        "ship_modes": [r[0] for r in shipmode_result if r[0]],
    }


@router.get("/shipping/kpis")
async def get_shipping_kpis(
    region: Optional[str] = Query(None),
    ship_mode: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(
        func.coalesce(func.sum(Orders.c.ShippingCost), 0).label('total_cost'),
        func.coalesce(func.avg(_ship_days()), 0).label('avg_days'),
        func.count(func.distinct(Orders.c.Order_ID)).label('shipments'),
        func.coalesce(func.avg(_is_on_time()), 0).label('on_time_rate'),
        func.coalesce(func.sum(
            case((Orders.c.ShipMode.in_(['First Class', 'Same Day']), 1), else_=0)
        ), 0).label('express_count'),
        func.count().label('total_lines'),
    )
    q = apply_shipping_filters(q, region, ship_mode, time_period)
    row = (await db.execute(q)).one()

    total_cost = float(row.total_cost or 0)
    shipments = int(row.shipments or 0)
    avg_days = round(float(row.avg_days or 0), 1)
    on_time_rate = round(float(row.on_time_rate or 0) * 100, 1)
    express_pct = round(float(row.express_count or 0) / max(int(row.total_lines or 1), 1) * 100, 1)
    avg_cost = round(total_cost / max(shipments, 1), 2)

    return {
        "total_shipping_cost": total_cost,
        "avg_delivery_days": avg_days,
        "on_time_rate": on_time_rate,
        "total_shipments": shipments,
        "express_pct": express_pct,
        "avg_cost_per_shipment": avg_cost,
    }


@router.get("/shipping/region-performance")
async def get_shipping_region_performance(
    region: Optional[str] = Query(None),
    ship_mode: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(
        Orders.c.Region.label('region'),
        func.count(func.distinct(Orders.c.Order_ID)).label('orders'),
        func.coalesce(func.sum(Orders.c.ShippingCost), 0).label('shipping_cost'),
        func.coalesce(func.avg(_ship_days()), 0).label('avg_days'),
        func.coalesce(func.avg(_is_on_time()), 0).label('on_time_rate'),
        func.coalesce(func.avg(Orders.c.ShippingCost), 0).label('avg_cost'),
    )
    q = apply_shipping_filters(q, region, ship_mode, time_period)
    q = q.group_by(Orders.c.Region).order_by(func.count(func.distinct(Orders.c.Order_ID)).desc()).limit(12)
    data = (await db.execute(q)).all()

    return [
        {
            "region": row.region,
            "orders": int(row.orders or 0),
            "shipping_cost": float(row.shipping_cost or 0),
            "avg_days": round(float(row.avg_days or 0), 1),
            "on_time_rate": round(float(row.on_time_rate or 0) * 100, 1),
            "avg_cost": round(float(row.avg_cost or 0), 2),
        }
        for row in data if row.region
    ]


@router.get("/shipping/heatmap")
async def get_shipping_heatmap(
    region: Optional[str] = Query(None),
    ship_mode: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(
        Orders.c.Region.label('region'),
        Orders.c.ShipMode.label('ship_mode'),
        func.coalesce(func.avg(Orders.c.ShippingCost), 0).label('avg_cost'),
        func.count().label('orders'),
    )
    q = apply_shipping_filters(q, region, ship_mode, time_period)
    q = q.group_by(Orders.c.Region, Orders.c.ShipMode).order_by(Orders.c.Region, Orders.c.ShipMode)
    data = (await db.execute(q)).all()

    return [
        {
            "region": row.region,
            "ship_mode": row.ship_mode,
            "avg_cost": round(float(row.avg_cost or 0), 2),
            "orders": int(row.orders or 0),
        }
        for row in data if row.region and row.ship_mode
    ]


@router.get("/shipping/delayed-orders")
async def get_delayed_orders(
    region: Optional[str] = Query(None),
    ship_mode: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(
        Orders.c.Order_ID.label('order_id'),
        Orders.c.CustomerName.label('customer'),
        Orders.c.Region.label('region'),
        Orders.c.ShipMode.label('ship_mode'),
        Orders.c.Order_Date.label('order_date'),
        Orders.c.Ship_Date.label('ship_date'),
        _ship_days().label('actual_days'),
        _expected_days().label('expected_days'),
        (_ship_days() - _expected_days()).label('delay_days'),
        Orders.c.Sales.label('sales'),
        Orders.c.OrderPriority.label('priority'),
    )
    q = apply_shipping_filters(q, region, ship_mode, time_period)
    q = q.where(_ship_days() > _expected_days())
    q = q.order_by((_ship_days() - _expected_days()).desc()).limit(300)
    data = (await db.execute(q)).all()

    return [
        {
            "order_id": row.order_id,
            "customer": row.customer,
            "region": row.region,
            "ship_mode": row.ship_mode,
            "order_date": row.order_date,
            "ship_date": row.ship_date,
            "actual_days": int(row.actual_days or 0),
            "expected_days": int(row.expected_days or 0),
            "delay_days": int(row.delay_days or 0),
            "sales": round(float(row.sales or 0), 2),
            "priority": row.priority,
        }
        for row in data
    ]


@router.get("/shipping/delivery-trend")
async def get_delivery_trend(
    region: Optional[str] = Query(None),
    ship_mode: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    order_date_col = func.to_date(Orders.c.Order_Date, 'DD-MM-YYYY')
    month_func = func.date_trunc('month', order_date_col)

    q = select(
        month_func.label('month'),
        func.count(func.distinct(Orders.c.Order_ID)).label('orders'),
        func.coalesce(func.sum(Orders.c.ShippingCost), 0).label('shipping_cost'),
        func.coalesce(func.avg(_ship_days()), 0).label('avg_days'),
        func.coalesce(func.avg(_is_on_time()), 0).label('on_time_rate'),
    )
    q = apply_shipping_filters(q, region, ship_mode, time_period)
    q = q.group_by(month_func).order_by(month_func)
    data = (await db.execute(q)).all()

    return [
        {
            "month": row.month.strftime('%b %Y'),
            "orders": int(row.orders or 0),
            "shipping_cost": float(row.shipping_cost or 0),
            "avg_days": round(float(row.avg_days or 0), 1),
            "on_time_rate": round(float(row.on_time_rate or 0) * 100, 1),
        }
        for row in data if row.month
    ]


@router.get("/shipping/shipmode-mix")
async def get_shipmode_mix(
    region: Optional[str] = Query(None),
    ship_mode: Optional[str] = Query(None),
    time_period: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(
        Orders.c.Region.label('region'),
        Orders.c.ShipMode.label('ship_mode'),
        func.count().label('orders'),
    )
    q = apply_shipping_filters(q, region, ship_mode, time_period)
    q = q.group_by(Orders.c.Region, Orders.c.ShipMode).order_by(Orders.c.Region, Orders.c.ShipMode)
    data = (await db.execute(q)).all()

    return [
        {"region": row.region, "ship_mode": row.ship_mode, "orders": int(row.orders or 0)}
        for row in data if row.region and row.ship_mode
    ]
