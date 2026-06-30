pipeline {
    agent any

    environment {
        DOCKER_CREDENTIALS_ID = 'sofiahzm-dockerhub-password'
        SONAR_PROJECT_KEY = 'sofia-cicd-tasklist-backend'
        IMAGE_TAG = "${DOCKER_USERNAME}/cicd-tasklist-backend:${BUILD_NUMBER}"
        IMAGE_LATEST = "${DOCKER_USERNAME}/cicd-tasklist-backend:latest"
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    triggers {
        pollSCM('H/2 * * * *')
    }

    stages {
        stage('Install dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Generate Prisma client') {
            steps {
                sh 'npm run prisma:generate'
            }
        }

        stage('Run tests') {
            steps {
                sh 'npm run test:all:coverage'
            }
            post {
                always {
                    junit 'reports/junit.xml'
                }
            }
        }

        stage('SonarQube analysis') {
            steps {
                withCredentials([
                    string(credentialsId: 'sofiahzm-sonar-token-backend', variable: 'SONAR_TOKEN'),
                    string(credentialsId: 'sofiahzm-sonar-host-url', variable: 'SONAR_HOST_URL')
                ]) {
                    sh '''
                        sonar-scanner \
                          -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                          -Dsonar.sources=src \
                          -Dsonar.tests=src/__tests__ \
                          -Dsonar.test.inclusions=src/__tests__/**/*.test.ts \
                          -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                          -Dsonar.sourceEncoding=UTF-8 \
                          -Dsonar.host.url=${SONAR_HOST_URL} \
                          -Dsonar.token=${SONAR_TOKEN}
                    '''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker image') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: DOCKER_CREDENTIALS_ID,
                    usernameVariable: 'DOCKER_USERNAME',
                    passwordVariable: 'DOCKER_PASSWORD'
                )]) {
                    sh '''
                        docker build \
                          -t ${IMAGE_TAG} \
                          -t ${IMAGE_LATEST} \
                          .
                    '''
                }
            }
        }

        stage('Trivy scan') {
            steps {
                sh '''
                    trivy image \
                      --format json \
                      --output trivy-report.json \
                      --severity HIGH,CRITICAL \
                      ${IMAGE_TAG} || true

                    trivy image \
                      --format table \
                      --severity HIGH,CRITICAL \
                      ${IMAGE_TAG} || true
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'trivy-report.json', allowEmptyArchive: true
                }
            }
        }

        stage('Check Trivy vulnerabilities') {
            steps {
                sh '''
                    CRITICAL_COUNT=$(grep -o '"Severity":"CRITICAL"' trivy-report.json | wc -l || echo 0)
                    HIGH_COUNT=$(grep -o '"Severity":"HIGH"' trivy-report.json | wc -l || echo 0)
                    echo "Found ${CRITICAL_COUNT} CRITICAL and ${HIGH_COUNT} HIGH vulnerabilities"
                    if [ ${CRITICAL_COUNT} -gt 0 ] || [ ${HIGH_COUNT} -gt 0 ]; then
                        echo "Blocking pipeline due to HIGH or CRITICAL vulnerabilities!"
                        exit 1
                    fi
                '''
            }
        }

        stage('Generate SBOM') {
            steps {
                sh '''
                    trivy image \
                      --format spdx-json \
                      --output sbom.spdx.json \
                      ${IMAGE_TAG}
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'sbom.spdx.json', allowEmptyArchive: true
                }
            }
        }

        stage('Push Docker image') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: DOCKER_CREDENTIALS_ID,
                    usernameVariable: 'DOCKER_USERNAME',
                    passwordVariable: 'DOCKER_PASSWORD'
                )]) {
                    sh '''
                        echo "${DOCKER_PASSWORD}" | docker login -u "${DOCKER_USERNAME}" --password-stdin
                        docker push ${IMAGE_TAG}
                        docker push ${IMAGE_LATEST}
                        docker logout
                    '''
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}