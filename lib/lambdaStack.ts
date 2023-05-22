import { CloudwatchEventRule } from '@cdktf/provider-aws/lib/cloudwatch-event-rule';
import { CloudwatchEventTarget } from '@cdktf/provider-aws/lib/cloudwatch-event-target';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { Construct } from 'constructs';
interface LambdaStackConfig {
  targetIp: string;
  s3BucketName: string;
  userId: string;
  lamdaS3Bucket: string;
}

export class LambdaStack extends Construct {
  constructor(scope: Construct, id: string, config: LambdaStackConfig) {
    super(scope, id);

    const role = new IamRole(this, `lambda-role-${config.s3BucketName}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Effect: 'Allow',
            Sid: '',
          },
        ],
      }),
    });

    new IamRolePolicy(this, `lambda-s3-policy-${config.s3BucketName}`, {
      name: 'LambdaS3Policy',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:PutObjectAcl'],
            Resource: `arn:aws:s3:::${config.s3BucketName}/*`,
          },
        ],
      }),
      role: role.id,
    });

    const lambda = new LambdaFunction(this, 'MongoBackupFunction', {
      functionName: 'mongoBackup',
      handler: 'index.handler',
      runtime: 'nodejs12.x',
      role: role.arn,
      s3Bucket: config.lamdaS3Bucket,
      s3Key: 'lambda-mongodb-s3-backup.zip',
      environment: {
        variables: {
          MONGO_URL: `mongodb://admin:admin@${config.targetIp}:27017/TodoApp`,
          S3_PATH: `${config.s3BucketName}`,
        },
      },
      timeout: 30,
    });

    new LambdaPermission(this, 'LambdaPermission', {
      statementId: 'AllowExecutionFromCloudWatch',
      action: 'lambda:InvokeFunction',
      functionName: lambda.id,
      principal: 'events.amazonaws.com',
    });

    const schedule = new CloudwatchEventRule(this, 'Schedule', {
      scheduleExpression: 'rate(1 day)',
    });

    new CloudwatchEventTarget(this, 'Target', {
      rule: schedule.name,
      arn: lambda.arn,
    });
  }
}
