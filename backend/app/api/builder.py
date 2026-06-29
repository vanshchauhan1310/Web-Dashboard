"""
Chart Builder API — schema discovery + dynamic query execution.
All field names are validated against a strict whitelist before touching SQL.
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy import MetaData, Table, Column, Text, Float, Integer, func, select

from app.auth.deps import get_current_user
from app.db.dynamic_session import get_org_engine
from app.db.session import get_db
from app.models.user import User
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

_SALES_DS_KEY = "sales_db"

# ── Shared table definition (mirrors analytics.py) ───────────────────────────

_meta = MetaData()
_Orders = Table(
    "Orders", _meta,
    Column("Row ID",       Integer, primary_key=True),
    Column("Segment",      Text),
    Column("Category",     Text),
    Column("Sub-Category", Text),
    Column("Market",       Text),
    Column("Region",       Text),
    Column("Country",      Text),
    Column("City",         Text),
    Column("ShipMode",     Text),
    Column("OrderPriority",Text),
    Column("Sales",        Float),
    Column("Quantity",     Integer),
    Column("Discount",     Float),
    Column("Profit",       Float),
    Column("ShippingCost", Float),
)

# ── Whitelisted fields ────────────────────────────────────────────────────────

DIMENSIONS = [
    {"field": "Segment",       "label": "Segment"},
    {"field": "Category",      "label": "Category"},
    {"field": "Sub-Category",  "label": "Sub-Category"},
    {"field": "Market",        "label": "Market"},
    {"field": "Region",        "label": "Region"},
    {"field": "Country",       "label": "Country"},
    {"field": "City",          "label": "City"},
    {"field": "ShipMode",      "label": "Ship Mode"},
    {"field": "OrderPriority", "label": "Order Priority"},
]

MEASURES = [
    {"field": "Sales",        "label": "Sales ($)"},
    {"field": "Profit",       "label": "Profit ($)"},
    {"field": "Quantity",     "label": "Quantity"},
    {"field": "Discount",     "label": "Discount"},
    {"field": "ShippingCost", "label": "Shipping Cost ($)"},
]

AGGREGATIONS = [
    {"key": "sum",   "label": "Sum"},
    {"key": "avg",   "label": "Average"},
    {"key": "count", "label": "Count"},
    {"key": "min",   "label": "Min"},
    {"key": "max",   "label": "Max"},
]

CHART_TYPES = ["bar", "line", "area", "pie", "scatter"]

_VALID_DIMS = {d["field"] for d in DIMENSIONS}
_VALID_MEAS = {m["field"] for m in MEASURES}
_VALID_AGGS = {a["key"]   for a in AGGREGATIONS}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/schema")
async def get_schema(_: User = Depends(get_current_user)):
    """Return available dimensions, measures, aggregations, and chart types."""
    return {
        "dimensions":   DIMENSIONS,
        "measures":     MEASURES,
        "aggregations": AGGREGATIONS,
        "chartTypes":   CHART_TYPES,
    }


class QueryRequest(BaseModel):
    x_field:     str
    y_field:     str
    y_agg:       str = "sum"
    color_field: Optional[str] = None
    limit:       int = 20
    sort_desc:   bool = True

    @field_validator("x_field")
    @classmethod
    def validate_x(cls, v: str) -> str:
        if v not in _VALID_DIMS:
            raise ValueError(f"Invalid dimension: {v!r}")
        return v

    @field_validator("y_field")
    @classmethod
    def validate_y(cls, v: str) -> str:
        if v not in _VALID_MEAS:
            raise ValueError(f"Invalid measure: {v!r}")
        return v

    @field_validator("y_agg")
    @classmethod
    def validate_agg(cls, v: str) -> str:
        if v not in _VALID_AGGS:
            raise ValueError(f"Invalid aggregation: {v!r}")
        return v

    @field_validator("color_field")
    @classmethod
    def validate_color(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in _VALID_DIMS:
            raise ValueError(f"Invalid color field: {v!r}")
        return v

    @field_validator("limit")
    @classmethod
    def validate_limit(cls, v: int) -> int:
        if not (1 <= v <= 100):
            raise ValueError("limit must be 1–100")
        return v


_AGG_FN = {
    "sum":   func.sum,
    "avg":   func.avg,
    "count": func.count,
    "min":   func.min,
    "max":   func.max,
}


@router.post("/query")
async def run_query(
    req: QueryRequest,
    app_db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Execute a grouped aggregation query and return chart-ready data."""
    if not current_user.organisation_id:
        raise HTTPException(400, "Not assigned to an organisation.")

    engine, _ = await get_org_engine(
        current_user.organisation_id, app_db, datasource_key=_SALES_DS_KEY,
    )

    agg_fn = _AGG_FN[req.y_agg]
    x_col  = _Orders.c[req.x_field]
    y_col  = _Orders.c[req.y_field]

    async with engine.connect() as conn:

        if req.color_field:
            # ── Multi-series: group by x + color, then pivot ───────────────
            color_col = _Orders.c[req.color_field]
            q = (
                select(x_col, color_col, agg_fn(y_col).label("value"))
                .group_by(x_col, color_col)
                .order_by(agg_fn(y_col).desc())
            )
            rows = (await conn.execute(q)).fetchall()

            # Build pivot table
            cat_order: list[str] = []
            color_vals: list[str] = []
            pivot: dict[str, dict[str, float]] = {}

            for x_val, c_val, val in rows:
                x_str = str(x_val) if x_val is not None else "Unknown"
                c_str = str(c_val) if c_val is not None else "Unknown"
                if x_str not in pivot:
                    pivot[x_str] = {}
                    cat_order.append(x_str)
                if c_str not in color_vals:
                    color_vals.append(c_str)
                pivot[x_str][c_str] = float(val or 0)

            # Keep top N categories by total y value
            cat_order.sort(
                key=lambda c: sum(pivot[c].values()),
                reverse=True,
            )
            cat_order = cat_order[:req.limit]

            series = [
                {
                    "name": cv,
                    "data": [round(pivot.get(cat, {}).get(cv, 0), 2) for cat in cat_order],
                }
                for cv in color_vals
            ]

        else:
            # ── Single series: simple group by x ─────────────────────────
            order_expr = agg_fn(y_col).desc() if req.sort_desc else x_col
            q = (
                select(x_col, agg_fn(y_col).label("value"))
                .group_by(x_col)
                .order_by(order_expr)
                .limit(req.limit)
            )
            rows = (await conn.execute(q)).fetchall()

            cat_order = [str(r[0]) if r[0] is not None else "Unknown" for r in rows]
            series = [
                {
                    "name": f"{req.y_agg.capitalize()} of {req.y_field}",
                    "data": [round(float(r[1] or 0), 2) for r in rows],
                }
            ]

    return {
        "categories":  cat_order,
        "series":      series,
        "x_label":     req.x_field,
        "y_label":     f"{req.y_agg.capitalize()} of {req.y_field}",
        "color_label": req.color_field,
    }
