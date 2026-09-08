from pydantic import BaseModel, ConfigDict


class BrandRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    logo_url: str | None = None
    country: str | None = None
