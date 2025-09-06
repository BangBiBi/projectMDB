// MongoDB - 성능 비교용 우편번호 데이터베이스
// 특징: 스키마리스, 수평 확장, 집계 파이프라인, 지리정보 쿼리

// 사용할 데이터베이스 선택
use('postal_codes_db');

// 1. postal_codes 컬렉션 스키마 및 인덱스
db.createCollection('postal_codes', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['postal_code', 'country_code', 'country_name'],
      properties: {
        postal_code: { bsonType: 'string', maxLength: 20 },
        country_code: { bsonType: 'string', maxLength: 3 },
        country_name: { bsonType: 'string', maxLength: 100 },
        admin_area1: { bsonType: 'string', maxLength: 100 },
        admin_area2: { bsonType: 'string', maxLength: 100 },
        admin_area3: { bsonType: 'string', maxLength: 100 },
        locality: { bsonType: 'string', maxLength: 100 },
        thoroughfare: { bsonType: 'string', maxLength: 200 },
        premise: { bsonType: 'string', maxLength: 100 },
        latitude: { bsonType: 'double', minimum: -90, maximum: 90 },
        longitude: { bsonType: 'double', minimum: -180, maximum: 180 },
        location: {
          bsonType: 'object',
          properties: {
            type: { enum: ['Point'] },
            coordinates: { bsonType: 'array', minItems: 2, maxItems: 2 }
          }
        },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' }
      }
    }
  }
});

// postal_codes 인덱스 생성
db.postal_codes.createIndex({ postal_code: 1 });
db.postal_codes.createIndex({ country_code: 1, postal_code: 1 });
db.postal_codes.createIndex({ country_code: 1, admin_area1: 1, admin_area2: 1 });
db.postal_codes.createIndex({ location: '2dsphere' }); // 지리정보 인덱스
db.postal_codes.createIndex({ created_at: 1 });

// 2. performance_metrics 컬렉션 스키마 및 인덱스
db.createCollection('performance_metrics', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['db_type', 'operation_type', 'record_count', 'execution_time_ms'],
      properties: {
        db_type: { bsonType: 'string', enum: ['mongodb'] },
        operation_type: { 
          bsonType: 'string', 
          enum: ['INSERT', 'SELECT', 'UPDATE', 'DELETE', 'BULK_INSERT', 'AGGREGATE'] 
        },
        record_count: { bsonType: 'int', minimum: 0 },
        execution_time_ms: { bsonType: 'int', minimum: 0 },
        memory_usage_mb: { bsonType: 'double', minimum: 0 },
        cpu_usage_percent: { bsonType: 'double', minimum: 0, maximum: 100 },
        query_complexity: { bsonType: 'string', enum: ['SIMPLE', 'MEDIUM', 'COMPLEX'] },
        test_timestamp: { bsonType: 'date' },
        query_plan: { bsonType: 'object' },
        aggregation_pipeline: { bsonType: 'array' },
        notes: { bsonType: 'string' }
      }
    }
  }
});

// performance_metrics 인덱스 생성
db.performance_metrics.createIndex({ db_type: 1 });
db.performance_metrics.createIndex({ operation_type: 1 });
db.performance_metrics.createIndex({ test_timestamp: 1 });
db.performance_metrics.createIndex({ query_complexity: 1 });

// 3. audit_logs 컬렉션 (변경사항 추적)
db.createCollection('audit_logs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['db_type', 'table_name', 'record_id', 'operation_type'],
      properties: {
        db_type: { bsonType: 'string', enum: ['mongodb'] },
        table_name: { bsonType: 'string', maxLength: 50 },
        record_id: { bsonType: 'string', maxLength: 100 },
        operation_type: { bsonType: 'string', enum: ['INSERT', 'UPDATE', 'DELETE'] },
        old_values: { bsonType: 'object' },
        new_values: { bsonType: 'object' },
        changed_fields: { bsonType: 'array' },
        change_source: { bsonType: 'string', maxLength: 50 },
        user_id: { bsonType: 'string', maxLength: 100 },
        session_id: { bsonType: 'string', maxLength: 100 },
        ip_address: { bsonType: 'string', maxLength: 45 },
        transaction_id: { bsonType: 'string', maxLength: 100 },
        created_at: { bsonType: 'date' }
      }
    }
  }
});

