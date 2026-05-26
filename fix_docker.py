#!/usr/bin/env python3
with open('/Users/deprof/www/azeebo+/docker-compose.yml', 'r') as f:
    lines = f.readlines()

# Define the correct dockerfile paths for each line
updates = {
    48: '      dockerfile: services/auth-service/Dockerfile\n',
    74: '      dockerfile: services/user-service/Dockerfile\n',
    99: '      dockerfile: services/wallet-service/Dockerfile\n',
    123: '      dockerfile: services/payment-service/Dockerfile\n',
    149: '      dockerfile: services/content-service/Dockerfile\n',
    173: '      dockerfile: services/search-service/Dockerfile\n',
    197: '      dockerfile: services/notification-service/Dockerfile\n',
    225: '      dockerfile: services/reward-service/Dockerfile\n',
    249: '      dockerfile: services/analytics-service/Dockerfile\n',
    273: '      dockerfile: services/recommendation-service/Dockerfile\n',
    297: '      dockerfile: services/reality-service/Dockerfile\n',
    321: '      dockerfile: services/queue-service/Dockerfile\n',
    348: '      dockerfile: services/creator-service/Dockerfile\n',
    372: '      dockerfile: services/media-service/Dockerfile\n',
    398: '      dockerfile: services/lifestyle-service/Dockerfile\n',
    420: '      dockerfile: services/vertical-service/Dockerfile\n',
    442: '      dockerfile: services/support-service/Dockerfile\n',
    467: '      dockerfile: services/api-gateway/Dockerfile\n',
    535: '      dockerfile: apps/web/Dockerfile\n',
}

for line_num, new_content in updates.items():
    lines[line_num] = new_content

with open('/Users/deprof/www/azeebo+/docker-compose.yml', 'w') as f:
    f.writelines(lines)

print("Updated dockerfile paths")
