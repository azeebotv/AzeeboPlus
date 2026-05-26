#!/bin/bash
cd /Users/deprof/www/azeebo+

# Update each dockerfile path
sed -i '49s|.*|      dockerfile: services/auth-service/Dockerfile|' docker-compose.yml
sed -i '75s|.*|      dockerfile: services/user-service/Dockerfile|' docker-compose.yml
sed -i '100s|.*|      dockerfile: services/wallet-service/Dockerfile|' docker-compose.yml
sed -i '124s|.*|      dockerfile: services/payment-service/Dockerfile|' docker-compose.yml
sed -i '150s|.*|      dockerfile: services/content-service/Dockerfile|' docker-compose.yml
sed -i '174s|.*|      dockerfile: services/search-service/Dockerfile|' docker-compose.yml
sed -i '198s|.*|      dockerfile: services/notification-service/Dockerfile|' docker-compose.yml
sed -i '226s|.*|      dockerfile: services/reward-service/Dockerfile|' docker-compose.yml
sed -i '250s|.*|      dockerfile: services/analytics-service/Dockerfile|' docker-compose.yml
sed -i '274s|.*|      dockerfile: services/recommendation-service/Dockerfile|' docker-compose.yml
sed -i '298s|.*|      dockerfile: services/reality-service/Dockerfile|' docker-compose.yml
sed -i '322s|.*|      dockerfile: services/queue-service/Dockerfile|' docker-compose.yml
sed -i '349s|.*|      dockerfile: services/creator-service/Dockerfile|' docker-compose.yml
sed -i '373s|.*|      dockerfile: services/media-service/Dockerfile|' docker-compose.yml
sed -i '399s|.*|      dockerfile: services/lifestyle-service/Dockerfile|' docker-compose.yml
sed -i '421s|.*|      dockerfile: services/vertical-service/Dockerfile|' docker-compose.yml
sed -i '443s|.*|      dockerfile: services/support-service/Dockerfile|' docker-compose.yml
sed -i '468s|.*|      dockerfile: services/api-gateway/Dockerfile|' docker-compose.yml
sed -i '536s|.*|      dockerfile: apps/web/Dockerfile|' docker-compose.yml

echo "Done updating dockerfile paths"
grep "dockerfile:" docker-compose.yml
