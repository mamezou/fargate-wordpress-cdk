# **fargate-wordpress-cdk**

AWS FargateとCDKを使用して、コンテナ化されたWordPress環境を構築するための基盤。

---

## **アーキテクチャ**

**WIP: アーキテクチャ図載せる**

### **主要コンポーネント**
1. **Amazon VPC**:
   - 2つのアベイラビリティゾーン（AZ）にまたがるプライベートおよびパブリックサブネット。
   - NAT Gatewayとインターネットゲートウェイを使用。

2. **Amazon ECS (Fargate)**:
   - コンテナ化されたWordPressアプリケーションをホスト。
   - 各AZに配置されるタスク。

3. **Amazon RDS**:
   - WordPressデータベース（MySQL）。
   - マルチAZ構成で高可用性を確保。

4. **Amazon EFS**:
   - `wp-content`ディレクトリの共有ストレージ。
   - 複数のFargateタスク間でデータを共有。

5. **Elastic Load Balancer (ALB)**:
   - トラフィックをFargateタスクに分散。
   - ヘルスチェックやSSL終端処理を実施。

6. **VPCエンドポイント**:
   - Secrets ManagerやCloudWatch Logsなど、AWSサービスへのプライベートアクセスを提供。

7. **その他**:
   - **Amazon ECR**: カスタムDockerイメージの保存。
   - **CloudWatch Logs**: ログ管理とモニタリング。

---

## **セットアップ手順**

### **前提条件**
- AWS CLIがインストールされていること。
- CDK CLIがインストールされていること。
- Node.js 16.x以上がインストールされていること。

### **1. リポジトリのクローン**
```bash
git clone https://github.com/<your-repo>/fargate-wordpress-cdk.git
cd fargate-wordpress-cdk
```

### **2. 必要な依存関係をインストール**
```bash
npm install
```

### **3. CDKスタックをデプロイ**
```bash
cdk deploy --all
```

---

## **スタック構成**

- **network-stack**
  - VPC、NAT Gateway、セキュリティグループなどを作成します。
- **lb-stack**
  - ALBを作成します。
- **database-stack**
  - RDSを作成します。
- **storage-stack**
  - EFSを作成します。
- **container-stack**
  - ECR、ECSクラスター、およびFargateタスクを作成します。

---

## **今後の改善点**
1. Secrets ManagerまたはAWS Systems Manager Parameter Storeでクレデンシャル管理を自動化。
2. CloudFrontとWAFを導入してセキュリティとパフォーマンスを向上。
3. RDS Proxyを導入して接続管理を効率化。

---
