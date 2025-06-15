#!/bin/sh

echo "Esperando o banco de dados ficar disponível..."

until nc -z db 3306; do
  echo "Ainda esperando..."
  sleep 2
done

echo "Banco de dados disponível!"

exec "$@"
