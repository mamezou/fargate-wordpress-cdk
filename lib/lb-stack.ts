import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  aws_ec2 as ec2,
  aws_elasticloadbalancingv2 as elbv2,
} from 'aws-cdk-lib';

interface Props extends StackProps {
  vpc: ec2.Vpc,
  sgELB: ec2.SecurityGroup
}

export class loadBalancerStack extends Stack {
  public readonly targetGroup: elbv2.ApplicationTargetGroup;
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    /**
     * Create a ALB
     */
    const alb = new elbv2.ApplicationLoadBalancer(this, 'wpAlb', {
      vpc: props.vpc,
      securityGroup: props.sgELB,
      internetFacing: true,
      loadBalancerName: 'ALB',
    })

    const listener = alb.addListener('wpListener', {
      port: 80,
      open: true,
    })

    /**
     * Create a Targate Group
     */
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'wpTargetGroup', {
      vpc: props.vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
    })

    listener.addTargetGroups('wpTargetGroup', {
      targetGroups: [targetGroup],
    })

    targetGroup.configureHealthCheck({
      path: '/',
      healthyHttpCodes: '200,302',
    });

    this.targetGroup = targetGroup
  }
}
