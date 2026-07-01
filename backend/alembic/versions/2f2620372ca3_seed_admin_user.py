"""Seed admin user

Revision ID: 002
Revises: 001
Create Date: 2025-09-01

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from datetime import datetime
import bcrypt
from app.config.constants import UserRole


revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def hash_password(password: str) -> str:
    """Hasher le mot de passe avec bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def upgrade() -> None:
    users_table = table(
        'users',
        column('email', sa.String),
        column('password_hash', sa.String),
        column('full_name', sa.String),
        column('role', sa.String),
        column('is_active', sa.Boolean),
        column('created_at', sa.DateTime),
        column('updated_at', sa.DateTime),
    )

    op.bulk_insert(users_table, [
        {
            'email': 'Admin@espa.mg',
            'password_hash': hash_password('Admin@123'),  # Mot de passe par défaut
            'full_name': 'Administrateur ESPA',
            'role': UserRole.ADMIN,
            'is_active': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
        }
    ])


def downgrade() -> None:
    op.execute("DELETE FROM users WHERE email = 'admin@espa.mg'")