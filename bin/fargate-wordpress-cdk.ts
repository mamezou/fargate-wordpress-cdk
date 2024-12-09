#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
// import { FargateWordpressCdkStack } from '../lib/fargate-wordpress-cdk-stack';
import { networkStack } from '../lib/network-stack';
import { databaseStack } from '../lib/database-stack';
import { loadBalancerStack } from '../lib/lb-stack';
import { StorageStack } from '../lib/storage-stack';
import { containerStack } from '../lib/container-stack';

const app = new cdk.App();
// new FargateWordpressCdkStack(app, 'FargateWordpressCdkStack', {
/* If you don't specify 'env', this stack will be environment-agnostic.
 * Account/Region-dependent features and context lookups will not work,
 * but a single synthesized template can be deployed anywhere. */

/* Uncomment the next line to specialize this stack for the AWS Account
 * and Region that are implied by the current CLI configuration. */
// env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

/* Uncomment the next line if you know exactly what Account and Region you
 * want to deploy the stack to. */
// env: { account: '123456789012', region: 'us-east-1' },

/* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
// });

const networkCdkStack = new networkStack(app, 'networkStack', {

})

const databaseCdkStack = new databaseStack(app, 'databaseStack', {
  vpc: networkCdkStack.vpc,
  sgDB: networkCdkStack.sgDB
})

const loadBalancerCdkStack = new loadBalancerStack(app, 'loadbalancerStack', {
  vpc: networkCdkStack.vpc,
  sgELB: networkCdkStack.sgELB
})

const storageCdkStack = new StorageStack(app, 'storageStack', {
  vpc: networkCdkStack.vpc,
  sgEFS: networkCdkStack.sgEFS
})

const containerCdkStack = new containerStack(app, 'containerStack', {
  vpc: networkCdkStack.vpc,
  sgAPP: networkCdkStack.sgAPP,
  mysql: databaseCdkStack.mysql,
  targetGroup: loadBalancerCdkStack.targetGroup
})