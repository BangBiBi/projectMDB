-- SQLite - 성능 비교용 우편번호 데이터베이스
-- 특징: 파일 기반, 경량화, 개발 편의성 최고, 임베디드 최적화

-- SQLite 설정 최적화
PRAGMA journal_mode = WAL;          -- Write-Ahead Logging 모드
PRAGMA synchronous = NORMAL;        -- 동기화 모드 최적화
PRAGMA cache_size = 10000;          -- 캐시 크기 증가 (10MB)
PRAGMA temp_store = MEMORY;         -- 임시 데이터를 메모리에 저장
PRAGMA mmap_size = 268435456;       -- 메모리 맵 크기 (256MB)

-- 메인 우편번호 테이블 (다른 DB와 동일한 구조)
CREATE TABLE postal_codes (
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
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 인덱스 생성 (SQLite 최적화)
CREATE INDEX idx_postal_codes_postal_code ON postal_codes(postal_code);
CREATE INDEX idx_postal_codes_country_postal ON postal_codes(country_code, postal_code);
CREATE INDEX idx_postal_codes_admin_areas ON postal_codes(country_code, admin_area1, admin_area2);
CREATE INDEX idx_postal_codes_created_at ON postal_codes(created_at);
CREATE INDEX idx_postal_codes_location ON postal_codes(latitude, longitude);

-- 부분 인덱스 (SQLite 3.8.0+ 지원)
CREATE INDEX idx_postal_codes_seoul 
ON postal_codes(admin_area2) 
WHERE admin_area1 = '서울특별시';

-- 전문 검색 인덱스 (FTS5)
CREATE VIRTUAL TABLE postal_codes_fts USING fts5(
    postal_code,
    admin_area1,
    admin_area2,
    admin_area3,
    locality,
    thoroughfare,
    content='postal_codes',
    content_rowid='id'
);

-- FTS 인덱스 초기 구축 트리거
CREATE TRIGGER postal_codes_fts_insert AFTER INSERT ON postal_codes BEGIN
    INSERT INTO postal_codes_fts(rowid, postal_code, admin_area1, admin_area2, admin_area3, locality, thoroughfare)
    VALUES (new.id, new.postal_code, new.admin_area1, new.admin_area2, new.admin_area3, new.locality, new.thoroughfare);
END;

CREATE TRIGGER postal_codes_fts_update AFTER UPDATE ON postal_codes BEGIN
    UPDATE postal_codes_fts SET 
        postal_code = new.postal_code,
        admin_area1 = new.admin_area1,
        admin_area2 = new.admin_area2,
        admin_area3 = new.admin_area3,
        locality = new.locality,
        thoroughfare = new.thoroughfare
    WHERE rowid = old.id;
END;

CREATE TRIGGER postal_codes_fts_delete AFTER DELETE ON postal_codes BEGIN
    DELETE FROM postal_codes_fts WHERE rowid = old.id;
END;

-- updated_at 자동 갱신 트리거
CREATE TRIGGER postal_codes_updated_at 
AFTER UPDATE ON postal_codes FOR EACH ROW
BEGIN
    UPDATE postal_codes SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- 성능 측정용 메타데이터 테이블
CREATE TABLE performance_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    db_type TEXT DEFAULT 'sqlite',
    operation_type TEXT NOT NULL CHECK (operation_type IN ('INSERT', 'SELECT', 'UPDATE', 'DELETE', 'BULK_INSERT')),
    record_count INTEGER NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    memory_usage_mb REAL,
    cpu_usage_percent REAL,
    query_complexity TEXT CHECK (query_complexity IN ('SIMPLE', 'MEDIUM', 'COMPLEX')) DEFAULT 'SIMPLE',
    test_timestamp TEXT DEFAULT (datetime('now')),
    sqlite_version TEXT DEFAULT (sqlite_version()),
    notes TEXT
);

-- 뷰 생성 (복잡한 쿼리 단순화)
CREATE VIEW postal_codes_summary AS
SELECT 
    country_code,
    admin_area1,
    COUNT(*) as total_count,
    AVG(latitude) as avg_latitude,
    AVG(longitude) as avg_longitude,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created
FROM postal_codes
GROUP BY country_code, admin_area1;

-- 지역별 통계 뷰
CREATE VIEW postal_codes_stats AS
SELECT 
    admin_area1,
    admin_area2,
    COUNT(*) as count,
    MIN(postal_code) as min_postal_code,
    MAX(postal_code) as max_postal_code,
    AVG(CASE WHEN latitude IS NOT NULL THEN latitude END) as avg_latitude,
    AVG(CASE WHEN longitude IS NOT NULL THEN longitude END) as avg_longitude
FROM postal_codes
GROUP BY admin_area1, admin_area2
HAVING count > 0
ORDER BY count DESC;

-- 테스트 데이터 생성을 위한 임시 테이블
CREATE TEMPORARY TABLE admin_areas (
    id INTEGER PRIMARY KEY,
    name TEXT
);

INSERT INTO admin_areas (name) VALUES 
('서울특별시'), ('부산광역시'), ('대구광역시'), ('인천광역시'),
('광주광역시'), ('대전광역시'), ('울산광역시'), ('세종특별자치시'),
('경기도'), ('강원도'), ('충청북도'), ('충청남도'),
('전라북도'), ('전라남도'), ('경상북도'), ('경상남도'), ('제주특별자치도');

-- SQLite에서 대용량 삽입을 위한 최적화 설정
PRAGMA synchronous = OFF;           -- 임시로 동기화 비활성화
PRAGMA journal_mode = MEMORY;       -- 저널을 메모리에 저장

-- 아래는 애플리케이션에서 사용할 쿼리 템플릿들 (주석)

-- /* 테스트 데이터 생성 (애플리케이션에서 실행)
-- WITH RECURSIVE generate_data(x) AS (
--   SELECT 1
--   UNION ALL
--   SELECT x+1 FROM generate_data WHERE x < 100000
-- )
-- INSERT INTO postal_codes (
--     postal_code, country_code, country_name, admin_area1, admin_area2, 
--     admin_area3, locality, thoroughfare, premise, latitude, longitude
-- )
-- SELECT 
--     printf('%05d', x) as postal_code,
--     'KOR' as country_code,
--     '대한민국' as country_name,
--     (SELECT name FROM admin_areas WHERE id = ((x-1) % 17) + 1) as admin_area1,
--     '구_' || (((x-1) % 25) + 1) as admin_area2,
--     '동_' || (((x-1) % 50) + 1) as admin_area3,
--     '지역_' || (((x-1) % 10) + 1) as locality,
--     '도로_' || (((x-1) % 100) + 1) || '번길' as thoroughfare,
--     '건물_' || (((x-1) % 20) + 1) as premise,
--     33.0 + (RANDOM() % 5000) / 1000.0 as latitude,
--     124.0 + (RANDOM() % 7000) / 1000.0 as longitude
-- FROM generate_data;
-- */

-- 데이터베이스 최적화 복원
PRAGMA synchronous = NORMAL;
PRAGMA journal_mode = WAL;

-- ANALYZE 명령으로 통계 정보 수집
ANALYZE;

-- 사용자에게 정보 제공
SELECT 'SQLite 데이터베이스 초기화 완료' as status;
SELECT 'SQLite 버전: ' || sqlite_version() as version;
SELECT 'WAL 모드 활성화됨' as journal_mode;
SELECT '인덱스 및 FTS5 전문검색 준비됨' as features;
