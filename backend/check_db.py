import asyncio
import asyncpg

db = "postgresql://postgres:rabenantenaina_clevin@localhost:5432/espa"

async def check():
    conn = await asyncpg.connect(db)
    users = await conn.fetch("SELECT id, email, role, is_active, password_hash FROM users")
    print('Users:')
    for u in users:
        print(' - role:', u['role'])
        print(' - email:', u['email'])
        print(' - is_active:', u['is_active'])
        print(' - password_hash:', u['password_hash']) 
    await conn.close()

asyncio.run(check())



