pipeline {
  agent any
  stages {
    stage('authorization') {
        echo -n {{password}} | docker login -u {{username}} --password-stdin
    }
    stage('build') {
      steps {
        docker build --progress=plain -t nyamkamunhjin/new-binance-bot .
      }
    }
    stage('deploy') {
      steps {
        docker push nyamkamunhjin/new-binance-bot:latest
      }
    }
  }
}