// audit_logs 인덱스 생성
db.audit_logs.createIndex({ table_name: 1 });
db.audit_logs.createIndex({ record_id: 1 });
db.audit_logs.createIndex({ operation_type: 1 });
db.audit_logs.createIndex({ created_at: 1 });
db.audit_logs.createIndex({ user_id: 1 });

// 4. data_integrity_checks 컬렉션 (무결성 검사)
db.createCollection('data_integrity_checks', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['check_type', 'source_db', 'table_name'],
      properties: {
        check_type: { bsonType: 'string', maxLength: 50 },
        source_db: { bsonType: 'string', enum: ['mongodb'] },
        target_db: { bsonType: 'string', maxLength: 20 },
        table_name: { bsonType: 'string', maxLength: 50 },
        record_id: { bsonType: 'string', maxLength: 100 },
        check_query: { bsonType: 'object' },
        issue_found: { bsonType: 'bool' },
        issue_description: { bsonType: 'string' },
        data_before: { bsonType: 'object' },
        data_after: { bsonType: 'object' },
        severity_level: { 
          bsonType: 'string', 
          enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] 
        },
        status: { 
          bsonType: 'string', 
          enum: ['PENDING', 'RESOLVED', 'IGNORED'] 
        },
        checked_at: { bsonType: 'date' },
        resolved_at: { bsonType: 'date' },
        notes: { bsonType: 'string' }
      }
    }
  }
});

// data_integrity_checks 인덱스 생성
db.data_integrity_checks.createIndex({ source_db: 1, target_db: 1 });
db.data_integrity_checks.createIndex({ check_type: 1, status: 1 });
db.data_integrity_checks.createIndex({ checked_at: 1 });
db.data_integrity_checks.createIndex({ severity_level: 1 });

// 테스트 데이터 생성 함수
function generateTestData(recordCount) {
  const startTime = new Date();
  const adminAreas = [
    '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시',
    '대전광역시', '울산광역시', '세종특별자치시', '경기도', '강원도',
    '충청북도', '충청남도', '전라북도', '전라남도', '경상북도', '경상남도', '제주특별자치도'
  ];
  
  const documents = [];
  
  for (let i = 1; i <= recordCount; i++) {
    const lat = 37.5665 + (Math.random() - 0.5) * 4;
    const lng = 126.9780 + (Math.random() - 0.5) * 4;
    
    documents.push({
      postal_code: i.toString().padStart(5, '0'),
      country_code: 'KOR',
      country_name: '대한민국',
      admin_area1: adminAreas[i % adminAreas.length],
      admin_area2: `구_${(i % 25) + 1}`,
      admin_area3: `동_${(i % 50) + 1}`,
      locality: `지역_${(i % 10) + 1}`,
      thoroughfare: `도로_${(i % 100) + 1}번길`,
      premise: `${i}번지`,
      latitude: lat,
      longitude: lng,
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // 1000개씩 배치로 삽입
    if (documents.length === 1000 || i === recordCount) {
      db.postal_codes.insertMany(documents);
      documents.length = 0;
    }
  }
  
  const endTime = new Date();
  const executionTime = endTime - startTime;
  
  // 성능 메트릭 기록
  db.performance_metrics.insertOne({
    db_type: 'mongodb',
    operation_type: 'BULK_INSERT',
    record_count: recordCount,
    execution_time_ms: executionTime,
    query_complexity: 'SIMPLE',
    test_timestamp: new Date(),
    notes: `MongoDB 테스트 데이터 ${recordCount}개 생성`
  });
  
  print(`MongoDB 테스트 데이터 ${recordCount}개 생성 완료 (${executionTime}ms)`);
}

// 샘플 데이터 생성 (100개)
generateTestData(100);

// 컬렉션 통계 출력
print('생성된 컬렉션:');
print('- postal_codes: ' + db.postal_codes.countDocuments());
print('- performance_metrics: ' + db.performance_metrics.countDocuments());
print('- audit_logs: ' + db.audit_logs.countDocuments());
print('- data_integrity_checks: ' + db.data_integrity_checks.countDocuments());

print('MongoDB 스키마 초기화 완료!');
