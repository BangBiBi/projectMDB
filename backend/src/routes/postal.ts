import express from 'express';
import mongoose from 'mongoose';
import { DatabaseConnections } from '../config/database';

const router = express.Router();
const dbManager = DatabaseConnections.getInstance();

interface PostalData {
  id?: string;
  zipCode: string;
  sido: string;
  sigungu: string;
  eupmyeon?: string;
  roadName?: string;
  buildingMain?: number;
  buildingSub?: number;
  fullRoadAddress?: string;
  fullJibunAddress?: string;
}

// 주소 데이터 삽입 API
router.post('/insert', async (req, res) => {
  try {
    const { database, data }: { database: string; data: PostalData[] } = req.body;
    
    if (!database || !data || !Array.isArray(data)) {
      return res.status(400).json({
        error: 'database와 data 배열이 필요합니다',
        example: {
          database: 'mysql',
          data: [{ zipCode: '25627', sido: '강원특별자치도', sigungu: '강릉시' }]
        }
      });
    }

    const supportedDbs = ['mysql', 'postgresql', 'mongodb', 'sqlite', 'oracle'];
    if (!supportedDbs.includes(database)) {
      return res.status(400).json({
        error: '지원하지 않는 데이터베이스',
        supported: supportedDbs
      });
    }

    let result: { count: number };
    switch (database) {
      case 'mysql':
        result = await insertToMySQL(data);
        break;
      case 'postgresql':
        result = await insertToPostgreSQL(data);
        break;
      case 'mongodb':
        result = await insertToMongoDB(data);
        break;
      case 'sqlite':
        result = await insertToSQLite(data);
        break;
      case 'oracle':
        result = await insertToOracle(data);
        break;
      default:
        return res.status(400).json({ error: '지원하지 않는 데이터베이스' });
    }

    return res.json({
      status: 'success',
      database,
      inserted: result.count,
      message: `${result.count}개 데이터가 ${database}에 성공적으로 삽입되었습니다`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('데이터 삽입 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// 데이터 조회 API
router.get('/:database/data', async (req, res) => {
  try {
    const { database } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const supportedDbs = ['mysql', 'postgresql', 'mongodb', 'sqlite', 'oracle'];
    if (!supportedDbs.includes(database)) {
      return res.status(400).json({
        error: '지원하지 않는 데이터베이스',
        supported: supportedDbs
      });
    }

    let result: { data: any[]; count: number };
    switch (database) {
      case 'mysql':
        result = await selectFromMySQL(limit, offset);
        break;
      case 'postgresql':
        result = await selectFromPostgreSQL(limit, offset);
        break;
      case 'mongodb':
        result = await selectFromMongoDB(limit, offset);
        break;
      case 'sqlite':
        result = await selectFromSQLite(limit, offset);
        break;
      case 'oracle':
        result = await selectFromOracle(limit, offset);
        break;
      default:
        return res.status(400).json({ error: '지원하지 않는 데이터베이스' });
    }

    return res.json({
      status: 'success',
      database,
      data: result.data,
      count: result.count,
      limit,
      offset,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('데이터 조회 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// 통계 조회 API
router.get('/stats', async (_req, res) => {
  try {
    const stats: Record<string, any> = {};
    const databases = ['mysql', 'postgresql', 'mongodb', 'sqlite', 'oracle'];

    for (const db of databases) {
      try {
        let count: number;
        switch (db) {
          case 'mysql':
            count = await getCountMySQL();
            break;
          case 'postgresql':
            count = await getCountPostgreSQL();
            break;
          case 'mongodb':
            count = await getCountMongoDB();
            break;
          case 'sqlite':
            count = await getCountSQLite();
            break;
          case 'oracle':
            count = await getCountOracle();
            break;
          default:
            count = 0;
        }
        
        stats[db] = {
          recordCount: count,
          status: 'connected',
          lastChecked: new Date().toISOString()
        };
      } catch (error) {
        stats[db] = {
          recordCount: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          lastChecked: new Date().toISOString()
        };
      }
    }

    return res.json(stats);

  } catch (error) {
    console.error('통계 조회 오류:', error);
    return res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// MySQL 관련 함수들
async function insertToMySQL(data: PostalData[]): Promise<{ count: number }> {
  const connection = await dbManager.connectMySQL();
  
  try {
    console.log(`🔧 MySQL 삽입 시작: ${data.length}개 데이터`);
    
    // 기존 테이블 삭제 후 재생성 (스키마 문제 해결)
    await connection.execute(`DROP TABLE IF EXISTS postal_codes`);
    await connection.execute(`
      CREATE TABLE postal_codes (
        id VARCHAR(255) PRIMARY KEY,
        zip_code VARCHAR(10),
        sido VARCHAR(50),
        sigungu VARCHAR(50),
        eupmyeon VARCHAR(50),
        road_name VARCHAR(100),
        building_main INT DEFAULT 0,
        building_sub INT DEFAULT 0,
        full_road_address TEXT,
        full_jibun_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    console.log('🔧 MySQL 테이블 생성/확인 완료');

    let insertCount = 0;
    
    // 개별 삽입 (안전성을 위해)
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      try {
        const randomSuffix = Math.random().toString(36).substring(2, 11);
        const id = item.id || `${item.zipCode}_${Date.now()}_${randomSuffix}`;
        
        console.log(`🔧 삽입 시도 ${i + 1}/${data.length}: ID=${id}`);
        
        const [result] = await connection.execute(`
          INSERT IGNORE INTO postal_codes 
          (id, zip_code, sido, sigungu, eupmyeon, road_name, building_main, building_sub, 
           full_road_address, full_jibun_address) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id,
          item.zipCode || '',
          item.sido || '',
          item.sigungu || '',
          item.eupmyeon || '',
          item.roadName || '',
          item.buildingMain || 0,
          item.buildingSub || 0,
          item.fullRoadAddress || '',
          item.fullJibunAddress || ''
        ]);
        
        // MySQL result는 객체이고 affectedRows 속성을 가지고 있음
        const affectedRows = (result as any).affectedRows;
        console.log(`🔧 삽입 결과: affectedRows=${affectedRows}`);
        
        if (affectedRows > 0) {
          insertCount++;
          console.log(`✅ 삽입 성공: ${insertCount}번째 레코드`);
        } else {
          console.log(`⚠️ 삽입 실패 또는 중복: ${id}`);
        }
      } catch (error) {
        console.error(`❌ MySQL 개별 삽입 오류 (${i + 1}/${data.length}):`, error);
      }
    }
    
    console.log(`🔧 MySQL 삽입 완료: ${insertCount}/${data.length}개 성공`);
    return { count: insertCount };
  } catch (error) {
    console.error('❌ MySQL insertToMySQL 전체 오류:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

async function selectFromMySQL(limit: number, offset: number): Promise<{ data: any[]; count: number }> {
  const connection = await dbManager.connectMySQL();
  
  try {
    // 테이블이 존재하는지 먼저 확인
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS postal_codes (
        id VARCHAR(255) PRIMARY KEY,
        zip_code VARCHAR(10),
        sido VARCHAR(50),
        sigungu VARCHAR(50),
        eupmyeon VARCHAR(50),
        road_name VARCHAR(100),
        building_main INT DEFAULT 0,
        building_sub INT DEFAULT 0,
        full_road_address TEXT,
        full_jibun_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    
    const [rows] = await connection.query(
      'SELECT * FROM postal_codes ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    
    return { data: rows as any[], count: (rows as any[]).length };
  } finally {
    await connection.end();
  }
}

async function getCountMySQL(): Promise<number> {
  const connection = await dbManager.connectMySQL();
  
  try {
    // 테이블이 존재하는지 먼저 확인
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS postal_codes (
        id VARCHAR(255) PRIMARY KEY,
        zip_code VARCHAR(10),
        sido VARCHAR(50),
        sigungu VARCHAR(50),
        eupmyeon VARCHAR(50),
        road_name VARCHAR(100),
        building_main INT DEFAULT 0,
        building_sub INT DEFAULT 0,
        full_road_address TEXT,
        full_jibun_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM postal_codes');
    return (rows as any[])[0].count;
  } finally {
    await connection.end();
  }
}

// PostgreSQL, MongoDB, SQLite 함수들 실제 구현
async function insertToPostgreSQL(data: PostalData[]): Promise<{ count: number }> {
  const client = await dbManager.connectPostgreSQL();
  
  try {
    console.log(`🔧 PostgreSQL 삽입 시작: ${data.length}개 데이터`);
    
    // 기존 테이블 삭제 후 재생성 (스키마 문제 해결)
    await client.query(`DROP TABLE IF EXISTS postal_codes`);
    await client.query(`
      CREATE TABLE postal_codes (
        id VARCHAR(255) PRIMARY KEY,
        zip_code VARCHAR(10),
        sido VARCHAR(50),
        sigungu VARCHAR(50),
        eupmyeon VARCHAR(50),
        road_name VARCHAR(100),
        building_main INTEGER DEFAULT 0,
        building_sub INTEGER DEFAULT 0,
        full_road_address TEXT,
        full_jibun_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('🔧 PostgreSQL 테이블 생성/확인 완료');

    let insertCount = 0;
    
    // 개별 삽입 (안전성을 위해)
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      try {
        const randomSuffix = Math.random().toString(36).substring(2, 11);
        const id = item.id || `${item.zipCode}_${Date.now()}_${randomSuffix}`;
        
        console.log(`🔧 PostgreSQL 삽입 시도 ${i + 1}/${data.length}: ID=${id}`);
        
        const result = await client.query(`
          INSERT INTO postal_codes 
          (id, zip_code, sido, sigungu, eupmyeon, road_name, building_main, building_sub, 
           full_road_address, full_jibun_address) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO NOTHING
          RETURNING id
        `, [
          id,
          item.zipCode || '',
          item.sido || '',
          item.sigungu || '',
          item.eupmyeon || '',
          item.roadName || '',
          item.buildingMain || 0,
          item.buildingSub || 0,
          item.fullRoadAddress || '',
          item.fullJibunAddress || ''
        ]);
        
        if (result.rows.length > 0) {
          insertCount++;
          console.log(`✅ PostgreSQL 삽입 성공: ${insertCount}번째 레코드`);
        } else {
          console.log(`⚠️ PostgreSQL 삽입 실패 또는 중복: ${id}`);
        }
      } catch (error) {
        console.error(`❌ PostgreSQL 개별 삽입 오류 (${i + 1}/${data.length}):`, error);
      }
    }
    
    console.log(`🔧 PostgreSQL 삽입 완료: ${insertCount}/${data.length}개 성공`);
    return { count: insertCount };
  } catch (error) {
    console.error('❌ PostgreSQL insertToPostgreSQL 전체 오류:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function selectFromPostgreSQL(limit: number, offset: number): Promise<{ data: any[]; count: number }> {
  const client = await dbManager.connectPostgreSQL();
  
  try {
    // 테이블이 존재하는지 먼저 확인
    await client.query(`
      CREATE TABLE IF NOT EXISTS postal_codes (
        id VARCHAR(255) PRIMARY KEY,
        zip_code VARCHAR(10),
        sido VARCHAR(50),
        sigungu VARCHAR(50),
        eupmyeon VARCHAR(50),
        road_name VARCHAR(100),
        building_main INTEGER DEFAULT 0,
        building_sub INTEGER DEFAULT 0,
        full_road_address TEXT,
        full_jibun_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const result = await client.query(
      'SELECT * FROM postal_codes ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    
    return { data: result.rows, count: result.rows.length };
  } finally {
    await client.end();
  }
}

async function getCountPostgreSQL(): Promise<number> {
  const client = await dbManager.connectPostgreSQL();
  
  try {
    // 테이블이 존재하는지 먼저 확인
    await client.query(`
      CREATE TABLE IF NOT EXISTS postal_codes (
        id VARCHAR(255) PRIMARY KEY,
        zip_code VARCHAR(10),
        sido VARCHAR(50),
        sigungu VARCHAR(50),
        eupmyeon VARCHAR(50),
        road_name VARCHAR(100),
        building_main INTEGER DEFAULT 0,
        building_sub INTEGER DEFAULT 0,
        full_road_address TEXT,
        full_jibun_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const result = await client.query('SELECT COUNT(*) as count FROM postal_codes');
    return parseInt(result.rows[0].count);
  } finally {
    await client.end();
  }
}

async function insertToMongoDB(data: PostalData[]): Promise<{ count: number }> {
  try {
    console.log(`🔧 MongoDB 삽입 시작: ${data.length}개 데이터`);
    
    await dbManager.connectMongoDB();
    const db = mongoose.connection.db;
    
    if (!db) {
      throw new Error('MongoDB database connection is not available');
    }
    
    const collection = db.collection('postal_codes');
    
    let insertCount = 0;
    
    // 간단한 문서 구조로 삽입
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      try {
        console.log(`🔧 MongoDB 문서 생성 ${i + 1}/${data.length}`);
        
        const document = {
          postal_code: String(item.zipCode || ''),  // 필수 필드
          country_code: 'KR',  // 필수 필드 - 한국 코드
          country_name: 'South Korea',  // 필수 필드 - 한국 이름
          zipCode: String(item.zipCode || ''),
          sido: String(item.sido || ''),
          sigungu: String(item.sigungu || ''),
          eupmyeon: String(item.eupmyeon || ''),
          roadName: String(item.roadName || ''),
          buildingMain: Number(item.buildingMain || 0),
          buildingSub: Number(item.buildingSub || 0),
          fullRoadAddress: String(item.fullRoadAddress || ''),
          fullJibunAddress: String(item.fullJibunAddress || ''),
          createdAt: new Date()
        };
        
        // insertOne으로 직접 삽입
        const result = await collection.insertOne(document);
        
        if (result.insertedId) {
          insertCount++;
          console.log(`✅ MongoDB 삽입 성공: ${insertCount}번째 레코드 (ID: ${result.insertedId})`);
        }
        
      } catch (error: any) {
        console.error(`❌ MongoDB 개별 삽입 오류 (${i + 1}/${data.length}):`, error);
        console.error('오류 상세:', JSON.stringify(error, null, 2));
      }
    }
    
    console.log(`🔧 MongoDB 삽입 완료: ${insertCount}/${data.length}개 성공`);
    return { count: insertCount };
  } catch (error) {
    console.error('❌ MongoDB insertToMongoDB 전체 오류:', error);
    return { count: 0 };
  }
}

async function selectFromMongoDB(limit: number, offset: number): Promise<{ data: any[]; count: number }> {
  try {
    await dbManager.connectMongoDB();
    const db = mongoose.connection.db;
    
    if (!db) {
      throw new Error('MongoDB database connection is not available');
    }
    
    const collection = db.collection('postal_codes');
    
    const data = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .toArray();
    
    return { data, count: data.length };
  } catch (error) {
    console.error('❌ MongoDB selectFromMongoDB 오류:', error);
    throw error;
  }
}

async function getCountMongoDB(): Promise<number> {
  try {
    await dbManager.connectMongoDB();
    const db = mongoose.connection.db;
    
    if (!db) {
      throw new Error('MongoDB database connection is not available');
    }
    
    const collection = db.collection('postal_codes');
    
    return await collection.countDocuments();
  } catch (error) {
    console.error('❌ MongoDB getCountMongoDB 오류:', error);
    return 0;
  }
}

async function insertToSQLite(data: PostalData[]): Promise<{ count: number }> {
  const db = await dbManager.connectSQLite();
  
  try {
    console.log(`🔧 SQLite 삽입 시작: ${data.length}개 데이터`);
    
    // 테이블이 없으면 생성
    db.exec(`
      CREATE TABLE IF NOT EXISTS postal_codes (
        id TEXT PRIMARY KEY,
        zip_code TEXT,
        sido TEXT,
        sigungu TEXT,
        eupmyeon TEXT,
        road_name TEXT,
        building_main INTEGER DEFAULT 0,
        building_sub INTEGER DEFAULT 0,
        full_road_address TEXT,
        full_jibun_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('🔧 SQLite 테이블 생성/확인 완료');

    let insertCount = 0;
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      try {
        const randomSuffix = Math.random().toString(36).substring(2, 11);
        const id = item.id || `${item.zipCode}_${Date.now()}_${randomSuffix}`;
        
        console.log(`🔧 SQLite 삽입 시도 ${i + 1}/${data.length}: ID=${id}`);
        
        const stmt = db.prepare(`
          INSERT OR IGNORE INTO postal_codes 
          (id, zip_code, sido, sigungu, eupmyeon, road_name, building_main, building_sub, 
           full_road_address, full_jibun_address) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
          id,
          item.zipCode || '',
          item.sido || '',
          item.sigungu || '',
          item.eupmyeon || '',
          item.roadName || '',
          item.buildingMain || 0,
          item.buildingSub || 0,
          item.fullRoadAddress || '',
          item.fullJibunAddress || ''
        );
        
        if (result.changes && result.changes > 0) {
          insertCount++;
          console.log(`✅ SQLite 삽입 성공: ${insertCount}번째 레코드`);
        } else {
          console.log(`⚠️ SQLite 삽입 실패 또는 중복: ${id}`);
        }
      } catch (error) {
        console.error(`❌ SQLite 개별 삽입 오류 (${i + 1}/${data.length}):`, error);
      }
    }
    
    console.log(`🔧 SQLite 삽입 완료: ${insertCount}/${data.length}개 성공`);
    return { count: insertCount };
  } catch (error) {
    console.error('❌ SQLite insertToSQLite 전체 오류:', error);
    throw error;
  }
}

async function selectFromSQLite(limit: number, offset: number): Promise<{ data: any[]; count: number }> {
  const db = await dbManager.connectSQLite();
  
  try {
    // 테이블이 존재하는지 먼저 확인
    db.exec(`
      CREATE TABLE IF NOT EXISTS postal_codes (
        id TEXT PRIMARY KEY,
        zip_code TEXT,
        sido TEXT,
        sigungu TEXT,
        eupmyeon TEXT,
        road_name TEXT,
        building_main INTEGER DEFAULT 0,
        building_sub INTEGER DEFAULT 0,
        full_road_address TEXT,
        full_jibun_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const stmt = db.prepare('SELECT * FROM postal_codes ORDER BY created_at DESC LIMIT ? OFFSET ?');
    const data = stmt.all(limit, offset);
    
    return { data, count: data.length };
  } catch (error) {
    console.error('❌ SQLite selectFromSQLite 오류:', error);
    throw error;
  }
}

async function getCountSQLite(): Promise<number> {
  const db = await dbManager.connectSQLite();
  
  try {
    // 테이블이 존재하는지 먼저 확인
    db.exec(`
      CREATE TABLE IF NOT EXISTS postal_codes (
        id TEXT PRIMARY KEY,
        zip_code TEXT,
        sido TEXT,
        sigungu TEXT,
        eupmyeon TEXT,
        road_name TEXT,
        building_main INTEGER DEFAULT 0,
        building_sub INTEGER DEFAULT 0,
        full_road_address TEXT,
        full_jibun_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const stmt = db.prepare('SELECT COUNT(*) as count FROM postal_codes');
    const result = stmt.get();
    return (result as any).count;
  } catch (error) {
    console.error('❌ SQLite getCountSQLite 오류:', error);
    return 0;
  }
}

// Oracle 관련 함수들
async function insertToOracle(data: PostalData[]): Promise<{ count: number }> {
  try {
    console.log(`🔧 Oracle 삽입 시작: ${data.length}개 데이터`);
    
    const connection = await dbManager.connectOracle();
    
    // Oracle 테이블 생성 (존재하지 않는 경우만)
    try {
      await connection.execute(`
        CREATE TABLE postal_codes (
          id VARCHAR2(200) PRIMARY KEY,
          zip_code VARCHAR2(10),
          sido VARCHAR2(50),
          sigungu VARCHAR2(50),
          eupmyeon VARCHAR2(50),
          road_name VARCHAR2(100),
          building_main NUMBER DEFAULT 0,
          building_sub NUMBER DEFAULT 0,
          full_road_address VARCHAR2(500),
          full_jibun_address VARCHAR2(500),
          created_at DATE DEFAULT SYSDATE
        )
      `);
      console.log('✅ Oracle 새 테이블 생성 완료');
    } catch (error: any) {
      if (error.errorNum === 955) { // ORA-00955: name is already used by an existing object
        console.log('ℹ️ Oracle 테이블이 이미 존재함');
      } else {
        console.error('❌ Oracle 테이블 생성 오류:', error.message);
      }
    }
    
    let insertCount = 0;
    
    // 개별 삽입으로 중복 처리
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      try {
        const result = await connection.execute(
          `MERGE INTO postal_codes t1
           USING (SELECT :id as id FROM dual) t2
           ON (t1.id = t2.id)
           WHEN NOT MATCHED THEN
             INSERT (id, zip_code, sido, sigungu, eupmyeon, road_name, building_main, building_sub, full_road_address, full_jibun_address)
             VALUES (:id, :zipCode, :sido, :sigungu, :eupmyeon, :roadName, :buildingMain, :buildingSub, :fullRoadAddress, :fullJibunAddress)`,
          {
            id: item.id,
            zipCode: item.zipCode || '',
            sido: item.sido || '',
            sigungu: item.sigungu || '',
            eupmyeon: item.eupmyeon || '',
            roadName: item.roadName || '',
            buildingMain: item.buildingMain || 0,
            buildingSub: item.buildingSub || 0,
            fullRoadAddress: item.fullRoadAddress || '',
            fullJibunAddress: item.fullJibunAddress || ''
          }
        );
        
        if (result.rowsAffected && result.rowsAffected > 0) {
          insertCount++;
          if (insertCount <= 5) {
            console.log(`✅ Oracle 삽입 성공: ${insertCount}번째 레코드 (ID: ${item.id})`);
          }
        } else {
          console.log(`⚠️ Oracle 삽입 중복: ${item.id}`);
        }
        
      } catch (error: any) {
        console.error(`❌ Oracle 개별 삽입 오류 (${i + 1}/${data.length}):`, error.message);
        console.error('Oracle 데이터:', JSON.stringify(item, null, 2));
      }
    }
    
    await connection.commit();
    console.log(`🔧 Oracle 삽입 완료: ${insertCount}/${data.length}개 성공`);
    return { count: insertCount };
    
  } catch (error) {
    console.error('❌ Oracle insertToOracle 전체 오류:', error);
    return { count: 0 };
  }
}

async function getCountOracle(): Promise<number> {
  try {
    const connection = await dbManager.connectOracle();
    const result = await connection.execute('SELECT COUNT(*) as cnt FROM postal_codes');
    const rows = result.rows as any[];
    return rows && rows[0] ? rows[0][0] : 0;
  } catch (error) {
    console.error('❌ Oracle getCountOracle 오류:', error);
    return 0;
  }
}

async function selectFromOracle(limit: number, offset: number): Promise<{ data: any[]; count: number }> {
  try {
    const connection = await dbManager.connectOracle();
    
    // 데이터 조회
    const dataResult = await connection.execute(
      `SELECT * FROM (
        SELECT postal_codes.*, ROWNUM rnum FROM postal_codes
        WHERE ROWNUM <= :maxRow
      ) WHERE rnum > :offset`,
      {
        maxRow: offset + limit,
        offset: offset
      }
    );
    
    // 전체 개수 조회
    const countResult = await connection.execute('SELECT COUNT(*) as cnt FROM postal_codes');
    
    const data = (dataResult.rows as any[]).map((row: any) => ({
      id: row[0],
      zipCode: row[1],
      sido: row[2],
      sigungu: row[3],
      eupmyeon: row[4],
      roadName: row[5],
      buildingMain: row[6],
      buildingSub: row[7],
      fullRoadAddress: row[8],
      fullJibunAddress: row[9],
      createdAt: row[10]
    }));
    
    const count = (countResult.rows as any[])[0][0];
    
    return { data, count };
  } catch (error) {
    console.error('❌ Oracle selectFromOracle 오류:', error);
    return { data: [], count: 0 };
  }
}

export default router;
