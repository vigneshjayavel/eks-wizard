#!/bin/bash

# Import the MongoDB public GPG Key
rpm --import https://www.mongodb.org/static/pgp/server-4.0.asc

# Create a new yum repository configuration file for MongoDB
sudo tee /etc/yum.repos.d/mongodb-org-4.0.repo > /dev/null <<EOF
[mongodb-org-4.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/7/mongodb-org/4.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-4.0.asc
EOF

# Install MongoDB package using yum
sudo yum install -y mongodb-org

# Update the MongoDB configuration file to listen on all interfaces
sed -i 's/bindIp: 127.0.0.1/bindIp: 0.0.0.0/' "/etc/mongod.conf"

# Update the MongoDB configuration file to allow authorizationes
sudo sed -i 's/#security:/security:\n  authorization: enabled/' /etc/mongod.conf 

# Start MongoDB service
sudo systemctl start mongod

# Enable MongoDB service to start on boot
sudo systemctl enable mongod

# Create a new MongoDB user and assign it the previously created role
mongo TodoApp --eval '
db.createUser({
  user: "admin",
  pwd: "admin",
  roles: [
    { role: "root", db: "admin" }
  ]
})'

# Update the MongoDB configuration file to allow authorizations
sudo sed -i 's/#security:/security:\n  authorization: enabled/' /etc/mongod.conf 

# Restart MongoDB service
sudo systemctl restart mongod