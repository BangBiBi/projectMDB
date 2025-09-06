// MongoDB - 성능 비교용 우편번호 데이터베이스
// 특징: 스키마리스, 수평적 확장성, 빠른 삽입, 유연한 쿼리

// 메인 우편번호 컬렉션 생성 (MySQL/PostgreSQL과 동일한 데이터)
db.createCollection("postal_codes", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["postal_code", "country_code", "country_name"],
            properties: {
                postal_code: { bsonType: "string", maxLength: 20 },
                country_code: { bsonType: "string", maxLength: 3 },
                country_name: { bsonType: "string", maxLength: 100 },
                admin_area1: { bsonType: "string", maxLength: 100 },
                admin_area2: { bsonType: "string", maxLength: 100 },
                admin_area3: { bsonType: "string", maxLength: 100 },
                locality: { bsonType: "string", maxLength: 100 },
                thoroughfare: { bsonType: "string", maxLength: 200 },
                premise: { bsonType: "string", maxLength: 100 },
                latitude: { bsonType: "double", minimum: -90, maximum: 90 },
                longitude: { bsonType: "double", minimum: -180, maximum: 180 },
                location: {
                    bsonType: "object",
                    required: ["type", "coordinates"],
                    properties: {
                        type: { enum: ["Point"] },
                        coordinates: {
                            bsonType: "array",
                            minItems: 2,
                            maxItems: 2,
                            items: { bsonType: "double" }
                        }
                    }
                },
                created_at: { bsonType: "date" },
                updated_at: { bsonType: "date" }
            }
        }
    }
});

// 성능 메트릭 컬렉션
db.createCollection("performance_metrics", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["db_type", "operation_type", "record_count", "execution_time_ms", "test_timestamp"],
            properties: {
                db_type: { bsonType: "string", enum: ["mongodb"] },
                operation_type: { 
                    bsonType: "string", 
                    enum: ["INSERT", "SELECT", "UPDATE", "DELETE", "BULK_INSERT", "AGGREGATE"] 
                },
                record_count: { bsonType: "int", minimum: 0 },
                execution_time_ms: { bsonType: "int", minimum: 0 },
                memory_usage_mb: { bsonType: "double", minimum: 0 },
                cpu_usage_percent: { bsonType: "double", minimum: 0, maximum: 100 },
                query_complexity: { 
                    bsonType: "string", 
                    enum: ["SIMPLE", "MEDIUM", "COMPLEX"] 
                },
                test_timestamp: { bsonType: "date" },
                query_details: { bsonType: "object" },
                notes: { bsonType: "string" }
            }
        }
    }
});

// 인덱스 생성 (성능 비교용)
// 1. 단일 필드 인덱스
db.postal_codes.createIndex({ "postal_code": 1 });
db.postal_codes.createIndex({ "country_code": 1 });
db.postal_codes.createIndex({ "created_at": -1 });

// 2. 복합 인덱스
db.postal_codes.createIndex({ "country_code": 1, "postal_code": 1 });
db.postal_codes.createIndex({ "country_code": 1, "admin_area1": 1, "admin_area2": 1 });

// 3. 텍스트 검색 인덱스
db.postal_codes.createIndex({ 
    "admin_area1": "text", 
    "admin_area2": "text", 
    "admin_area3": "text", 
    "locality": "text", 
    "thoroughfare": "text" 
});

// 4. 지리정보 인덱스 (2dsphere)
db.postal_codes.createIndex({ "location": "2dsphere" });

// 5. 부분 인덱스 (조건부)
db.postal_codes.createIndex(
    { "admin_area2": 1 },
    { partialFilterExpression: { "admin_area1": "서울특별시" } }
);

// 6. 희소 인덱스
db.postal_codes.createIndex({ "premise": 1 }, { sparse: true });

// 성능 메트릭 인덱스
db.performance_metrics.createIndex({ "test_timestamp": -1 });
db.performance_metrics.createIndex({ "db_type": 1, "operation_type": 1 });

// TTL 인덱스 (성능 테스트 로그는 30일 후 삭제)
db.performance_metrics.createIndex({ "test_timestamp": 1 }, { expireAfterSeconds: 2592000 });

// 테스트 데이터 생성 함수
function generateTestData(recordCount) {
    const startTime = new Date();
    const adminAreas = [
        '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시',
        '대전광역시', '울산광역시', '세종특별자치시', '경기도', '강원도',
        '충청북도', '충청남도', '전라북도', '전라남도', '경상북도', '경상남도', '제주특별자치도'
    ];
    
    const docs = [];
    for (let i = 1; i <= recordCount; i++) {
        const latitude = 33 + (Math.random() * 5);
        const longitude = 124 + (Math.random() * 7);
        
        docs.push({
            postal_code: i.toString().padStart(5, '0'),
            country_code: 'KOR',
            country_name: '대한민국',
            admin_area1: adminAreas[i % 17],
            admin_area2: `구_${(i % 25) + 1}`,
            admin_area3: `동_${(i % 50) + 1}`,
            locality: `지역_${(i % 10) + 1}`,
            thoroughfare: `도로_${(i % 100) + 1}번길`,
            premise: `건물_${(i % 20) + 1}`,
            latitude: latitude,
            longitude: longitude,
            location: {
                type: "Point",
                coordinates: [longitude, latitude]
            },
            created_at: new Date(),
            updated_at: new Date()
        });
        
        // 배치 삽입 (1000개씩)
        if (docs.length === 1000 || i === recordCount) {
            db.postal_codes.insertMany(docs);
            docs.length = 0; // 배열 비우기
        }
    }
    
    const endTime = new Date();
    const executionTime = endTime - startTime;
    
    // 성능 메트릭 기록
    db.performance_metrics.insertOne({
        db_type: 'mongodb',
        operation_type: 'BULK_INSERT',
        record_count: NumberInt(recordCount),
        execution_time_ms: NumberInt(executionTime),
        query_complexity: 'SIMPLE',
        test_timestamp: new Date(),
        notes: '테스트 데이터 생성'
    });
    
    print(`MongoDB: ${recordCount}개 레코드 삽입 완료 (${executionTime}ms)`);
}

// 샤딩 설정을 위한 준비 (선택사항)
// sh.enableSharding("postal_codes_db");
// sh.shardCollection("postal_codes_db.postal_codes", { "country_code": 1, "postal_code": 1 });

print("MongoDB 스키마 초기화 완료");
print("사용법: generateTestData(100000); // 10만개 테스트 데이터 생성");
