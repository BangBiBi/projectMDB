-- SQLite - 성능 비교용 우편번호 데이터베이스
-- 특징: 경량형, 파일기반, 간단한 설정, ACID 트랜잭션

-- 메인 우편번호 테이블
CREATE TABLE IF NOT EXISTS postal_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    postal_code TEXT NOT NULL,
    country_code TEXT NOT NULL,
    country_name TEXT NOT NULL,
    admin_area1 TEXT,
    admin_area2 TEXT,
    admin_area3 TEXT,
    locality TEXT,
    thoroughfare TEXT,
    premise TEXT,
    latitude REAL,
    longitude REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 성능 측정용 메타데이터 테이블
CREATE TABLE IF NOT EXISTS performance_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    db_type TEXT DEFAULT 'sqlite',
    operation_type TEXT NOT NULL CHECK (operation_type IN ('INSERT', 'SELECT', 'UPDATE', 'DELETE', 'BULK_INSERT')),
    record_count INTEGER NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    memory_usage_mb REAL,
    cpu_usage_percent REAL,
    query_complexity TEXT CHECK (query_complexity IN ('SIMPLE', 'MEDIUM', 'COMPLEX')) DEFAULT 'SIMPLE',
    test_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- 감사 로그 테이블 (변경사항 추적)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    db_type TEXT DEFAULT 'sqlite',
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values TEXT, -- JSON 형태로 저장
    new_values TEXT, -- JSON 형태로 저장
    changed_fields TEXT, -- JSON 배열 형태로 저장
    change_source TEXT,
    user_id TEXT,
    session_id TEXT,
    ip_address TEXT,
    transaction_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 데이터 무결성 검사 테이블
CREATE TABLE IF NOT EXISTS data_integrity_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    check_type TEXT NOT NULL,
    source_db TEXT DEFAULT 'sqlite',
    target_db TEXT,
    table_name TEXT NOT NULL,
    record_id TEXT,
    check_query TEXT,
    issue_found INTEGER DEFAULT 0 CHECK (issue_found IN (0, 1)),
    issue_description TEXT,
    data_before TEXT, -- JSON 형태로 저장
    data_after TEXT, -- JSON 형태로 저장
    severity_level TEXT CHECK (severity_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'LOW',
    status TEXT CHECK (status IN ('PENDING', 'RESOLVED', 'IGNORED')) DEFAULT 'PENDING',
    checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    notes TEXT
);

-- 인덱스 생성
-- postal_codes 인덱스
CREATE INDEX IF NOT EXISTS idx_postal_codes_postal_code ON postal_codes (postal_code);
CREATE INDEX IF NOT EXISTS idx_postal_codes_country_postal ON postal_codes (country_code, postal_code);
CREATE INDEX IF NOT EXISTS idx_postal_codes_admin_areas ON postal_codes (country_code, admin_area1, admin_area2);
CREATE INDEX IF NOT EXISTS idx_postal_codes_location ON postal_codes (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_postal_codes_created_at ON postal_codes (created_at);

-- performance_metrics 인덱스
CREATE INDEX IF NOT EXISTS idx_perf_metrics_db_type ON performance_metrics (db_type);
CREATE INDEX IF NOT EXISTS idx_perf_metrics_operation ON performance_metrics (operation_type);
CREATE INDEX IF NOT EXISTS idx_perf_metrics_timestamp ON performance_metrics (test_timestamp);
CREATE INDEX IF NOT EXISTS idx_perf_metrics_complexity ON performance_metrics (query_complexity);

-- audit_logs 인덱스
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs (table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs (record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON audit_logs (operation_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);

-- data_integrity_checks 인덱스
CREATE INDEX IF NOT EXISTS idx_integrity_checks_type ON data_integrity_checks (check_type, status);
CREATE INDEX IF NOT EXISTS idx_integrity_checks_table ON data_integrity_checks (source_db, target_db, table_name);
CREATE INDEX IF NOT EXISTS idx_integrity_checks_checked_at ON data_integrity_checks (checked_at);
CREATE INDEX IF NOT EXISTS idx_integrity_checks_severity ON data_integrity_checks (severity_level);

-- 업데이트 트리거
CREATE TRIGGER IF NOT EXISTS tr_postal_codes_update
    AFTER UPDATE ON postal_codes
    FOR EACH ROW
BEGIN
    UPDATE postal_codes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 테스트 데이터 생성
INSERT OR IGNORE INTO postal_codes (postal_code, country_code, country_name, admin_area1, admin_area2, admin_area3, locality, thoroughfare, premise, latitude, longitude)
WITH RECURSIVE test_data(i) AS (
    SELECT 1
    UNION ALL
    SELECT i + 1 FROM test_data WHERE i < 100
)
SELECT 
    printf('%05d', i),
    'KOR',
    '대한민국',
    CASE (i % 17)
        WHEN 0 THEN '서울특별시'
        WHEN 1 THEN '부산광역시'
        WHEN 2 THEN '대구광역시'
        WHEN 3 THEN '인천광역시'
        WHEN 4 THEN '광주광역시'
        WHEN 5 THEN '대전광역시'
        WHEN 6 THEN '울산광역시'
        WHEN 7 THEN '세종특별자치시'
        WHEN 8 THEN '경기도'
        WHEN 9 THEN '강원도'
        WHEN 10 THEN '충청북도'
        WHEN 11 THEN '충청남도'
        WHEN 12 THEN '전라북도'
        WHEN 13 THEN '전라남도'
        WHEN 14 THEN '경상북도'
        WHEN 15 THEN '경상남도'
        ELSE '제주특별자치도'
    END,
    '구_' || ((i % 25) + 1),
    '동_' || ((i % 50) + 1),
    '지역_' || ((i % 10) + 1),
    '도로_' || ((i % 100) + 1) || '번길',
    i || '번지',
    37.5665 + ((ABS(RANDOM()) % 4000) / 1000.0 - 2),
    126.9780 + ((ABS(RANDOM()) % 4000) / 1000.0 - 2)
FROM test_data;

-- 성능 메트릭 기록
INSERT INTO performance_metrics (operation_type, record_count, execution_time_ms, query_complexity, notes)
VALUES ('BULK_INSERT', 100, 0, 'SIMPLE', 'SQLite 테스트 데이터 100개 생성');

-- 통계 정보 출력
SELECT 'SQLite 스키마 초기화 완료!' AS message;
SELECT 'postal_codes 테이블: ' || COUNT(*) || ' 레코드' FROM postal_codes;
SELECT 'performance_metrics 테이블: ' || COUNT(*) || ' 레코드' FROM performance_metrics;
SELECT 'audit_logs 테이블: ' || COUNT(*) || ' 레코드' FROM audit_logs;
SELECT 'data_integrity_checks 테이블: ' || COUNT(*) || ' 레코드' FROM data_integrity_checks;
