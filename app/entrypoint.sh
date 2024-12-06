#!/bin/bash

# Log the start of the script
echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting entrypoint script."

# Retrieve database connection details
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASS=${DB_PASS}
# DB_USER=$(cat /run/secrets/DB_USER)
# DB_PASS=$(cat /run/secrets/DB_PASS)
DB_HOST=${DB_HOST}

# Log retrieved secrets for debugging (do NOT log sensitive data in production)
if [ -z "$DB_USER" ] || [ -z "$DB_PASS" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ERROR: Secrets not retrieved. DB_USER or DB_PASS is empty."
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Successfully retrieved secrets from Secrets Manager."
fi

# Initialize WordPress files if not already initialized
if [ ! -f /var/www/html/.initialized ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - WordPress files not found. Initializing..."

    # Copy WordPress files to the target directory
    cp -r /usr/src/wordpress/* /var/www/html/

    # Set ownership and permissions
    chown -R www-data:www-data /var/www/html/
    chmod -R 755 /var/www/html/

    # Create initialization flag file
    touch /var/www/html/.initialized

    echo "$(date '+%Y-%m-%d %H:%M:%S') - WordPress initialization completed."
fi

# Generate wp-config.php if not already present
if [ ! -f /var/www/html/wp-config.php ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - wp-config.php not found. Creating from sample."

    # Copy wp-config-sample.php to wp-config.php
    cp /usr/src/wordpress/wp-config-sample.php /var/www/html/wp-config.php

    # Set ownership and permissions for wp-config.php
    chown www-data:www-data /var/www/html/wp-config.php
    chmod 644 /var/www/html/wp-config.php

    # Replace placeholders with actual database connection details
    sed -i -e "s/database_name_here/${DB_NAME}/" /var/www/html/wp-config.php
    sed -i -e "s/username_here/${DB_USER}/" /var/www/html/wp-config.php
    sed -i -e "s/password_here/${DB_PASS}/" /var/www/html/wp-config.php
    sed -i -e "s/localhost/${DB_HOST}/" /var/www/html/wp-config.php

    echo "$(date '+%Y-%m-%d %H:%M:%S') - wp-config.php setup completed."
fi

# Start Apache server in the foreground
exec apache2-foreground

# #!/bin/bash

# # Retrieve database connection details from environment variables and Secrets Manager
# DB_NAME=${DB_NAME}
# DB_USER=$(cat /run/secrets/DB_USER)
# DB_PASS=$(cat /run/secrets/DB_PASS)
# DB_HOST=${DB_HOST}

# # Initialize WordPress files if not already initialized
# if [ ! -f /var/www/html/.initialized ]; then
#     echo "$(date '+%Y-%m-%d %H:%M:%S') - WordPress files not found. Initializing..."

#     # Copy WordPress files to the target directory
#     cp -r /usr/src/wordpress/* /var/www/html/

#     # Set ownership and permissions
#     chown -R www-data:www-data /var/www/html/
#     chmod -R 755 /var/www/html/

#     # Create initialization flag file
#     touch /var/www/html/.initialized

#     echo "$(date '+%Y-%m-%d %H:%M:%S') - WordPress initialization completed."
# fi

# # Generate wp-config.php if not already present
# if [ ! -f /var/www/html/wp-config.php ]; then
#     echo "$(date '+%Y-%m-%d %H:%M:%S') - wp-config.php not found. Creating from sample."

#     # Copy wp-config-sample.php to wp-config.php
#     cp /usr/src/wordpress/wp-config-sample.php /var/www/html/wp-config.php

#     # Set ownership and permissions for wp-config.php
#     chown www-data:www-data /var/www/html/wp-config.php
#     chmod 644 /var/www/html/wp-config.php

#     # Replace placeholders with actual database connection details
#     sed -i -e "s/database_name_here/${DB_NAME}/" /var/www/html/wp-config.php
#     sed -i -e "s/username_here/${DB_USER}/" /var/www/html/wp-config.php
#     sed -i -e "s/password_here/${DB_PASS}/" /var/www/html/wp-config.php
#     sed -i -e "s/localhost/${DB_HOST}/" /var/www/html/wp-config.php

#     echo "$(date '+%Y-%m-%d %H:%M:%S') - wp-config.php setup completed."
# fi

# # Start Apache server in the foreground
# exec apache2-foreground