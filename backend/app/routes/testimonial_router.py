import json
import os
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends, Query

from app.dependencies import get_current_admin
from app.models.testimonial import TestimonialCreate, TestimonialPublic, TestimonialAdmin
from app.models.base import BaseResponse

STORE_PATH = os.path.join(os.path.dirname(__file__), "../../data/testimonials.json")

router = APIRouter(prefix="/testimonials", tags=["Testimonials"])


def _load() -> list[dict]:
    try:
        with open(STORE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def _save(records: list[dict]) -> None:
    os.makedirs(os.path.dirname(STORE_PATH), exist_ok=True)
    with open(STORE_PATH, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)


# ── Public endpoints ──────────────────────────────────────────────────────────

@router.get("", response_model=list[TestimonialPublic])
async def list_public_testimonials(
    limit: int = Query(6, ge=1, le=20),
):
    """Return the most recent visible testimonials (public, no auth required)."""
    records = _load()
    visible = [r for r in records if r.get("visible", True)]
    # Most recent first
    visible.sort(key=lambda r: r.get("created_at", ""), reverse=True)
    return [
        TestimonialPublic(
            id=r["id"],
            text=r["text"],
            rating=r["rating"],
            author_label=r.get("author_label"),
            created_at=r["created_at"],
        )
        for r in visible[:limit]
    ]


@router.post("", response_model=BaseResponse, status_code=status.HTTP_201_CREATED)
async def create_testimonial(payload: TestimonialCreate):
    """Submit a new testimonial (public, no auth required)."""
    record = {
        "id": str(uuid.uuid4()),
        "text": payload.text.strip(),
        "rating": payload.rating,
        "author_label": payload.author_label,
        "session_id": payload.session_id,
        "visible": True,
        "created_at": datetime.utcnow().isoformat(),
    }
    records = _load()
    records.append(record)
    _save(records)
    return BaseResponse(success=True, message="Témoignage enregistré, merci !")


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.get("/admin/all", response_model=list[TestimonialAdmin])
async def list_all_testimonials(
    current_user=Depends(get_current_admin),
):
    """Return all testimonials including hidden ones (admin only)."""
    records = _load()
    records.sort(key=lambda r: r.get("created_at", ""), reverse=True)
    return [
        TestimonialAdmin(
            id=r["id"],
            text=r["text"],
            rating=r["rating"],
            author_label=r.get("author_label"),
            session_id=r.get("session_id"),
            visible=r.get("visible", True),
            created_at=r["created_at"],
        )
        for r in records
    ]


@router.patch("/{testimonial_id}/visibility", response_model=BaseResponse)
async def toggle_visibility(
    testimonial_id: str,
    visible: bool,
    current_user=Depends(get_current_admin),
):
    """Show or hide a testimonial (admin only)."""
    records = _load()
    for r in records:
        if r["id"] == testimonial_id:
            r["visible"] = visible
            _save(records)
            state = "visible" if visible else "masqué"
            return BaseResponse(success=True, message=f"Témoignage {state}.")
    raise HTTPException(status_code=404, detail="Testimonial not found")


@router.delete("/{testimonial_id}", response_model=BaseResponse)
async def delete_testimonial(
    testimonial_id: str,
    current_user=Depends(get_current_admin),
):
    """Permanently delete a testimonial (admin only)."""
    records = _load()
    new_records = [r for r in records if r["id"] != testimonial_id]
    if len(new_records) == len(records):
        raise HTTPException(status_code=404, detail="Testimonial not found")
    _save(new_records)
    return BaseResponse(success=True, message="Témoignage supprimé.")
