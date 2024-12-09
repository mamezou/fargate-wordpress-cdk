import { RemovalPolicy, SecretValue, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  aws_ec2 as ec2,
  aws_rds as rds,
  // aws_secretsmanager as secretsmanager,
  // aws_iam as iam
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
    // const dbCredentialSecret = new secretsmanager.Secret(this, 'dbCredentialSecret', {
    //   secretName: "mysql",
    //   generateSecretString: {
    //     excludePunctuation: true,
    //     includeSpace: false,
    //     secretStringTemplate: JSON.stringify({
    //       username: 'dbuser',
    //     }),
    //     generateStringKey: 'password',
    //   }
    // })

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
      // credentials: rds.Credentials.fromSecret(dbCredentialSecret),
      credentials: rds.Credentials.fromPassword(params.TEMP_DB_USER, SecretValue.unsafePlainText(params.TEMP_DB_PASS)),
    })

    this.mysql = mysql
  }
}
