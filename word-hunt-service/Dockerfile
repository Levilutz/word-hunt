FROM python:3.13-slim AS base

RUN pip3 install --upgrade pip

WORKDIR /app

COPY requirements.txt .

RUN pip3 install --upgrade -r requirements.txt

COPY main.py .
COPY src ./src

FROM base AS dev

CMD [ "fastapi", "dev", "main.py", "--host", "0.0.0.0" ]

FROM base AS prod

CMD [ "fastapi", "main.py", "--host", "0.0.0.0" ]

FROM golang:1.25-alpine AS migrations-builder

RUN go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

FROM alpine:3.22 AS migrations

COPY migrations /migrations

COPY --from=migrations-builder /go/bin/migrate /migrate

CMD [ "sh", "-c", "/migrate -database ${POSTGRES_URL} -path /migrations up"]
