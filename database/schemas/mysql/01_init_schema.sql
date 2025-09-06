-- MySQL - 성능 비교용 우편번호 데이터베이스
-- 특징: 전통적인 OLTP 최적화, B-tree 인덱스, 빠른 단순 쿼리

CREATE DATABASE IF NOT EXISTS postal_codes_db;
USE postal_codes_db;

-- 메인 우편번호 테이블 (모든 DB에서 동일한 구조)
CREATE TABLE postal_codes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    postal_code VARCHAR(20) NOT NULL,
    country_code VARCHAR(3) NOT NULL,
    country_name VARCHAR(100) NOT NULL,
    admin_area1 VARCHAR(100),  -- 시/도
    admin_area2 VARCHAR(100),  -- 구/군
    admin_area3 VARCHAR(100),  -- 동/읍/면
    locality VARCHAR(100),     -- 상세 지역
    thoroughfare VARCHAR(200), -- 도로명
    premise VARCHAR(100),      -- 건물명/번지
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 성능 테스트용 인덱스
    INDEX idx_postal_code (postal_code),
    INDEX idx_country_postal (country_code, postal_code),
    INDEX idx_location (latitude, longitude),
    INDEX idx_admin_areas (country_code, admin_area1, admin_area2),
    INDEX idx_created_at (created_at),
    FULLTEXT INDEX idx_fulltext_address (admin_area1, admin_area2, admin_area3, locality, thoroughfare)
);

-- 성능 측정용 메타데이터 테이블
CREATE TABLE performance_metrics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    db_type VARCHAR(20) DEFAULT 'mysql',
    operation_type ENUM('INSERT', 'SELECT', 'UPDATE', 'DELETE', 'BULK_INSERT') NOT NULL,
    record_count INT NOT NULL,
    execution_time_ms INT NOT NULL,
    memory_usage_mb DECIMAL(10, 2),
    cpu_usage_percent DECIMAL(5, 2),
    query_complexity ENUM('SIMPLE', 'MEDIUM', 'COMPLEX') DEFAULT 'SIMPLE',
    test_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- 테스트 데이터 생성용 프로시저
DELIMITER $$
CREATE PROCEDURE GenerateTestData(IN record_count INT)
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE start_time TIMESTAMP DEFAULT NOW();
    
    WHILE i <= record_count DO
        INSERT INTO postal_codes (
            postal_code, country_code, country_name, admin_area1, admin_area2, 
            admin_area3, locality, thoroughfare, premise, latitude, longitude
        ) VALUES (
            LPAD(i, 5, '0'),
            'KOR',
            '대한민국',
            CASE (i % 17) 
                WHEN 0 THEN '서울특별시' WHEN 1 THEN '부산광역시' WHEN 2 THEN '대구광역시'
                WHEN 3 THEN '인천광역시' WHEN 4 THEN '광주광역시' WHEN 5 THEN '대전광역시'
                WHEN 6 THEN '울산광역시' WHEN 7 THEN '세종특별자치시' WHEN 8 THEN '경기도'
                WHEN 9 THEN '강원도' WHEN 10 THEN '충청북도' WHEN 11 THEN '충청남도'
                WHEN 12 THEN '전라북도' WHEN 13 THEN '전라남도' WHEN 14 THEN '경상북도'
                WHEN 15 THEN '경상남도' ELSE '제주특별자치도'
            END,
            CONCAT('구_', (i % 25) + 1),
            CONCAT('동_', (i % 50) + 1),
            CONCAT('지역_', (i % 10) + 1),
            CONCAT('도로_', (i % 100) + 1, '번길'),
            CONCAT('건물_', (i % 20) + 1),
            ROUND(33 + (RAND() * 5), 6),  -- 위도 (33~38)
            ROUND(124 + (RAND() * 7), 6)  -- 경도 (124~131)
        );
        SET i = i + 1;
    END WHILE;
    
    -- 성능 메트릭 기록
    INSERT INTO performance_metrics (operation_type, record_count, execution_time_ms)
    VALUES ('BULK_INSERT', record_count, TIMESTAMPDIFF(MICROSECOND, start_time, NOW()) / 1000);
END$$
DELIMITER ;
