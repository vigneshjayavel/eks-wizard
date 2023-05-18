import { Construct } from 'constructs';
import { App, TerraformStack, CloudBackend, NamedCloudWorkspace } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { cloudServiceTree } from './lib/cloudServiceTreeParser';
import { VpcStack } from './lib/vpcStack';

class EksStack extends TerraformStack {
  public vpc: VpcStack;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, 'aws', { region: cloudServiceTree.region });

    this.vpc = new VpcStack(this, 'network', {
      userId: cloudServiceTree.userId,
      vpc: cloudServiceTree.vpc,
      eks: cloudServiceTree.vpc.eks,
    });
  }
}

// class KubernetesApplicationStack extends TerraformStack {
//   constructor(
//     scope: Construct,
//     id: string,
//     cluster: dataAwsEksCluster.DataAwsEksCluster,
//     clusterAuth: dataAwsEksClusterAuth.DataAwsEksClusterAuth
//   ) {
//     super(scope, id);

//     new k8s.KubernetesProvider(this, 'cluster', {
//       host: cluster.endpoint,
//       clusterCaCertificate: Fn.base64decode(
//         cluster.certificateAuthority.get(0).data
//       ),
//       token: clusterAuth.token,
//     });

//     const mogoDbSecrete = new secret.Secret(this, 'mongodb-secret', {
//       metadata: {
//         name: 'mongodb-secret',
//       },

//       data: {
//         MONGODB_URI: Buffer.from(
//           'mongodb://admin:admin@mongodb.fdervisi.io:27017/TodoApp'
//         ).toString(),
//       },
//     });

//     const backendDeployment = new deployment.Deployment(
//       this,
//       'backend-deployment',
//       {
//         metadata: {
//           name: 'backend',
//         },
//         spec: {
//           replicas: '1',
//           selector: {
//             matchLabels: {
//               app: 'backend',
//             },
//           },
//           template: {
//             metadata: {
//               labels: {
//                 app: 'backend',
//               },
//             },
//             spec: {
//               container: [
//                 {
//                   name: 'backend',
//                   image: 'fdervisi/backend',
//                   env: [
//                     {
//                       name: 'MONGODB_URI',
//                       valueFrom: {
//                         secretKeyRef: {
//                           name: mogoDbSecrete.metadata.name,
//                           key: 'MONGODB_URI',
//                         },
//                       },
//                     },
//                   ],
//                 },
//               ],
//             },
//           },
//         },
//       }
//     );

//     new service.Service(this, 'backend-service', {
//       metadata: {
//         name: 'backend',
//       },
//       spec: {
//         port: [
//           {
//             port: 3000,
//             targetPort: '3000',
//           },
//         ],
//         selector: {
//           app: backendDeployment.metadata.name,
//         },
//       },
//     });

//     const frontendDeployment = new deployment.Deployment(this, 'frontend', {
//       metadata: {
//         name: 'frontend',
//       },
//       spec: {
//         replicas: '1',
//         selector: {
//           matchLabels: {
//             app: 'frontend',
//           },
//         },
//         template: {
//           metadata: {
//             labels: {
//               app: 'frontend',
//             },
//           },
//           spec: {
//             container: [
//               {
//                 name: 'frontend',
//                 image: 'fdervisi/frontend',
//                 port: [
//                   {
//                     containerPort: 3000,
//                   },
//                 ],
//               },
//             ],
//           },
//         },
//       },
//     });

//     new service.Service(this, 'frontend-service', {
//       metadata: {
//         name: 'frontend',
//       },
//       spec: {
//         type: 'LoadBalancer',
//         port: [
//           {
//             port: 3000,
//             targetPort: '3000',
//           },
//         ],
//         selector: {
//           app: frontendDeployment.metadata.name,
//         },
//       },
//     });
//   }
// }

const app = new App();
const eksStack = new EksStack(app, 'eks-app');

// new KubernetesApplicationStack(
//   app,
//   'applications',
//   eksStack.eks,
//   eksStack.eksAuth
// );
new CloudBackend(eksStack, {
  hostname: 'app.terraform.io',
  organization: 'fdervisi',
  workspaces: new NamedCloudWorkspace('eks-app'),
});
app.synth();
