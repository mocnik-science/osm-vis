# Installation of Automated Data Mining

The following instructions are meant for automated data mining.

## install nginx

```bash
sudo apt-get update
sudo apt-get install nginx
sudo iptables-unblocktcp 80  # osm-vis.geog.uni-heidelberg.de
sudo ufw allow 'Nginx HTTP'  # otherwise
```

## activate compression in nginx

open `/etc/nginx/nginx.conf` and replace the following line:
```
        # gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```
by this line:
```
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript application/octet-stream;
```

proceed with:
```bash
sudo service nginx restart
```

## install other software

```bash
sudo apt-get install libcurl4-gnutls-dev
sudo apt-get install haskell-platform
cabal update && cabal install cabal-install
sudo apt-get install npm
```

## add key to the repository

```bash
ssh-keygen -t rsa -C "mocnik@uni-heidelberg.de" -N "" -f ~/.ssh/id_rsa_osm-vis-data
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_rsa_osm-vis-data
```

add to `~/.ssh/config`:
```
Host github-osm-vis
    HostName github.com
    PreferredAuthentications publickey
    IdentityFile ~/.ssh/id_rsa_osm-vis-data
```

insert `~/.ssh/id_rsa_osm-vis-data.pub` to the repository `osm-vis-data` in github

## clone repositories

```bash
ln -s /var/www/html www
cd ~/www && sudo rm index.nginx-debian.html
sudo chown fmocnik:fmocnik /var/www/html  # replace with correct username
cd ~ && git clone https://github.com/mocnik-science/osm-vis
cd ~ && git clone ssh://git@github-osm-vis/mocnik-science/osm-vis-data.git
git config --global user.email "mocnik@uni-heidelberg.de"
git config --global user.name "Franz-Benjamin Mocnik"
```

## install needed software and configurations

```bash
sudo npm install -g bower
sudo npm install -g gulp
sudo ln -s /usr/bin/nodejs /usr/bin/node
cd ~/osm-vis
npm install
npm run dist
bin/data-mining-install.sh
mkdir -p .git/hooks && ln -s ../../bin/hooks/post-merge .git/hooks/
```

## automatic pull of OSMvis

```bash
crontab -u fmocnik -e  # replace with correct username
*/1 * * * * /bin/sh -c 'cd ~/osm-vis && git pull origin master > /dev/null 2>&1'
14 3 * * * /bin/sh -c 'cd ~/osm-vis && bin/data-mining-daily.sh > /dev/null 2>&1'
14 4 1 * * /bin/sh -c 'cd ~/osm-vis && bin/data-mining-monthly.sh > /dev/null 2>&1'
```
