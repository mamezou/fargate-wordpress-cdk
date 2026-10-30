import { RemovalPolicy, SecretValue, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  aws_ec2 as ec2,
  aws_rds as rds,
} from 'aws-cdk-lib';
import params from './params';

interface Props extends StackProps {
  vpc: ec2.Vpc,
  sgDB: ec2.SecurityGroup
}

export class databaseStack extends Stack {
  public readonly mysql: rds.DatabaseInstance;
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    /**
     * Create Amazon RDS
     */
    const mysql = new rds.DatabaseInstance(this, 'wpDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({ version: rds.MysqlEngineVersion.VER_8_0 }),
      vpc: props.vpc,
      vpcSubnets: {
        subnetGroupName: 'database'
      },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
      securityGroups: [props.sgDB],
      // multiAz: true,
      databaseName: params.DB_NAME,
      removalPolicy: RemovalPolicy.DESTROY,
      // パスワードは Parameter Store の SecureString を CloudFormation の動的参照で読む
      credentials: rds.Credentials.fromPassword(params.DB_USER, SecretValue.ssmSecure(params.DB_PASSWORD_PARAMETER)),
    })

    this.mysql = mysql
  }
}
