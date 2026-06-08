#!/bin/bash

# Script to generate PgBouncer userlist from environment variables
# Usage: ./generate-pgbouncer-userlist.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$(dirname "$SCRIPT_DIR")/config"
TEMPLATE_FILE="$CONFIG_DIR/pgbouncer_userlist.txt.template"
OUTPUT_FILE="$CONFIG_DIR/pgbouncer_userlist.txt"

# Check if template exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "❌ Template file not found: $TEMPLATE_FILE"
    exit 1
fi

# Check if required environment variables are set
REQUIRED_VARS=(
    "POSTGRES_PASSWORD"
    "AUTH_DB_PASSWORD"
    "USER_DB_PASSWORD"
    "WALLET_DB_PASSWORD"
    "PAYMENT_DB_PASSWORD"
    "CONTENT_DB_PASSWORD"
    "MEDIA_DB_PASSWORD"
    "SEARCH_DB_PASSWORD"
    "NOTIFICATION_DB_PASSWORD"
    "REWARD_DB_PASSWORD"
    "ANALYTICS_DB_PASSWORD"
    "RECOMMENDATION_DB_PASSWORD"
    "REALITY_DB_PASSWORD"
    "MOVIE_DB_PASSWORD"
    "GAMES_DB_PASSWORD"
    "COMEDY_DB_PASSWORD"
    "SPORTS_DB_PASSWORD"
    "LIFESTYLE_DB_PASSWORD"
    "VERTICAL_DB_PASSWORD"
    "CREATOR_DB_PASSWORD"
    "SUPPORT_DB_PASSWORD"
    "MODERATION_DB_PASSWORD"
    "QUEUE_DB_PASSWORD"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "❌ Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    exit 1
fi

# Generate userlist from template
echo "📝 Generating PgBouncer userlist..."

# Use envsubst to replace variables in template
if command -v envsubst &> /dev/null; then
    envsubst < "$TEMPLATE_FILE" > "$OUTPUT_FILE"
else
    # Fallback: manual replacement
    cp "$TEMPLATE_FILE" "$OUTPUT_FILE"
    
    for var in "${REQUIRED_VARS[@]}"; do
        value="${!var}"
        # Escape special characters in password for sed
        escaped_value=$(printf '%s\n' "$value" | sed -e 's/[\/&]/\\&/g')
        sed -i "s/\${${var}}/${escaped_value}/g" "$OUTPUT_FILE"
    done
fi

echo "✅ PgBouncer userlist generated: $OUTPUT_FILE"
echo "⚠️  Remember to add pgbouncer_userlist.txt to .gitignore"
