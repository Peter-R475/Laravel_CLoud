FROM php:8.4-cli-alpine

# 1. Install system utilities and database/string extensions
RUN apk add --no-cache \
    curl \
    git \
    unzip \
    sqlite \
    sqlite-dev \
    libpng-dev \
    libxml2-dev \
    libzip-dev \
    oniguruma-dev

# 2. Install PHP extensions
RUN docker-php-ext-install bcmath mbstring pcntl zip pdo pdo_sqlite

# 3. Copy Composer from official image
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# 4. Copy project files
COPY . .

# 5. Install production PHP packages
RUN composer install --no-dev --optimize-autoloader --no-interaction

# 6. Ensure SQLite database file exists and permissions are writable
RUN touch database/database.sqlite && \
    chmod -R 777 storage bootstrap/cache database

EXPOSE 8080

# 7. Run migrations automatically, then start the PHP server
CMD ["sh", "-c", "php artisan migrate --force && php -S 0.0.0.0:${PORT:-8080} -t public/"]