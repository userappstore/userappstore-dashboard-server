rm -rf ~/tmp/data1 && mkdir -p ~/tmp/data1

NODE_ENV="testing" \
APPID="userappstore.server7373.synology.me" \
APPLICATION_SERVER="$USERAPPSTORE_APPLICATION_SERVER" \
APPLICATION_SERVER_TOKEN="$USERAPPSTORE_APPLICATION_SERVER_TOKEN" \
BCRYPT_FIXED_SALT="$USERAPPSTORE_BCRYPT_FIXED_SALT" \
BCRYPT_WORKLOAD_FACTOR=$USERAPPSTORE_BCRYPT_WORKLOAD_FACTOR \
DASHBOARD_SERVER="$USERAPPSTORE_DASHBOARD_SERVER" \
DASHBOARD_SESSION_KEY="$USERAPPSTORE_DASHBOARD_SESSION_KEY" \
UUID_ENCODING_CHARACTERS="$USERAPPSTORE_UUID_ENCODING_CHARACTERS" \
DOMAIN="$USERAPPSTORE_DOMAIN" \
IP="0.0.0.0" \
MAXIMUM_PASSWORD_LENGTH="1024" \
MAXIMUM_RESET_CODE_LENGTH="1024" \
MAXIMUM_USERNAME_LENGTH="1024" \
MINIMUM_PASSWORD_LENGTH="8" \
MINIMUM_RESET_CODE_LENGTH="8" \
MINIMUM_USERNAME_LENGTH="8" \
PAGE_SIZE="40" \
STRIPE_JS="3" \
STRIPE_KEY="$USERAPPSTORE_STRIPE_KEY" \
STRIPE_PUBLISHABLE_KEY="$USERAPPSTORE_STRIPE_PUBLISHABLE_KEY" \
CONNECT_ENDPOINT_SECRET="$USERAPPSTORE_CONNECT_ENDPOINT_SECRET" \
SUBSCRIPTIONS_ENDPOINT_SECRET1="$USERAPPSTORE_SUBSCRIPTIONS_ENDPOINT_SECRET1" \
SUBSCRIPTIONS_ENDPOINT_SECRET2="$USERAPPSTORE_SUBSCRIPTIONS_ENDPOINT_SECRET2" \
STORAGE_PATH=/tmp/data1 \
node main.js
