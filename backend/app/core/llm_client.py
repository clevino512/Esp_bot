from typing import Any, AsyncGenerator
import logging
import time

from openai import AsyncOpenAI

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class LLMClient:
    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self._client: AsyncOpenAI | None = None

    @property
    def client(self) -> AsyncOpenAI:
        if self._client is None:
            if self.provider == "openai":
                self._client = AsyncOpenAI(
                    api_key=settings.OPENAI_API_KEY,
                    base_url=settings.OPENAI_BASE_URL,
                    max_retries=2,
                    timeout=60.0,
                )
            else:
                self._client = AsyncOpenAI(
                    base_url=f"{settings.OLLAMA_BASE_URL}/v1",
                    api_key="ollama",
                    max_retries=2,
                    timeout=120.0,
                )
        return self._client

    @property
    def model(self) -> str:
        if self.provider == "openai":
            return settings.OPENAI_MODEL
        return settings.OLLAMA_MODEL

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        context: list[dict[str, Any]] | None = None,
    ) -> str:
        messages = [{"role": "system", "content": system_prompt}]

        if context:
            context_text = "\n\n".join(
                f"[Source {i+1}]\n{c.get('content', '')}"
                for i, c in enumerate(context)
            )
            messages.append({
                "role": "user",
                "content": f"Contexte:\n{context_text}\n\nQuestion: {user_prompt}",
            })
        else:
            messages.append({"role": "user", "content": user_prompt})

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=settings.OPENAI_MAX_TOKENS,
            temperature=settings.OPENAI_TEMPERATURE,
        )

        return response.choices[0].message.content or ""

    async def generate_stream(
        self,
        system_prompt: str,
        user_prompt: str,
        context: list[dict[str, Any]] | None = None,
    ) -> AsyncGenerator[str, None]:
        messages = [{"role": "system", "content": system_prompt}]

        if context:
            context_text = "\n\n".join(
                f"[Source {i+1}]\n{c.get('content', '')}"
                for i, c in enumerate(context)
            )
            messages.append({
                "role": "user",
                "content": f"Contexte:\n{context_text}\n\nQuestion: {user_prompt}",
            })
        else:
            messages.append({"role": "user", "content": user_prompt})

        stream = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=settings.OPENAI_MAX_TOKENS,
            temperature=settings.OPENAI_TEMPERATURE,
            stream=True,
        )

        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    async def generate_with_timing(
        self,
        system_prompt: str,
        user_prompt: str,
        context: list[dict[str, Any]] | None = None,
    ) -> tuple[str, int]:
        start = time.perf_counter()
        response = await self.generate(system_prompt, user_prompt, context)
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        return response, elapsed_ms
