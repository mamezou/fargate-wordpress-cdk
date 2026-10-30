#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { networkStack } from '../lib/network-stack';
import { databaseStack } from '../lib/database-stack';
import { loadBalancerStack } from '../lib/lb-stack';
import { StorageStack } from '../lib/storage-stack';
import { containerStack } from '../lib/container-stack';

const app = new cdk.App();

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
  targetGroup: loadBalancerCdkStack.targetGroup,
  fileSystem: storageCdkStack.fileSystem,
  accessPoint: storageCdkStack.accessPoint
})