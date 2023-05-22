import { Construct } from 'constructs';
import { App, TerraformStack, CloudBackend, NamedCloudWorkspace } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { cloudServiceTree } from './lib/cloudServiceTreeParser';
import { VpcStack } from './lib/vpcStack';
import { IRegion } from './lib/CloudServiceTreeInterface';
import { S3Stack } from './lib/s3Stack';
import { LambdaStack } from './lib/lambdaStack';
import { IamStack } from './lib/iamStack';

interface EksStackConfig {
  region: IRegion;
}

class EksStack extends TerraformStack {
  private vpc!: VpcStack;
  constructor(scope: Construct, id: string, config: EksStackConfig) {
    super(scope, id);

    new AwsProvider(this, 'aws', { region: config.region.name });

    if (config.region.s3) {
      new S3Stack(this, `s3-${config.region.name}`, {
        s3: config.region.s3,
        userId: cloudServiceTree.userId,
      });
    }

    config.region.vpc.forEach((vpcItem) => {
      this.vpc = new VpcStack(this, `network`, {
        userId: cloudServiceTree.userId,
        vpc: vpcItem,
        eks: vpcItem.eks,
        s3BucketName: config.region.s3.bucketName,
      });

      if (config.region.lamdaS3Bucket) {
        new LambdaStack(this, `lambda-stack-${config.region.name}`, {
          s3BucketName: config.region.s3.bucketName,
          lamdaS3Bucket: config.region.lamdaS3Bucket,
          targetIp: this.vpc.privateDns[0].ip || '1.1.1.1',
          userId: cloudServiceTree.userId,
        });
      }
    });
  }
}

const app = new App();

if (cloudServiceTree.iamRole) {
  new IamStack(app, `iamstack`, {
    iamRole: cloudServiceTree.iamRole,
    userId: cloudServiceTree.userId,
  });
}

cloudServiceTree.regions.forEach((regionItem) => {
  const eksStack = new EksStack(app, 'eks-app', { region: regionItem });
  new CloudBackend(eksStack, {
    hostname: 'app.terraform.io',
    organization: 'fdervisi',
    workspaces: new NamedCloudWorkspace('eks-app'),
  });
});

app.synth();
