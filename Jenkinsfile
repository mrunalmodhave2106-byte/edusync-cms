// =============================================
//  EduSync — Jenkinsfile
//  No Docker · No Terraform · SSH deploy to EC2
//  Trigger: GitHub webhook on push to main / feature/*
// =============================================

pipeline {

  agent any

  // ── Environment ──────────────────────────────────
  environment {
    APP_NAME    = 'edusync'
    NODE_ENV    = 'production'
    AWS_USER    = 'ubuntu'
    AWS_HOST    = credentials('ec2-host')          // stored in Jenkins credentials
    APP_DIR     = '/home/ubuntu/edusync'
    PM2_APP     = 'edusync-api'
    FRONTEND_DIR= '/var/www/html/edusync'
    SLACK_CHANNEL = '#deployments'
  }

  // ── Options ──────────────────────────────────────
  options {
    buildDiscarder(logRotator(numToKeepStr: '10'))
    timeout(time: 20, unit: 'MINUTES')
    timestamps()
    disableConcurrentBuilds()
  }

  // ── Tools ────────────────────────────────────────
  tools {
    nodejs 'NodeJS-20'   // configure in: Manage Jenkins → Tools → NodeJS
  }

  // ── Triggers ─────────────────────────────────────
  triggers {
    githubPush()   // fires on every push via GitHub webhook
  }

  // ══════════════════════════════════════════════════
  //  STAGES
  // ══════════════════════════════════════════════════
  stages {

    // ── 1. Checkout ────────────────────────────────
    stage('Checkout') {
      steps {
        echo "📥 Checking out branch: ${env.GIT_BRANCH}"
        checkout scm
        sh '''
          echo "Commit: $(git log --oneline -1)"
          node  --version
          npm   --version
        '''
      }
    }

    // ── 2. Install dependencies ───────────────────
    stage('Install Dependencies') {
      steps {
        echo '📦 Installing backend dependencies...'
        dir('backend') {
          sh 'npm ci'
        }
        echo '📦 Installing frontend dependencies (if any)...'
        // Frontend is plain HTML/CSS/JS — no build step needed
        // Only runs if a package.json exists
        script {
          if (fileExists('frontend/package.json')) {
            dir('frontend') { sh 'npm ci' }
          } else {
            echo 'Frontend has no package.json — skipping (plain HTML/CSS/JS)'
          }
        }
      }
    }

    // ── 3. Lint ────────────────────────────────────
    stage('Lint') {
      steps {
        echo '🔍 Running ESLint on backend...'
        dir('backend') {
          sh 'npm run lint || true'
          // "|| true" means lint warnings won't fail the build
          // Remove "|| true" to make lint errors block deployment
        }
      }
    }

    // ── 4. Unit Tests ──────────────────────────────
    stage('Unit Tests') {
      steps {
        echo '🧪 Running Jest test suite...'
        dir('backend') {
          sh 'npm run test:ci'
        }
      }
      post {
        always {
          // Publish JUnit test results in Jenkins UI
          junit allowEmptyResults: true,
                testResults: 'backend/coverage/junit.xml'

          // Publish HTML coverage report
          publishHTML([
            allowMissing:          false,
            alwaysLinkToLastBuild: true,
            keepAll:               true,
            reportDir:             'backend/coverage/lcov-report',
            reportFiles:           'index.html',
            reportName:            'Coverage Report'
          ])
        }
      }
    }

    // ── 5. Deploy Backend to EC2 ───────────────────
    stage('Deploy Backend') {
      when {
        anyOf {
          branch 'main'
          branch 'master'
        }
      }
      steps {
        echo '🚀 Deploying backend to AWS EC2 via SSH...'
        sshagent(credentials: ['aws-ec2-ssh-key']) {   // configure in Jenkins credentials
          sh """
            ssh -o StrictHostKeyChecking=no ${AWS_USER}@\${AWS_HOST} '
              set -e

              echo "==> Navigating to app directory..."
              cd ${APP_DIR}

              echo "==> Pulling latest code from GitHub..."
              git fetch origin main
              git reset --hard origin/main

              echo "==> Installing production dependencies..."
              cd backend
              npm ci --omit=dev

              echo "==> Copying .env (already exists on server)..."
              # .env is already on the EC2 server — never pulled from git

              echo "==> Restarting API with PM2..."
              pm2 restart ${PM2_APP} --update-env || pm2 start app.js --name ${PM2_APP} -- --env production
              pm2 save

              echo "==> Backend deployed successfully ✅"
            '
          """
        }
      }
    }

    // ── 6. Deploy Frontend to EC2 ──────────────────
    stage('Deploy Frontend') {
      when {
        anyOf {
          branch 'main'
          branch 'master'
        }
      }
      steps {
        echo '🌐 Deploying frontend (HTML/CSS/JS) to Nginx...'
        sshagent(credentials: ['aws-ec2-ssh-key']) {
          sh """
            # Copy frontend files to Nginx web root on EC2
            scp -o StrictHostKeyChecking=no -r \\
              frontend/login.html \\
              frontend/dashboard.html \\
              frontend/style.css \\
              frontend/app.js \\
              ${AWS_USER}@\${AWS_HOST}:${FRONTEND_DIR}/

            # Verify Nginx is running
            ssh -o StrictHostKeyChecking=no ${AWS_USER}@\${AWS_HOST} '
              sudo nginx -t && sudo systemctl reload nginx
              echo "==> Frontend deployed to Nginx ✅"
            '
          """
        }
      }
    }

    // ── 7. Health Check ────────────────────────────
    stage('Health Check') {
      when {
        anyOf {
          branch 'main'
          branch 'master'
        }
      }
      steps {
        echo '🏥 Running health checks...'
        script {
          // Wait for PM2 to restart fully
          sh 'sleep 10'

          // Check API health endpoint
          sshagent(credentials: ['aws-ec2-ssh-key']) {
            def apiStatus = sh(
              script: """
                ssh -o StrictHostKeyChecking=no ${AWS_USER}@\${AWS_HOST} \\
                  'curl -sf http://localhost:4000/health'
              """,
              returnStatus: true
            )

            if (apiStatus != 0) {
              error("❌ Health check FAILED — API not responding on port 4000")
            }

            echo '✅ API health check passed'

            // Check PM2 process is online
            sh """
              ssh -o StrictHostKeyChecking=no ${AWS_USER}@\${AWS_HOST} \\
                'pm2 show ${PM2_APP} | grep -q "online" && echo "PM2: online ✅" || echo "PM2: not online ⚠️"'
            """
          }
        }
      }
    }

  }

  // ══════════════════════════════════════════════════
  //  POST BUILD
  // ══════════════════════════════════════════════════
  post {

    success {
      echo '🎉 Pipeline completed successfully!'
      slackSend(
        channel: "${SLACK_CHANNEL}",
        color:   '#1A8A72',
        message: """✅ *EduSync Build #${env.BUILD_NUMBER} Deployed!*
Branch : `${env.GIT_BRANCH}`
Commit : `${env.GIT_COMMIT?.take(8)}`
Took   : ${currentBuild.durationString}
<${env.BUILD_URL}|View Jenkins build>"""
      )
    }

    failure {
      echo '❌ Pipeline failed!'
      slackSend(
        channel: "${SLACK_CHANNEL}",
        color:   '#C94C4C',
        message: """❌ *EduSync Build #${env.BUILD_NUMBER} FAILED*
Branch : `${env.GIT_BRANCH}`
Stage  : `${env.STAGE_NAME}`
<${env.BUILD_URL}|View Jenkins logs>"""
      )
    }

    unstable {
      slackSend(
        channel: "${SLACK_CHANNEL}",
        color:   '#E8C97A',
        message: "⚠️ *EduSync Build #${env.BUILD_NUMBER} unstable* (test failures) — <${env.BUILD_URL}|View>"
      )
    }

    always {
      echo 'Cleaning workspace...'
      cleanWs()
    }

  }
}
