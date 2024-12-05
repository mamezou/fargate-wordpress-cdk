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
    const sgELB = new ec2.SecurityGroup(this, 'sgELB', {
      vpc,
      description: 'Security Group for ELB allowing inbound HTTP traffic from the internet',
      securityGroupName: 'sg-elb'
    })
    sgELB.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic from the world')

    const sgAPP = new ec2.SecurityGroup(this, 'sgAPP', {
      vpc,
      description: 'Security Group for application servers allowing HTTP traffic from the ELB',
      securityGroupName: 'sg-app'
    })
    sgAPP.addIngressRule(sgELB, ec2.Port.tcp(80), 'Allow HTTP traffic from the ELB')

    const sgDB = new ec2.SecurityGroup(this, 'sgDB', {
      vpc,
      description: 'Security Group for RDS database allowing MySQL traffic from application servers',
      securityGroupName: 'sg-db'
    })
    sgDB.addIngressRule(sgAPP, ec2.Port.tcp(3306), 'Allow MySQL traffic from application security group')

    const sgEFS = new ec2.SecurityGroup(this, 'sgEFS', {
      vpc,
      description: 'Security Group for EFS allowing NFS traffic from application servers',
      securityGroupName: 'sg-efs'
    });
    sgEFS.addIngressRule(sgAPP, ec2.Port.tcp(2049), 'Allow NFS traffic from application servers');

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
