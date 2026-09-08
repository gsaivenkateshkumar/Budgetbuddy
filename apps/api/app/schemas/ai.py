from pydantic import BaseModel


class AIStatus(BaseModel):
    configured: bool
    provider: str
