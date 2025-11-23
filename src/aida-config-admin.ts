import { config as SqlConfig } from 'mssql';

const dbConfigAdmin: SqlConfig =  {
  user: 'aida_admin',
  password: 'Admin2025',
  server: 'localhost',
  database: 'aida_db',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

export default dbConfigAdmin;
