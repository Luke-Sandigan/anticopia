
from fastapi import FastAPI

from app.routes import router

app = FastAPI(
    title="ANTICOPIA Lightweight CV",
    docs_url=None,
    redoc_url=None,
)

app.include_router(router)
