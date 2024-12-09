
import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  aws_ec2 as ec2,
  aws_rds as rds,
  aws_ecs as ecs,
  aws_ecr as ecr,
  aws_elasticloadbalancingv2 as elbv2,
  aws_iam as iam
} from 'aws-cdk-lib';
import * as ecrdeploy from 'cdk-ecr-deployment';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import * as path from 'path';
import params from './params';

const imageTag = 'v1.0.1'

interface Props extends StackProps {
  vpc: ec2.Vpc,
  sgAPP: ec2.SecurityGroup,
  mysql: rds.DatabaseInstance,
  targetGroup: elbv2.ApplicationTargetGroup
}

export class containerStack extends Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    /**
     * Create a ECR
     */
    const repository = new ecr.Repository(this, 'wpRepository', {
      repositoryName: 'wordpress',
      imageScanOnPush: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteImages: true,
    });

    const asset = new DockerImageAsset(this, 'wordPressImage', {
      directory: path.join(__dirname, '../app'),
    });

    new ecrdeploy.ECRDeployment(this, 'deployWordPressImage', {
      src: new ecrdeploy.DockerImageName(asset.imageUri),
      dest: new ecrdeploy.DockerImageName(`${repository.repositoryUri}:${imageTag}`),
    });

    /**
     * Create a ECS Cluster
     */
    const cluster = new ecs.Cluster(this, 'wpCluster', { vpc: props.vpc });

    /**
     * Create a ECS Task Definition
     */
    // const taskExecutionRole = new iam.Role(this, 'taskExecutionRole', {
    //   assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    // });

    // taskExecutionRole.addToPolicy(new iam.PolicyStatement({
    //   actions: [
    //     'secretsmanager:GetSecretValue',
    //     'kms:Decrypt',
    //   ],
    //   resources: [
    //     dbCredentialSecret.secretArn,
    //   ],
    // }));

    // // EFSアクセス権限
    // taskRole.addToPolicy(new iam.PolicyStatement({
    //   actions: [
    //     'elasticfilesystem:ClientMount',
    //     'elasticfilesystem:ClientWrite',
    //     'elasticfilesystem:DescribeMountTargets',
    //   ],
    //   resources: ['*'],
    // }));

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'taskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
      // executionRole: taskExecutionRole
    });

    // taskDefinition.addVolume({
    //   name: 'efs-volume',
    //   efsVolumeConfiguration: {
    //     fileSystemId: fileSystem.fileSystemId,
    //     authorizationConfig: {
    //       accessPointId: accessPoint.accessPointId,
    //       iam: 'ENABLED',
    //     },
    //     transitEncryption: 'ENABLED',
    //   },
    // });


    const container = taskDefinition.addContainer('AppContainer', {
      image: ecs.ContainerImage.fromEcrRepository(repository, imageTag),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'WordPress' }),
      environment: {
        DB_HOST: props.mysql.instanceEndpoint.hostname,
        DB_PORT: String(props.mysql.instanceEndpoint.port),
        DB_NAME: params.DB_NAME,
        DB_USER: params.TEMP_DB_USER,
        DB_PASS: params.TEMP_DB_PASS
      },
      // secrets: {
      //   DB_USER: ecs.Secret.fromSecretsManager(dbCredentialSecret, 'username'),
      //   DB_PASS: ecs.Secret.fromSecretsManager(dbCredentialSecret, 'password'),
      // },
    });

    container.addPortMappings({
      hostPort: 80,
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    })

    // container.addMountPoints({
    //   containerPath: '/var/www/html/wp-content',
    //   sourceVolume: 'efs-volume',
    //   readOnly: false,
    // });

    /**
     * Create a ECS Service
     */
    const fargateService = new ecs.FargateService(this, 'fargateSpotService', {
      cluster,
      taskDefinition,
      desiredCount: 1,
      securityGroups: [props.sgAPP],
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: 1,
        },
        {
          capacityProvider: 'FARGATE',
          weight: 0,
        },
      ],
    });

    const scalableTarget = fargateService.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 10,
    });

    // Scaling Policy for CPU
    scalableTarget.scaleOnCpuUtilization('cpuScaling', {
      targetUtilizationPercent: 50,
    });

    // Scaling Policy for Memory
    scalableTarget.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 50,
    });

    fargateService.attachToApplicationTargetGroup(props.targetGroup)

  }
}
