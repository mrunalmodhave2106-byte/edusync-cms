pipeline {
  agent any
  
  environment {
    APP_DIR        = '/home/ubuntu/edusync'
    BACKEND_DIR    = '/home/ubuntu/edusync/backend'
    FRONTEND_DIR   = '/var/www/html/edusync'
    PM2_APP        = 'edusync-backend'
    NODE_ENV       = 'production'
    HEALTH_CHECK_URL = 'http://localhost:4000/health'
    MAX_RETRIES    = '15'
    PORT           = '4000'
  }
  
  options {
    buildDiscarder(logRotator(numToKeepStr: '10'))
    timeout(time: 30, unit: 'MINUTES')
    timestamps()
    disableConcurrentBuilds()
  }
  
  tools {
    nodejs 'NodeJS-20'
  }
  
  stages {
    stage('Checkout SCM') {
      steps {
        echo "Checking out branch: ${env.GIT_BRANCH}"
        checkout scm
        sh 'git log --oneline -1'
      }
    }
    
    stage('Tool Install') {
      steps {
        sh 'node --version && npm --version && pm2 --version'
      }
    }
    
    stage('Checkout') {
      steps {
        dir('backend') {
          sh 'ls -la'
        }
      }
    }
    
    stage('Install Dependencies') {
      steps {
        dir('backend') {
          sh '''
            echo "Installing backend dependencies..."
            npm ci --omit=dev --verbose 2>&1 | tail -20
            echo "Dependencies installed successfully"
          '''
        }
      }
    }
    
    stage('Lint') {
      steps {
        dir('backend') {
          sh '''
            if [ -f package.json ] && grep -q '"eslint"' package.json; then
              echo "Running ESLint..."
              npm run lint || true
            else
              echo "ESLint not configured, skipping..."
            fi
          '''
        }
      }
    }
    
    stage('Test') {
      steps {
        dir('backend') {
          sh '''
            if [ -f package.json ] && grep -q '"jest"' package.json; then
              echo "Running Jest tests..."
              npm test || true
            else
              echo "Jest not configured, skipping..."
            fi
          '''
        }
      }
    }
    
    stage('Pre-Deploy Checks') {
      steps {
        sh '''
          set -e
          echo "========================================"
          echo "Pre-Deploy Checks"
          echo "========================================"
          
          echo "Checking Node.js..."
          node --version
          
          echo "Checking npm..."
          npm --version
          
          echo "Checking PM2..."
          pm2 --version
          
          echo "Creating deployment directories..."
          mkdir -p ${APP_DIR}
          mkdir -p ${FRONTEND_DIR}
          
          # Create backup directory with sudo if needed
          echo "Creating backup directory..."
          if [ ! -d /home/ubuntu/edusync-backup ]; then
            sudo mkdir -p /home/ubuntu/edusync-backup
            sudo chown jenkins:jenkins /home/ubuntu/edusync-backup
            sudo chmod 755 /home/ubuntu/edusync-backup
          fi
          
          echo "Checking directory permissions..."
          ls -ld ${APP_DIR}
          
          echo "All pre-deploy checks passed!"
        '''
      }
    }
    
    stage('Deploy Backend') {
      steps {
        sh '''
          set -e
          echo "========================================"
          echo "Deploying Backend Application"
          echo "========================================"
          
          # Kill any existing process on the port
          echo "Stopping any process on port ${PORT}..."
          if command -v lsof &> /dev/null; then
            lsof -i :${PORT} | grep -v COMMAND | awk '{print $2}' | xargs -r kill -9 || true
          fi
          
          # Kill PM2 process and wait
          echo "Stopping PM2 process..."
          pm2 stop ${PM2_APP} 2>/dev/null || true
          pm2 delete ${PM2_APP} 2>/dev/null || true
          sleep 2
          
          cd ${APP_DIR}
          
          # Configure git to trust this directory
          echo "Configuring git..."
          git config --global --add safe.directory ${APP_DIR} 2>/dev/null || true
          
          # Verify repository
          echo "Verifying repository..."
          if [ -d .git ]; then
            git fetch origin main --depth=1
          fi
          
          echo "Checking out latest code..."
          git reset --hard origin/main
          
          cd ${BACKEND_DIR}
          echo "Installing production dependencies..."
          npm ci --omit=dev --verbose 2>&1 | tail -20
          
          echo "Creating backup..."
          BACKUP_DIR="/home/ubuntu/edusync-backup/backend-$(date +%Y%m%d-%H%M%S)"
          mkdir -p "$BACKUP_DIR"
          cp -r . "$BACKUP_DIR/" 2>/dev/null || true
          
          # Wait to ensure port is free
          echo "Waiting for port to be released..."
          sleep 3
          
          echo "Starting PM2 process..."
          pm2 start app.js --name ${PM2_APP} --env production
          pm2 save
          pm2 list
          
          echo "Backend deployed successfully"
        '''
      }
    }
    
    stage('Deploy Frontend') {
      steps {
        sh '''
          set -e
          echo "========================================"
          echo "Deploying Frontend Files"
          echo "========================================"
          
          echo "Copying frontend files..."
          mkdir -p ${FRONTEND_DIR}
          
          if [ -d ${APP_DIR}/frontend ]; then
            cp -v ${APP_DIR}/frontend/*.html ${FRONTEND_DIR}/ || true
            cp -v ${APP_DIR}/frontend/*.css ${FRONTEND_DIR}/ || true
            cp -v ${APP_DIR}/frontend/*.js ${FRONTEND_DIR}/ || true
            echo "Frontend files copied"
          else
            echo "Frontend directory not found"
          fi
          
          # Verify Nginx config and reload
          if command -v nginx &> /dev/null; then
            echo "Testing Nginx configuration..."
            sudo nginx -t
            echo "Reloading Nginx..."
            sudo systemctl reload nginx
            echo "Nginx reloaded"
          fi
        '''
      }
    }
    
    stage('Health Check') {
      steps {
        sh '''
          set -e
          echo "========================================"
          echo "Health Check"
          echo "========================================"
          
          RETRY_COUNT=0
          MAX_RETRIES=${MAX_RETRIES}
          
          echo "Waiting for backend to be ready..."
          
          while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
            echo "Attempt $((RETRY_COUNT + 1))/${MAX_RETRIES}..."
            
            if curl -sf ${HEALTH_CHECK_URL} > /dev/null 2>&1; then
              echo "Backend is healthy!"
              exit 0
            fi
            
            RETRY_COUNT=$((RETRY_COUNT + 1))
            if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
              sleep 2
            fi
          done
          
          echo "Health check failed after ${MAX_RETRIES} attempts"
          pm2 logs ${PM2_APP} --lines 30
          exit 1
        '''
      }
    }
  }
  
  post {
    success {
      sh '''
        echo "Deployment Successful!"
        pm2 list
      '''
    }
    
    failure {
      sh '''
        echo "Pipeline Failed"
        pm2 list || true
      '''
    }
    
    always {
      sh '''
        echo "Build completed"
      '''
    }
  }
}
