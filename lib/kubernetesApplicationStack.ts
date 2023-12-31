import { Construct } from 'constructs';
import { Fn } from 'cdktf';
import {
  deployment,
  provider as k8s,
  service,
  secret,
} from '@cdktf/provider-kubernetes/';
import { dataAwsEksCluster, dataAwsEksClusterAuth } from '@cdktf/provider-aws';

// Define an interface for Kubernetes Application Stack configurations
interface KubernetesApplicationStackConfig {
  cluster: dataAwsEksCluster.DataAwsEksCluster;
  clusterAuth: dataAwsEksClusterAuth.DataAwsEksClusterAuth;
  userId: string;
}

/**
 * A class representing a Kubernetes Application Stack.
 * @class
 * @constructor
 * @param {Construct} scope - The parent Construct instantiating this stack.
 * @param {string} id - The unique identifier for this stack.
 * @param {KubernetesApplicationStackConfig} config - The configuration object for this stack.
 */
export class KubernetesApplicationStack extends Construct {
  constructor(
    scope: Construct,
    id: string,
    config: KubernetesApplicationStackConfig
  ) {
    super(scope, id);

    // Set up the Kubernetes provider with the EKS cluster details from the config
    new k8s.KubernetesProvider(this, `kubernetes-provider-`, {
      host: config.cluster.endpoint,
      clusterCaCertificate: Fn.base64decode(
        config.cluster.certificateAuthority.get(0).data
      ),
      token: config.clusterAuth.token,
    });

    // Create a new Kubernetes secret to store the MongoDB connection string
    const mogoDbSecrete = new secret.Secret(this, `mongodb-secret-`, {
      metadata: {
        name: 'mongodb-secret',
      },
      data: {
        MONGODB_URI: Buffer.from(
          'mongodb://admin:admin@mongodb.fdervisi.io:27017/TodoApp'
        ).toString(),
      },
    });

    // Create a new Kubernetes deployment for the backend
    const backendDeployment = new deployment.Deployment(
      this,
      `backend-deployment-`,
      {
        metadata: {
          name: 'backend',
        },
        spec: {
          replicas: '1',
          selector: {
            matchLabels: {
              app: 'backend',
            },
          },
          template: {
            metadata: {
              labels: {
                app: 'backend',
              },
            },
            spec: {
              container: [
                {
                  name: 'backend',
                  image: 'fdervisi/backend',
                  env: [
                    {
                      name: 'MONGODB_URI',
                      valueFrom: {
                        secretKeyRef: {
                          name: mogoDbSecrete.metadata.name,
                          key: 'MONGODB_URI',
                        },
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
      }
    );

    // Create a new Kubernetes service for the backend
    new service.Service(this, `backend-service-`, {
      metadata: {
        name: 'backend',
      },
      spec: {
        port: [
          {
            port: 3000,
            targetPort: '3000',
          },
        ],
        selector: {
          app: backendDeployment.metadata.name,
        },
      },
    });

    // Create a new Kubernetes deployment for the frontend
    const frontendDeployment = new deployment.Deployment(
      this,
      `frontend-deployment-`,
      {
        metadata: {
          name: 'frontend',
        },
        spec: {
          replicas: '1',
          selector: {
            matchLabels: {
              app: 'frontend',
            },
          },
          template: {
            metadata: {
              labels: {
                app: 'frontend',
              },
            },
            spec: {
              container: [
                {
                  name: 'frontend',
                  image: 'fdervisi/frontend',
                  port: [
                    {
                      containerPort: 3000,
                    },
                  ],
                },
              ],
            },
          },
        },
      }
    );

    // Create a new Kubernetes service for the frontend
    new service.Service(this, `frontend-service-`, {
      metadata: {
        name: 'frontend',
      },
      spec: {
        type: 'LoadBalancer',
        port: [
          {
            port: 3000,
            targetPort: '3000',
          },
        ],
        selector: {
          app: frontendDeployment.metadata.name,
        },
      },
    });
  }
}
