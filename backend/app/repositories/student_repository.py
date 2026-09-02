from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import StudentAccess


class StudentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_digest(self, digest: str) -> StudentAccess | None:
        result = await self.db.execute(
            select(StudentAccess).where(StudentAccess.identifier_digest == digest)
        )
        return result.scalar_one_or_none()

    async def list_all(self) -> list[StudentAccess]:
        result = await self.db.execute(
            select(StudentAccess).order_by(StudentAccess.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(
        self,
        *,
        full_name: str,
        full_name_normalized: str,
        identifier_digest: str,
        masked_identifier: str,
    ) -> StudentAccess:
        student = StudentAccess(
            full_name=full_name,
            full_name_normalized=full_name_normalized,
            identifier_digest=identifier_digest,
            masked_identifier=masked_identifier,
        )
        self.db.add(student)
        await self.db.flush()
        await self.db.refresh(student)
        return student

    async def get_by_id(self, student_id: int) -> StudentAccess | None:
        result = await self.db.execute(
            select(StudentAccess).where(StudentAccess.id == student_id)
        )
        return result.scalar_one_or_none()

    async def update(self, student: StudentAccess, *, is_active: bool) -> StudentAccess:
        student.is_active = is_active
        await self.db.flush()
        await self.db.refresh(student)
        return student

    async def delete(self, student: StudentAccess) -> None:
        await self.db.delete(student)