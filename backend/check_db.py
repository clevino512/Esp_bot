import asyncio
import asyncpg
db = "postgresql://postgres:rabenantenaina_clevin@localhost:5432/espa"


async def check_shcema():
    conn = await asyncpg.connect(db)
    tables = await conn.fetch("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
    print('Tables:')
    for t in tables:
        print(' -', t['table_name'])
    await conn.close()

asyncio.run(check_shcema())

async def get_settings_table():
    conn = await asyncpg.connect(db)

    try:
        settings = await conn.fetch("SELECT * FROM settings")

        print("Settings table:")

        for s in settings:
            print("-------------------")
            for key, value in dict(s).items():
                print(f"{key}: {value}")

    finally:
        await conn.close()


asyncio.run(get_settings_table())
