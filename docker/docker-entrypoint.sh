#!/bin/bash
set -e

# Replace ServerName in both config files
sed -i "s/ServerName .*/ServerName ${SERVER_NAME}/" /usr/local/apache2/conf/httpd.conf
sed -i "s/ServerName .*/ServerName ${SERVER_NAME}/" /usr/local/apache2/conf/extra/httpd-ssl.conf

# Start Apache in foreground
exec httpd-foreground