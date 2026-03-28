.PHONY: up down restart logs shell-app shell-db artisan composer npm migrate seed fresh test build

up:
	docker compose up -d --build

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

shell-app:
	docker compose exec app bash

shell-db:
	docker compose exec db mysql -u obraplus -psenha123 obraplus

artisan:
	docker compose exec app php artisan $(cmd)

composer:
	docker compose exec app composer $(cmd)

npm:
	docker compose exec frontend npm $(cmd)

migrate:
	docker compose exec app php artisan migrate

seed:
	docker compose exec app php artisan db:seed

fresh:
	docker compose exec app php artisan migrate:fresh --seed

test:
	docker compose exec app php artisan test

build:
	docker compose -f docker-compose.prod.yml up -d --build
