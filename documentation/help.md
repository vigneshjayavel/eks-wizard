
## Install Terraform

wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform


## Create and initialize the project 
https://developer.hashicorp.com/terraform/tutorials/cdktf/cdktf-install

npm install --global cdktf-cli@latest
mkdir eks-app
cdktf init --template=typescript

typescript-json-schema --required --noExtraProps ./lib/CloudServiceTreeInterface.ts ICloudServiceTree > cloudServiceTreeSchema.json