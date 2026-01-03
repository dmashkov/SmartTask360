-- SmartTask360 Database Initialization
-- Enable required extensions

CREATE EXTENSION IF NOT EXISTS ltree;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE smarttask360 TO smarttask;
