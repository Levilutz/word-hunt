from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class RootResp(BaseModel):
    foo: str
    baz: int


@app.get("/")
async def root() -> RootResp:
    return RootResp(foo="bar", baz=125)
