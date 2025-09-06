import express from 'express';
import { DatabaseConnections } from '../config/database';

const router = express.Router();
const dbManager = DatabaseConnections.getInstance();

// 데이터베이스 스키마 초기화
router.post('/init/:database', async (req, res) => {
  const { database } = req.params;
  
  try {
    switch (database) {
      case 'sqlite':
        if (!dbManager.sqlite) {
          await dbManager.connectSQLite();
        }
        
        // SQLite 테이블 생성
        dbManager.sqlite!.exec(`
          CREATE TABLE IF NOT EXISTS postal_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            postal_code VARCHAR(20) NOT NULL,
            country_code VARCHAR(3) NOT NULL,
            country_name VARCHAR(100) NOT NULL,
            admin_area1 VARCHAR(100),
            admin_area2 VARCHAR(100),
            admin_area3 VARCHAR(100),
            locality VARCHAR(100),
            thoroughfare VARCHAR(200),
            premise VARCHAR(100),
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE TABLE IF NOT EXISTS performance_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            db_type VARCHAR(20) DEFAULT 'sqlite',
            operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN ('INSERT', 'SELECT', 'UPDATE', 'DELETE', 'BULK_INSERT')),
            record_count INTEGER NOT NULL,
            execution_time_ms INTEGER NOT NULL,
            memory_usage_mb DECIMAL(10, 2),
            cpu_usage_percent DECIMAL(5, 2),
            query_complexity VARCHAR(10) CHECK (query_complexity IN ('SIMPLE', 'MEDIUM', 'COMPLEX')) DEFAULT 'SIMPLE',
            test_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            notes TEXT
          );
          
          CREATE INDEX IF NOT EXISTS idx_postal_codes_postal_code ON postal_codes (postal_code);
          CREATE INDEX IF NOT EXISTS idx_postal_codes_country_postal ON postal_codes (country_code, postal_code);
        `);
        
        return res.json({
          status: 'Success',
          database,
          message: 'SQLite tables created successfully',
          timestamp: new Date().toISOString()
        });
        
      default:
        return res.status(400).json({
          error: 'Invalid database type',
          supported: ['sqlite']
        });
    }
  } catch (error) {
    return res.status(500).json({
      status: 'Failed',
      database,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 테이블 목록 조회
router.get('/tables/:database', async (req, res) => {
  const { database } = req.params;
  
  try {
    let tables: any[] = [];
    
    switch (database) {
      case 'sqlite':
        if (!dbManager.sqlite) {
          await dbManager.connectSQLite();
        }
        const result = dbManager.sqlite!.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        tables = result.map((row: any) => row.name);
        break;
        
      default:
        return res.status(400).json({
          error: 'Invalid database type',
          supported: ['sqlite']
        });
    }
    
    return res.json({
      status: 'Success',
      database,
      tables,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      status: 'Failed',
      database,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
