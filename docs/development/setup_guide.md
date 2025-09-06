# 개발 환경 설정 가이드

## WSL2 Ubuntu 환경 설정

### 1. 필수 소프트웨어 설치

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Node.js 18.x 설치 (Node Version Manager 사용 권장)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
nvm alias default 18

# Docker 설치
sudo apt install apt-transport-https ca-certificates curl software-properties-common -y
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io -y
sudo usermod -aG docker $USER

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Git 설정
sudo apt install git -y
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 2. 프로젝트 초기 설정

```bash
# 프로젝트 클론
git clone <repository-url>
cd projectMDB

# 환경변수 파일 생성
cp .env.example .env

# 데이터베이스 컨테이너 시작
docker-compose up -d

# 백엔드 의존성 설치 및 실행
cd backend
npm install
npm run dev

# 새 터미널에서 프론트엔드 설정
cd frontend
npm install
npm start
```

## 개발 워크플로우

### 1. TDD 개발 방식
```bash
# 1. 테스트 폴더에서 기능 구현
cd test/unit
# 새 기능에 대한 테스트 작성
npm test

# 2. 테스트 통과 후 메인 코드로 이동
# 테스트된 코드를 backend/src 또는 frontend/src로 이동
```

### 2. Git 브랜치 전략
```bash
# 기능 브랜치 생성
git checkout -b feature/address-validation

# 개발 완료 후 커밋
git add .
git commit -m "feat: add address validation module"

# 메인 브랜치로 병합
git checkout main
git merge feature/address-validation
git branch -d feature/address-validation
```

## 환경변수 설정

### Backend (.env)
```
# 서버 설정
NODE_ENV=development
PORT=3001

# 데이터베이스 설정
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=mdb_user
MYSQL_PASSWORD=mdb_password
MYSQL_DATABASE=mdb_main

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=mdb_user
POSTGRES_PASSWORD=mdb_password
POSTGRES_DATABASE=mdb_analytics

MONGODB_URI=mongodb://admin:adminpassword@localhost:27017/mdb_logs?authSource=admin

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=mdb_password

ELASTICSEARCH_NODE=http://localhost:9200

# 보안 설정
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# 외부 API 설정
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENVIRONMENT=development
REACT_APP_VERSION=1.0.0
```

## 디버깅 설정

### VS Code 설정 (.vscode/launch.json)
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/src/index.ts",
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

## 테스트 실행

### 백엔드 테스트
```bash
cd backend
npm test                # 모든 테스트 실행
npm run test:watch      # 워치 모드
npm run test:coverage   # 커버리지 포함
```

### 프론트엔드 테스트
```bash
cd frontend
npm test                # Jest 테스트 실행
npm test -- --coverage # 커버리지 포함
```

## 코드 품질 도구

### ESLint 설정
```bash
# 백엔드
cd backend
npm run lint
npm run lint:fix

# 프론트엔드  
cd frontend
npm run lint
npm run lint:fix
```

### Prettier 설정 (.prettierrc)
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

## 성능 모니터링

### 개발 환경 모니터링
```bash
# 데이터베이스 성능 확인
docker stats

# 애플리케이션 메모리 사용량
node --max-old-space-size=4096 src/index.js

# 로그 확인
tail -f logs/application.log
```

## 문제 해결

### 일반적인 문제들

#### Docker 권한 문제
```bash
sudo usermod -aG docker $USER
newgrp docker
```

#### Node.js 메모리 부족
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
```

#### 포트 충돌
```bash
# 사용 중인 포트 확인
sudo netstat -tulpn | grep :3001
# 프로세스 종료
sudo kill -9 <PID>
```

#### WSL2 메모리 제한
```powershell
# Windows에서 %USERPROFILE%\.wslconfig 파일 생성
[wsl2]
memory=8GB
processors=4
```

## 개발 팁

### 1. 효율적인 개발을 위한 별칭 설정
```bash
# ~/.bashrc에 추가
alias mdb-start="docker-compose up -d && cd backend && npm run dev"
alias mdb-test="cd test && npm test"
alias mdb-logs="docker-compose logs -f"
```

### 2. 데이터베이스 스키마 변경 시
```bash
# 컨테이너 재시작
docker-compose down
docker-compose up -d
# 또는 특정 서비스만
docker-compose restart mysql
```

### 3. 개발 중 자주 사용하는 명령어
```bash
# 전체 로그 확인
docker-compose logs -f

# 특정 컨테이너 로그
docker-compose logs -f mysql

# 데이터베이스 접속
docker exec -it mdb-mysql mysql -u mdb_user -p
docker exec -it mdb-postgresql psql -U mdb_user -d mdb_analytics
docker exec -it mdb-mongodb mongosh
```
