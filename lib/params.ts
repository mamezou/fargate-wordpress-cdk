// DBのパスワードはコードに置かず、Parameter Store の SecureString から読む。
// パラメータはデプロイ前に作る(README の手順を参照)。
const DB_USER = 'wpadmin'
const DB_NAME = 'wordpress'
const DB_PASSWORD_PARAMETER = '/fargate-wordpress-cdk/db-password'

export default {
  DB_USER,
  DB_NAME,
  DB_PASSWORD_PARAMETER
}
