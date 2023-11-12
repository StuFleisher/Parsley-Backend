DROP DATABASE parsley;
CREATE DATABASE parsley;
\connect parsley

\i parsley-schema.sql
-- \i parsley-seed.sql

\echo 'Delete and recreate parsley_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE parsley_test;
CREATE DATABASE parsley_test;
\connect parsley_test

\i parsley-schema.sql
