import hashlib
import hmac
import re
import unicodedata

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import StudentAccess
from app.models.student import (
    StudentAccessCreate,
    StudentAccessResponse,
    StudentVerification,
)
from app.repositories.student_repository import StudentRepository

settings = get_settings()


def normalize_full_name(value: str) -> str:
    without_accents = "".join(
        char
        for char in unicodedata.normalize("NFKD", value)
        if not unicodedata.combining(char)
    )
    return " ".join(without_accents.casefold().split())


def normalize_identifier(value: str) -> str:
    return re.sub(r"\s+", "", value).upper()


def identifier_digest(value: str) -> str:
    # HMAC prevents a database reader from brute-forcing predictable school IDs
    # without the server secret.
    return hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        normalize_identifier(value).encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def mask_identifier(value: str) -> str:
    normalized = normalize_identifier(value)
    visible = normalized[-4:]
    return f"{'*' * max(0, len(normalized) - len(visible))}{visible}"


class StudentService:
    def __init__(self, db: AsyncSession):
        self.repository = StudentRepository(db)

    async def verify(self, verification: StudentVerification) -> bool:
        student = await self.repository.get_by_digest(
            identifier_digest(verification.student_identifier)
        )
        if not student or not student.is_active:
            return False
        return hmac.compare_digest(
            student.full_name_normalized,
            normalize_full_name(verification.full_name),
        )

    async def list_students(self) -> list[StudentAccessResponse]:
        students = await self.repository.list_all()
        return [StudentAccessResponse.model_validate(student) for student in students]

    async def create_student(
        self, data: StudentAccessCreate
    ) -> StudentAccessResponse:
        normalized_identifier = normalize_identifier(data.student_identifier)
        digest = identifier_digest(normalized_identifier)
        if await self.repository.get_by_digest(digest):
            raise ValueError("Cet identifiant scolaire est déjà enregistré")

        student = await self.repository.create(
            full_name=data.full_name.strip(),
            full_name_normalized=normalize_full_name(data.full_name),
            identifier_digest=digest,
            masked_identifier=mask_identifier(normalized_identifier),
        )
        return StudentAccessResponse.model_validate(student)

    async def set_active(
        self, student_id: int, is_active: bool
    ) -> StudentAccessResponse | None:
        student = await self.repository.get_by_id(student_id)
        if not student:
            return None
        updated = await self.repository.update(student, is_active=is_active)
        return StudentAccessResponse.model_validate(updated)

    async def delete_student(self, student_id: int) -> bool:
        student = await self.repository.get_by_id(student_id)
        if not student:
            return False
        await self.repository.delete(student)
        return True