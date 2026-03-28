.PHONY: dev build run clean docker deploy undeploy

dev:
	@echo "Starting frontend dev server..."
	@cd frontend && pnpm install && pnpm dev &
	@echo "Starting Go backend..."
	@go run . -dev

build:
	cd frontend && pnpm install && pnpm build
	go build -o bin/playground .

run: build
	PLAYGROUND_PASSWORD=demo ./bin/playground

clean:
	rm -rf bin/ frontend/dist/ frontend/node_modules/

docker:
	cp -r ../contextdb ./contextdb
	docker build -t context-kitchen-sink:latest .
	rm -rf ./contextdb

deploy: docker
	docker stop playground 2>/dev/null || true
	docker rm playground 2>/dev/null || true
	docker run -d --name playground \
		-p 8091:8080 \
		-e PLAYGROUND_PASSWORD=$${PLAYGROUND_PASSWORD:-contextdb} \
		--restart unless-stopped \
		context-kitchen-sink:latest

undeploy:
	docker stop playground 2>/dev/null || true
	docker rm playground 2>/dev/null || true
