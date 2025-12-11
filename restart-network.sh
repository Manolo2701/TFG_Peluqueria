#!/bin/bash
echo "Reiniciando configuración de red..."
docker-compose down
./install-linux.sh