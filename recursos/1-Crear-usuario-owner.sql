DO
$do$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'aida_owner') THEN
        CREATE ROLE aida_owner WITH LOGIN PASSWORD 'Owner2025';
    END IF;
END
$do$;