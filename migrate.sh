#!/bin/bash
echo "Copying migration script to container..."
sudo docker cp backend/add_columns_custom.py nibiaa_tms_backend:/app/add_columns_custom.py

echo "Running migration script..."
sudo docker exec nibiaa_tms_backend python3 add_columns_custom.py
