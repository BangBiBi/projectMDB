-- PostgreSQL - 성능 비교용 우편번호 데이터베이스
-- 특징: 고급 인덱싱, 복잡한 쿼리 최적화, JSON 지원, 지리정보 처리

-- 확장 모듈 활성화
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 메인 우편번호 테이블 (MySQL과 동일한 데이터 구조)
CREATE TABLE postal_codes (
    id BIGSERIAL PRIMARY KEY,
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
    location GEOMETRY(POINT, 4326),  -- PostGIS 지리정보
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PostgreSQL 특화 인덱스들
CREATE INDEX idx_postal_codes_postal_code ON postal_codes (postal_code);
CREATE INDEX idx_postal_codes_country_postal ON postal_codes (country_code, postal_code);
CREATE INDEX idx_postal_codes_admin_areas ON postal_codes (country_code, admin_area1, admin_area2);
CREATE INDEX idx_postal_codes_created_at ON postal_codes (created_at);

-- GIN 인덱스 (전문 검색용)
CREATE INDEX idx_postal_codes_gin_text ON postal_codes 
USING GIN (to_tsvector('korean', admin_area1 || ' ' || admin_area2 || ' ' || admin_area3 || ' ' || locality || ' ' || thoroughfare));

-- GiST 인덱스 (지리정보용)
CREATE INDEX idx_postal_codes_location ON postal_codes USING GIST (location);

-- 부분 인덱스 (조건부 인덱스)
CREATE INDEX idx_postal_codes_seoul ON postal_codes (admin_area2) 
WHERE admin_area1 = '서울특별시';

-- 성능 측정용 메타데이터 테이블
CREATE TABLE performance_metrics (
    id SERIAL PRIMARY KEY,
    db_type VARCHAR(20) DEFAULT 'postgresql',
    operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN ('INSERT', 'SELECT', 'UPDATE', 'DELETE', 'BULK_INSERT')),
    record_count INTEGER NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    memory_usage_mb DECIMAL(10, 2),
    cpu_usage_percent DECIMAL(5, 2),
    query_complexity VARCHAR(10) CHECK (query_complexity IN ('SIMPLE', 'MEDIUM', 'COMPLEX')) DEFAULT 'SIMPLE',
    test_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    query_plan JSONB,  -- 쿼리 실행계획 저장
    notes TEXT
);

-- 지리정보 업데이트 트리거
CREATE OR REPLACE FUNCTION update_location()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_postal_codes_update_location
    BEFORE INSERT OR UPDATE ON postal_codes
    FOR EACH ROW EXECUTE FUNCTION update_location();

-- 테스트 데이터 생성 함수
CREATE OR REPLACE FUNCTION generate_test_data(record_count INTEGER)
RETURNS VOID AS $$
DECLARE
    i INTEGER := 1;
    start_time TIMESTAMP := NOW();
    admin_areas TEXT[] := ARRAY['서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시', 
                               '대전광역시', '울산광역시', '세종특별자치시', '경기도', '강원도', 
                               '충청북도', '충청남도', '전라북도', '전라남도', '경상북도', '경상남도', '제주특별자치도'];
BEGIN
    WHILE i <= record_count LOOP
        INSERT INTO postal_codes (
            postal_code, country_code, country_name, admin_area1, admin_area2, 
            admin_area3, locality, thoroughfare, premise, latitude, longitude
        ) VALUES (
            LPAD(i::TEXT, 5, '0'),
            'KOR',
            '대한민국',
            admin_areas[(i % 17) + 1],
            '구_' || ((i % 25) + 1)::TEXT,
            '동_' || ((i % 50) + 1)::TEXT,
            '지역_' || ((i % 10) + 1)::TEXT,
            '도로_' || ((i % 100) + 1)::TEXT || '번길',
            '건물_' || ((i % 20) + 1)::TEXT,
            33 + (RANDOM() * 5),  -- 위도
            124 + (RANDOM() * 7)  -- 경도
        );
        i := i + 1;
    END LOOP;
    
    -- 성능 메트릭 기록
    INSERT INTO performance_metrics (operation_type, record_count, execution_time_ms)
    VALUES ('BULK_INSERT', record_count, EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000);
END;
$$ LANGUAGE plpgsql;
