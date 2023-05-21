import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { Construct } from 'constructs';
import { IS3 } from './CloudServiceTreeInterface';
// import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
interface S3StackConfig {
  s3: IS3;
  userId: string;
}

export class S3Stack extends Construct {
  constructor(scope: Construct, id: string, config: S3StackConfig) {
    super(scope, id);

    const s3Bucket = new S3Bucket(this, `s3-bucket-${config.s3.bucketName}`, {
      bucket: config.s3.bucketName,
    });

    // new S3BucketPolicy(this, 'BucketPolicy', {
    //   bucket: s3Bucket.arn,
    //   policy: JSON.stringify({
    //     Version: '2012-10-17',
    //     Statement: [
    //       {
    //         Sid: 'PublicReadGetObject',
    //         Effect: 'Allow',
    //         Principal: '*',
    //         Action: 's3:GetObject',
    //         Resource: `arn:aws:s3:::${s3Bucket.bucket}/*`,
    //       },
    //     ],
    //   }),
    // });

    new S3BucketPublicAccessBlock(
      this,
      `s3-bucket-public-access-block-${config.s3.bucketName}`,
      {
        blockPublicAcls: config.s3.blockPublicAccess,
        blockPublicPolicy: config.s3.blockPublicAccess,
        ignorePublicAcls: config.s3.blockPublicAccess,
        restrictPublicBuckets: config.s3.blockPublicAccess,
        bucket: s3Bucket.bucket,
      }
    );
  }
}