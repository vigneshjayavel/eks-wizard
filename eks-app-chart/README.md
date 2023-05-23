Sure, here's a combined README.md incorporating both the general information and the detailed template breakdown:

---

# eks-app Helm Chart

## Overview

The `eks-app` is a Helm chart for deploying a simple web application on a Kubernetes cluster. This web application comprises a frontend and a backend service which both interact with a MongoDB database.

The application is made up of:

- A Frontend: Serves the user interface and communicates with the backend service.
- A Backend: Handles business logic and data storage via MongoDB.
- MongoDB Database: Stores application data.

## Prerequisites

- Kubernetes 1.12+
- Helm 3.1.0

## Installing the Chart

To install the chart with the release name `eks-app`:

```bash
helm install eks-app /path/to/eks-app
```

This command deploys the `eks-app` on the Kubernetes cluster in the default configuration.

## Detailed Template Breakdown

- **namespace.yaml**: Defines a Namespace named `eks-app`, providing a scope for the resources part of this deployment.
- **serviceaccount.yaml**: Creates a ServiceAccount named `admin-service-account` under the `eks-app` namespace, providing an identity for processes running in a Pod.
- **mongodb-secret.yaml**: Stores the MongoDB URI encoded in base64 in a Secret named `mongodb-secret` under the `eks-app` namespace.
- **clusterrole.yaml**: Defines a ClusterRole named `admin-cluster-role` that has full access (crud operations) to all resources in the Kubernetes cluster.
- **clusterrolebinding.yaml**: Binds the `admin-cluster-role` to the `admin-service-account` ServiceAccount, enabling any Pod running with this ServiceAccount to have the permissions defined by the ClusterRole.
- **backend-service.yaml and frontend-service.yaml**: Define Services for the `backend` and `frontend` respectively, managing traffic routing to the corresponding Pods.
- **backend-deployment.yaml and frontend-deployment.yaml**: Define Deployments for the `backend` and `frontend` respectively. Each Deployment includes a single replica (Pod), running the specified images. The backend Pod connects to MongoDB using the URI stored in the `mongodb-secret` Secret.

## Configuration

The following table lists the configurable parameters of the eks-app chart and their default values.

| Parameter                 | Description                                     | Default                                                 |
|---------------------------|-------------------------------------------------|---------------------------------------------------------|
| `backend.image`           | Backend image                                   | `fdervisi/backend`                                      |
| `backend.replicas`        | Number of backend instances                     | `3`                                                     |
| `frontend.image`          | Frontend image                                  | `fdervisi/frontend`                                     |
| `frontend.replicas`       | Number of frontend instances                    | `3`                                                     |
| `mongodb_uri`             | MongoDB URI                                     | `mongodb://admin:admin@mongodb.fdervisi.io:27017/TodoApp` |
| `clusterRole.name`        | Name of the ClusterRole                         | `admin-cluster-role`                                    |
| `serviceAccount.name`     | Name of the ServiceAccount                      | `admin-service-account`                                 |
| `namespace.name`          | Name of the Namespace                           | `eks-app`                                               |

Modify the values in your Helm command with the `--set key=value[,key=value]` argument. For instance,

```bash
helm install eks-app /path/to/eks-app --set backend.replicas=2,frontend.replicas=2
```

This command installs `eks-app` with 2 backend instances and 2 frontend instances.

For more detailed information about the deployment and configuration, refer to the chart's [values.yaml](values.yaml) file.

## Uninstalling the Chart

To uninstall/delete the `eks-app` deployment:

```bash