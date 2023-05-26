docker run -d --name frontend -p 3000:3000 fdervisi/frontend

docker run -d --name backend fdervisi/backend






docker run -d --name mongo -v $(pwd)/data:/data/db mongo:4.2.0
docker run --name backend -v $(pwd)/backend:/usr/src/app -v /usr/src/app/node_modules --restart always -d fdervisi/backend
docker run --name frontend -v $(pwd)/frontend:/usr/src/app -v /usr/src/app/node_modules -p 3000:3000 --restart always -d fdervisi/frontend


docker stop frontend backend mongo
docker rm frontend backend mongo