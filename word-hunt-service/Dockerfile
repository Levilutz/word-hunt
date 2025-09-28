FROM python:3.13-slim AS base

RUN pip3 install --upgrade pip

WORKDIR /app

COPY requirements.txt .

RUN pip3 install --upgrade -r requirements.txt

COPY main.py .

FROM base AS dev

CMD [ "fastapi", "dev", "main.py", "--host", "0.0.0.0" ]

FROM base AS prod

CMD [ "fastapi", "main.py", "--host", "0.0.0.0" ]
