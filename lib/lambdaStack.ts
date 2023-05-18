import { CloudwatchEventRule } from '@cdktf/provider-aws/lib/cloudwatch-event-rule';
import { CloudwatchEventTarget } from '@cdktf/provider-aws/lib/cloudwatch-event-target';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { Construct } from 'constructs';
interface LambdaStackConfig {
  privateDns: { ip?: string; hostname?: string }[];
  vpcId: string;
  userId: string;
}

export class LambdaStack extends Construct {
  constructor(scope: Construct, id: string, config: LambdaStackConfig) {
    super(scope, id);

    const role = new IamRole(this, 'LambdaRole', {
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

    const lambda = new LambdaFunction(this, 'MongoBackupFunction', {
      functionName: 'mongoBackup',
      handler: 'mongo_s3_backup.lambda_handler',
      runtime: 'python3.8',
      role: role.arn,
      filename: 'path-to/mongo_s3_backup.zip', // Replace with the path to the zipped Python script
      environment: {
        variables: {
          BUCKET_NAME: 'bucket.bucket',
        },
      },

      timeout: 300, // Timeout can be adjusted based on how long your backup might take
    });

    new LambdaPermission(this, 'LambdaPermission', {
      statementId: 'AllowExecutionFromCloudWatch',
      action: 'lambda:InvokeFunction',
      functionName: lambda.id,
      principal: 'events.amazonaws.com',
    });

    const schedule = new CloudwatchEventRule(this, 'Schedule', {
      scheduleExpression: 'rate(1 day)', // Adjust backup frequency as needed
    });

    new CloudwatchEventTarget(this, 'Target', {
      rule: schedule.name,
      arn: lambda.arn,
    });
  }
}

// main.ts
