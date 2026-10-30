import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { networkStack } from '../lib/network-stack';
import { databaseStack } from '../lib/database-stack';
import { loadBalancerStack } from '../lib/lb-stack';
import { StorageStack } from '../lib/storage-stack';
import { containerStack } from '../lib/container-stack';

const app = new cdk.App();
const network = new networkStack(app, 'networkStack', {});
const database = new databaseStack(app, 'databaseStack', { vpc: network.vpc, sgDB: network.sgDB });
const lb = new loadBalancerStack(app, 'loadbalancerStack', { vpc: network.vpc, sgELB: network.sgELB });
const storage = new StorageStack(app, 'storageStack', { vpc: network.vpc, sgEFS: network.sgEFS });
const container = new containerStack(app, 'containerStack', {
  vpc: network.vpc,
  sgAPP: network.sgAPP,
  mysql: database.mysql,
  targetGroup: lb.targetGroup,
  fileSystem: storage.fileSystem,
  accessPoint: storage.accessPoint,
});

test('DBのパスワードは Parameter Store の SecureString から読む', () => {
  Template.fromStack(database).hasResourceProperties('AWS::RDS::DBInstance', {
    MasterUserPassword: '{{resolve:ssm-secure:/fargate-wordpress-cdk/db-password}}',
  });
});

test('タスクはパスワードをシークレットで受け取り、wp-content を EFS にマウントする', () => {
  const template = Template.fromStack(container);
  template.hasResourceProperties('AWS::ECS::TaskDefinition', {
    ContainerDefinitions: [
      Match.objectLike({
        Secrets: [Match.objectLike({ Name: 'DB_PASS' })],
        Environment: Match.not(Match.arrayWith([Match.objectLike({ Name: 'DB_PASS' })])),
        MountPoints: [{ ContainerPath: '/var/www/html/wp-content', ReadOnly: false, SourceVolume: 'wp-content' }],
      }),
    ],
    Volumes: [Match.objectLike({ Name: 'wp-content', EFSVolumeConfiguration: Match.objectLike({ TransitEncryption: 'ENABLED' }) })],
  });
});

test('NFS(2049)はアプリのセキュリティグループから EFS のセキュリティグループへ許可する', () => {
  Template.fromStack(network).hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
    FromPort: 2049,
    ToPort: 2049,
    GroupId: { 'Fn::GetAtt': [Match.stringLikeRegexp('^sgEFS'), 'GroupId'] },
  });
});
