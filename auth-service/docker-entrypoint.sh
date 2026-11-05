#!/bin/sh
set -eu

mkdir -p /run/keys
if [ ! -s /run/keys/private.pem ] || [ ! -s /run/keys/public.pem ]; then
  umask 077
  openssl genrsa -out /run/keys/private.pem 2048
  openssl rsa -in /run/keys/private.pem -pubout -out /run/keys/public.pem
fi
if [ ! -s /run/keys/tls.key ] || [ ! -s /run/keys/tls.crt ]; then
  umask 077
  openssl req -x509 -new -nodes -keyout /run/keys/tls.key -out /run/keys/tls.crt \
    -newkey rsa:2048 -days 365 -subj "/CN=auth-service" \
    -addext "subjectAltName=DNS:auth-service"
fi

exec npm start
