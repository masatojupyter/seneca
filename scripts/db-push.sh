#!/bin/bash

# Load environment variables and run Prisma command
set -a
source .env.local
set +a

npx prisma db push
