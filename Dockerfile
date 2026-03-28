FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY contextdb/ ./contextdb/
COPY go.mod go.sum ./
RUN sed -i 's|=> ../contextdb|=> ./contextdb|' go.mod
RUN go mod download
COPY . .
RUN sed -i 's|=> ../contextdb|=> ./contextdb|' go.mod
ARG VERSION=dev
RUN CGO_ENABLED=0 go build -ldflags "-X main.version=${VERSION}" -o playground .

FROM node:22-alpine AS web
WORKDIR /app/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY frontend/ .
RUN pnpm build

FROM alpine:3.21
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /app/playground .
COPY --from=web /app/frontend/dist ./frontend/dist
EXPOSE 8080
CMD ["./playground"]
