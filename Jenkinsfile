pipeline {
  agent any

  environment {
    APP_DIR     = '/home/ubuntu/edusync'
    PM2_APP     = 'edusync-api'
    FRONTEND_DIR= '/var/www/html/edusync'
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

  triggers {
    githubPush()
  }

  stages {

    stage('Checkout') {
      steps {
        echo "Checking out branch: ${env.GIT_BRANCH}"
        checkout scm
        sh 'git log --oneline -1'
      }
    }

    stage('Install Dependencies') {
      steps {
        dir('backend') {
          sh 'npm ci'
        }
      }
    }

    stage('Lint') {
      steps {
        dir('backend') {
          sh 'npm run lint || true'
        }
      }
    }

    stage('Test') {
      steps {
        dir('backend') {
          sh 'npm test || true'
        }
      }
    }

    stage('Deploy Backend') {
      steps {
        sh """
          cd ${APP_DIR}
          git fetch origin main
          git reset --hard origin/main
          cd backend
          npm install --omit=dev --verbose
          pm2 restart ${PM2_APP} --update-env || pm2 start app.js --name ${PM2_APP}
          pm2 save
        """
      }
    }

    stage('Deploy Frontend') {
      steps {
        sh """
          sudo cp ${APP_DIR}/frontend/login.html     ${FRONTEND_DIR}/
          sudo cp ${APP_DIR}/frontend/dashboard.html ${FRONTEND_DIR}/
          sudo cp ${APP_DIR}/frontend/style.css      ${FRONTEND_DIR}/
          sudo cp ${APP_DIR}/frontend/app.js         ${FRONTEND_DIR}/
          sudo nginx -t && sudo systemctl reload nginx
        """
      }
    }

    stage('Health Check') {
      steps {
        sh 'sleep 5'
        sh 'curl -sf http://localhost:4000/health && echo "API OK"'
      }
    }
  }

  post {
    success { echo 'Deployment successful!' }
    failure { echo 'Pipeline failed!' }
    always  { cleanWs() }
  }
}
