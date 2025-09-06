# 테스트 가이드

## 테스트 철학

이 프로젝트는 **테스트 주도 개발(TDD)** 방식을 채택합니다. 모든 기능은 `test/` 폴더에서 먼저 구현하고 테스트한 후, 성공한 기능만 메인 코드로 이동하는 방식으로 진행합니다.

## 테스트 구조

```
test/
├── unit/                    # 단위 테스트
│   ├── backend/            # 백엔드 단위 테스트
│   │   ├── database/       # 데이터베이스 연결 테스트
│   │   ├── services/       # 비즈니스 로직 테스트  
│   │   └── utils/          # 유틸리티 함수 테스트
│   └── frontend/           # 프론트엔드 단위 테스트
│       ├── components/     # 컴포넌트 테스트
│       ├── hooks/          # 커스텀 훅 테스트
│       └── utils/          # 유틸리티 테스트
├── integration/            # 통합 테스트
│   ├── api/                # API 통합 테스트
│   ├── database/           # DB 간 연동 테스트
│   └── e2e/                # 전체 워크플로우 테스트
└── performance/            # 성능 테스트
    ├── load/               # 부하 테스트
    ├── stress/             # 스트레스 테스트
    └── benchmark/          # 벤치마크 테스트
```

## 테스트 실행 방법

### 1. 단위 테스트 실행
```bash
cd test
npm test unit
```

### 2. 통합 테스트 실행  
```bash
cd test
npm test integration
```

### 3. 성능 테스트 실행
```bash
cd test  
npm test performance
```

### 4. 전체 테스트 실행
```bash
cd test
npm test
```

## 테스트 작성 규칙

### 1. 파일 명명 규칙
- 단위 테스트: `[기능명].test.js` 또는 `[기능명].spec.js`
- 통합 테스트: `[기능명].integration.test.js`
- 성능 테스트: `[기능명].performance.test.js`

### 2. 테스트 케이스 구조
```javascript
describe('기능명', () => {
  beforeEach(() => {
    // 각 테스트 전 실행할 설정
  });

  afterEach(() => {
    // 각 테스트 후 정리 작업
  });

  it('should [예상 동작]', async () => {
    // Arrange: 테스트 데이터 준비
    
    // Act: 테스트 대상 실행
    
    // Assert: 결과 검증
  });
});
```

### 3. 모킹 가이드라인
- 외부 의존성(API, 데이터베이스)은 모킹 사용
- 비즈니스 로직은 실제 구현 테스트
- 테스트 격리를 위한 적절한 모킹 수준 유지

## TDD 워크플로우

### 1. Red 단계 (실패하는 테스트 작성)
```bash
cd test/unit/backend/services
# address-validator.test.js 작성
npm test address-validator.test.js  # 실패 확인
```

### 2. Green 단계 (테스트 통과하는 최소 코드)
```bash
# test/unit/backend/services/address-validator.js에 구현
npm test address-validator.test.js  # 성공 확인
```

### 3. Refactor 단계 (코드 개선)
```bash
# 코드 품질 향상 후 테스트 재실행
npm test address-validator.test.js  # 여전히 성공 확인
```

### 4. 메인 코드로 이동
```bash
# 테스트된 코드를 backend/src/services/로 이동
cp test/unit/backend/services/address-validator.js backend/src/services/
```

## 테스트 환경 설정

### Jest 설정 (jest.config.js)
```javascript
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/unit', '<rootDir>/integration'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/setup.js']
};
```

## 테스트 데이터 관리

### 1. 픽스처 데이터
```javascript
// fixtures/address-data.js
module.exports = {
  validKoreanAddress: {
    postalCode: '06292',
    country: 'KOR',
    city: '서울특별시',
    district: '강남구',
    street: '테헤란로 123'
  },
  invalidAddress: {
    postalCode: 'INVALID',
    country: 'KOR'
  }
};
```

### 2. 테스트 데이터베이스
```javascript
// helpers/test-db.js
const { createConnection } = require('../../backend/src/database');

async function setupTestDatabase() {
  const connection = await createConnection('test');
  await connection.sync({ force: true });
  return connection;
}

async function seedTestData(connection) {
  // 테스트 데이터 삽입
}

module.exports = { setupTestDatabase, seedTestData };
```

## 코드 커버리지 목표

- **단위 테스트**: 90% 이상
- **통합 테스트**: 80% 이상  
- **전체 커버리지**: 85% 이상

## CI/CD 통합

### GitHub Actions 워크플로우
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd test && npm install
      - name: Run tests
        run: cd test && npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## 성능 테스트 기준

### 1. 응답 시간 기준
- API 응답: < 200ms (95th percentile)
- 데이터베이스 쿼리: < 100ms
- 페이지 로딩: < 2초

### 2. 처리량 기준  
- 동시 사용자: 1,000명
- 초당 요청: 500 RPS
- 데이터베이스 동기화: 10,000 레코드/분

### 3. 안정성 기준
- 업타임: 99.9%
- 에러율: < 0.1%
- 메모리 누수: 없음

## 베스트 프랙티스

### 1. 테스트 작성 시
- 하나의 테스트는 하나의 기능만 검증
- 테스트 이름은 명확하고 설명적으로
- Given-When-Then 패턴 사용
- 테스트 간 의존성 배제

### 2. 모킹 사용 시
- 필요한 부분만 모킹
- 실제 동작과 유사하게 모킹
- 모킹 데이터의 현실성 유지

### 3. 데이터베이스 테스트 시
- 각 테스트마다 데이터 초기화
- 트랜잭션 롤백 활용
- 테스트 전용 데이터베이스 사용

이 테스트 가이드를 따라 안정적이고 품질 높은 코드를 개발해나가겠습니다.
