# import asyncio
# import bcrypt
# import asyncpg

# db="postgresql://postgres:@localhost:5432/espa"

# async def check():
#     conn = await asyncpg.connect(db)
#     tables = await conn.fetch(
#         "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
#     )
#     print('Tables creees:')
#     for t in tables:
#         print(' -', t['table_name'])
#     await conn.close()



import os, asyncio, json, traceback
from openai import AsyncOpenAI
from app.config import get_settings

s = get_settings()

print('base', s.OPENAI_BASE_URL)
print('model', s.OPENAI_MODEL)
print('key', s.OPENAI_API_KEY[:12])

client = AsyncOpenAI(
    api_key=s.OPENAI_API_KEY, 
    base_url=s.OPENAI_BASE_URL, 
    timeout=60.0, 
    max_retries=0)

async def main():
    try:
        r = await client.chat.completions.create(model=s.OPENAI_MODEL, messages=[{'role':'user','content':'Hello'}], max_tokens=20)
        print('success', r.choices[0].message.content)
    except Exception as e:
        print('ERROR', type(e), e)
        traceback.print_exc()
asyncio.run(main())


