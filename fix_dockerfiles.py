#!/usr/bin/env python3
import re

# Read the file
with open('/Users/deprof/www/azeebo+/docker-compose.yml', 'r') as f:
    content = f.read()

# Find all service blocks and their dockerfile paths
services = [
    'auth-service', 'user-service', 'wallet-service', 'payment-service',
    'content-service', 'search-service', 'notification-service', 'reward-service',
    'analytics-service', 'recommendation-service', 'reality-service', 'queue-service',
    'creator-service', 'media-service', 'lifestyle-service', 'vertical-service',
    'support-service', 'api-gateway', 'web-app'
]

# Pattern to find service blocks with dockerfile: services/auth-service/Dockerfile
# We need to find the correct service name for each block
lines = content.split('\n')
current_service = None
service_order = []

for i, line in enumerate(lines):
    if line.strip().startswith('#'):
        continue
    # Check if this is a service name line (ends with :)
    match = re.match(r'^\s+([a-z0-9-]+):\s*$', line.strip())
    if match:
        current_service = match.group(1)
        if current_service in services:
            service_order.append((i, current_service))

# Now update the dockerfile paths
# We need to find each dockerfile: services/auth-service/Dockerfile and replace it
# with the correct service name

service_idx = 0
output_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    if 'dockerfile: services/auth-service/Dockerfile' in line:
        # Replace with the correct service name
        if service_idx < len(service_order):
            service_name = service_order[service_idx][1]
            if service_name == 'web-app':
                line = line.replace('services/auth-service/Dockerfile', 'apps/web/Dockerfile')
            else:
                line = line.replace('services/auth-service/Dockerfile', f'services/{service_name}/Dockerfile')
            service_idx += 1
    output_lines.append(line)
    i += 1

# Write the file
with open('/Users/deprof/www/azeebo+/docker-compose.yml', 'w') as f:
    f.write('\n'.join(output_lines))

print(f"Updated {service_idx} dockerfile paths")
