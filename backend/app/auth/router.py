from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.auth.security import verify_password, create_access_token
from app.auth.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.organisation import Organisation

router = APIRouter(prefix="/auth", tags=["auth"])


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MeResponse(BaseModel):
    id: int
    email: str
    full_name: str | None
    company: str | None
    organisation_id: int | None
    dashboards: list[str]
    is_admin: bool


@router.post("/login", response_model=TokenResponse)
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == form.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    # Resolve company name from org if available
    company = user.company or ""
    if user.organisation_id:
        org_result = await db.execute(select(Organisation).where(Organisation.id == user.organisation_id))
        org = org_result.scalar_one_or_none()
        if org:
            company = org.name

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "full_name": user.full_name or "",
        "company": company,
        "organisation_id": user.organisation_id,
        "dashboards": user.dashboards or ["sales"],
        "is_admin": user.is_admin,
    })
    return TokenResponse(access_token=token)


@router.get("/me", response_model=MeResponse)
async def me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    company = current_user.company or ""
    if current_user.organisation_id:
        org_result = await db.execute(select(Organisation).where(Organisation.id == current_user.organisation_id))
        org = org_result.scalar_one_or_none()
        if org:
            company = org.name

    return MeResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        company=company,
        organisation_id=current_user.organisation_id,
        dashboards=current_user.dashboards or ["sales"],
        is_admin=current_user.is_admin,
    )
