import express from 'express';
import { DatabaseConnections } from '../config/database';

const router = express.Router();
const dbManager = DatabaseConnections.getInstance();

// 데이터베이스 상태 확인
router.get('/health', async (_req, res) => {
  try {
    const health = await dbManager.healthCheck();
    const totalConnected = Object.values(health).filter(Boolean).length;
    
    res.json({
      status: 'OK',
      connected: totalConnected,
      total: Object.keys(health).length,
      databases: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Database health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 개별 데이터베이스 연결 테스트
router.post('/connect/:database', async (req, res) => {
  const { database } = req.params;
  
  try {
    switch (database) {
      case 'mysql':
        await dbManager.connectMySQL();
        return res.json({
          status: 'Connected',
          database,
          timestamp: new Date().toISOString()
        });
      case 'postgresql':
        await dbManager.connectPostgreSQL();
        return res.json({
          status: 'Connected',
          database,
          timestamp: new Date().toISOString()
        });
      case 'mongodb':
        await dbManager.connectMongoDB();
        return res.json({
          status: 'Connected',
          database,
          timestamp: new Date().toISOString()
        });
      case 'sqlite':
        await dbManager.connectSQLite();
        return res.json({
          status: 'Connected',
          database,
          timestamp: new Date().toISOString()
        });
      case 'oracle':
        await dbManager.connectOracle();
        return res.json({
          status: 'Connected',
          database,
          timestamp: new Date().toISOString()
        });
      default:
        return res.status(400).json({
          error: 'Invalid database type',
          supported: ['mysql', 'postgresql', 'mongodb', 'sqlite', 'oracle']
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

// 데이터베이스 정보 조회
router.get('/info', async (_req, res) => {
  try {
    const info = {
      mysql: {
        type: 'Relational Database',
        port: 3306,
        features: ['ACID', 'Transactions', 'Indexing', 'Replication']
      },
      postgresql: {
        type: 'Object-Relational Database',
        port: 5432,
        features: ['ACID', 'JSON Support', 'Extensions', 'Full-text Search']
      },
      mongodb: {
        type: 'Document Database',
        port: 27017,
        features: ['Schema-less', 'GridFS', 'Aggregation Pipeline', 'Sharding']
      },
      sqlite: {
        type: 'File-based Database',
        port: 'N/A',
        features: ['Serverless', 'Self-contained', 'Zero-configuration', 'Cross-platform']
      },
      oracle: {
        type: 'Enterprise Database',
        port: 1521,
        features: ['ACID', 'PL/SQL', 'Partitioning', 'Advanced Analytics']
      }
    };
    
    res.json({
      status: 'OK',
      databases: info,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
