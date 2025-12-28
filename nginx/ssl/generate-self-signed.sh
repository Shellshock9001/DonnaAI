#!/bin/bash
# Generate self-signed SSL certificate for development
# For production, use Let's Encrypt or a proper CA

mkdir -p ssl

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem

echo "Self-signed certificate generated in ssl/ directory"
echo "For production, replace these with certificates from a trusted CA"

