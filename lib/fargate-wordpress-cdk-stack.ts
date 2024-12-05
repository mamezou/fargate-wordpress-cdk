import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  aws_ec2 as ec2,
} from 'aws-cdk-lib';

export class FargateWordpressCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /**
     * Create a VPC
     */
    const vpc = new ec2.Vpc(this, 'VPC', {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      subnetConfiguration: [
        {
          // LB & NAT Subnet
          cidrMask: 24,
          name: 'ingress',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          // Apllication Subnet
          cidrMask: 24,
          name: 'application',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          // FileSystem Subnet
          cidrMask: 24,
          name: 'filesystem',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        {
          // Database Subnet
          cidrMask: 24,
          name: 'database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }
      ],
    });

    /**
     * add VPC EndPoints
     */
    // Get the application subnets
    const applicationSubnets = vpc.selectSubnets({
      subnetGroupName: 'application'
    });

    vpc.addGatewayEndpoint('s3GwEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnets: applicationSubnets.subnets }]
    })

    vpc.addInterfaceEndpoint('ecrEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
      subnets: { subnets: applicationSubnets.subnets }
    });

    vpc.addInterfaceEndpoint('systemsmanagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
      subnets: { subnets: applicationSubnets.subnets }
    });

    vpc.addInterfaceEndpoint('cloudwatchEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      subnets: { subnets: applicationSubnets.subnets }
    });

    /**
     * Create SG
     */

    /**
     * Create Amazon RDS
     */

    /**
     * Create a ALB
     */

    /**
     * Create a Targate Group
     */

    /**
     * Create a ECR
     */

    /**
     * Create a ECS Cluster
     */

    /**
     * Create a ECS Task Definition
     */

    /**
     * Create a ECS Service
     */

  }
}
