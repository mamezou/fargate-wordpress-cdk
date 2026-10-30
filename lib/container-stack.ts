
import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  aws_ec2 as ec2,
  aws_rds as rds,
  aws_ecs as ecs,
  aws_ecr as ecr,
  aws_elasticloadbalancingv2 as elbv2,
  aws_efs as efs,
  aws_ssm as ssm,
} from 'aws-cdk-lib';
import * as ecrdeploy from 'cdk-ecr-deployment';
import { DockerImageAsset, Platform } from 'aws-cdk-lib/aws-ecr-assets';
import * as path from 'path';
import params from './params';

const imageTag = 'v1.0.1'

interface Props extends StackProps {
  vpc: ec2.Vpc,
  sgAPP: ec2.SecurityGroup,
  mysql: rds.DatabaseInstance,
  targetGroup: elbv2.ApplicationTargetGroup,
  fileSystem: efs.FileSystem,
  accessPoint: efs.AccessPoint
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

    // Fargate のタスクは x86_64 で動くため、Apple Silicon の Mac でビルドしても amd64 のイメージにする
    const asset = new DockerImageAsset(this, 'wordPressImage', {
      directory: path.join(__dirname, '../app'),
      platform: Platform.LINUX_AMD64,
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
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'taskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    // wp-content を EFS に置き、タスクが増えてもアップロードしたファイルを共有する
    taskDefinition.addVolume({
      name: 'wp-content',
      efsVolumeConfiguration: {
        fileSystemId: props.fileSystem.fileSystemId,
        transitEncryption: 'ENABLED',
        authorizationConfig: {
          accessPointId: props.accessPoint.accessPointId,
          iam: 'ENABLED',
        },
      },
    });
    props.fileSystem.grantReadWrite(taskDefinition.taskRole);

    // DBのパスワード(Parameter Store の SecureString)。タスクの起動時に環境変数 DB_PASS として渡る
    const dbPassword = ssm.StringParameter.fromSecureStringParameterAttributes(this, 'dbPassword', {
      parameterName: params.DB_PASSWORD_PARAMETER,
    });

    const container = taskDefinition.addContainer('AppContainer', {
      image: ecs.ContainerImage.fromEcrRepository(repository, imageTag),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'WordPress' }),
      environment: {
        DB_HOST: props.mysql.instanceEndpoint.hostname,
        DB_PORT: String(props.mysql.instanceEndpoint.port),
        DB_NAME: params.DB_NAME,
        DB_USER: params.DB_USER,
      },
      secrets: {
        DB_PASS: ecs.Secret.fromSsmParameter(dbPassword),
      },
    });

    container.addPortMappings({
      hostPort: 80,
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    })

    container.addMountPoints({
      containerPath: '/var/www/html/wp-content',
      sourceVolume: 'wp-content',
      readOnly: false,
    });

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
