from __future__ import annotations
from fastapi import FastAPI
from pydantic import BaseModel
from config import init_fastapi_app, run_http_server


app: FastAPI = init_fastapi_app()


# indicates the type that gets returned
class AllReturn(BaseModel):
    message: str


@app.get("/", response_model=AllReturn)
def hello_world():
    return AllReturn(message="Hello World")


if __name__ == "__main__":
    run_http_server(app, host="localhost", port=8000)
