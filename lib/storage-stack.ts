import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  aws_ec2 as ec2,
  aws_efs as efs,
} from 'aws-cdk-lib';

interface Props extends StackProps {
  vpc: ec2.Vpc,
  sgEFS: ec2.SecurityGroup
}

export class StorageStack extends Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    /**
     * Create Amazon EFS
     */
    const fileSystem = new efs.FileSystem(this, 'wpFileSystem', {
      vpc: props.vpc,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_14_DAYS,
      securityGroup: props.sgEFS,
      removalPolicy: RemovalPolicy.DESTROY,
      encrypted: true
    });

    // # Setting Later
    // vpc.selectSubnets({ subnetGroupName: 'filesystem' }).subnets.forEach((subnet, index) => {
    //   new efs.CfnMountTarget(this, `MountTarget${index}`, {
    //     fileSystemId: fileSystem.fileSystemId,
    //     subnetId: subnet.subnetId,
    //     securityGroups: [sgEFS.securityGroupId]
    //   });
    // });

    // const accessPoint = fileSystem.addAccessPoint('accessPoint', {
    //   path: '/wordpress',
    //   createAcl: {
    //     ownerUid: '33',
    //     ownerGid: '33',
    //     permissions: '755',
    //   },
    //   posixUser: {
    //     uid: '33',
    //     gid: '33',
    //   },
    // });

  }
}
