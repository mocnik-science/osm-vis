# Installation of Automated Data Mining

The following instructions are meant for automated data mining.

## install nginx

```bash
sudo apt-get update
sudo apt-get install nginx
sudo iptables-unblocktcp 80 global  # osm-vis.geog.uni-heidelberg.de
sudo iptables-unblocktcp 443 global  # osm-vis.geog.uni-heidelberg.de
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

## Let's Encrypt

```bash
sudo apt-get update
sudo apt-get install -y software-properties-common
sudo add-apt-repository ppa:certbot/certbot
sudo apt-get update
sudo apt-get install -y certbot python-certbot-nginx

sudo certbot --nginx --email mocnik@uni-heidelberg.de --agree-tos -n -d osm-vis.geog.uni-heidelberg.de
#  --staging
sudo shutdown -r now
```

Then use `crontab -e` to add:

```
44 3 * * * certbot renew --post-hook "service nginx restart"
```

## Configure nginx

Create a file `/etc/nginx/sites-available/https-redirect` (via `sudo vi`) with the following content:

```
server {
  listen 80;
  listen [::]:80 ssl;
  
  server_name osm-vis.geog.uni-heidelberg.de;
  
  return 301 https://$host$request_uri;
}
```

Create a file `/etc/nginx/sites-available/osm-vis` (via `sudo vi`) with the following content:

```
server {
  listen 443 ssl;
  listen [::]:443 ssl;
  
  server_name osm-vis.geog.uni-heidelberg.de;
  
  ssl_certificate /etc/letsencrypt/live/osm-vis.geog.uni-heidelberg.de/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/osm-vis.geog.uni-heidelberg.de/privkey.pem;
  
  root /var/www/html;
  
  index index.html;
}
```

Then:

```bash
sudo rm /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/https-redirect /etc/nginx/sites-enabled/https-redirect
sudo ln -s /etc/nginx/sites-available/osm-vis /etc/nginx/sites-enabled/osm-vis
sudo service nginx restart
```

## clone repositories

```bash
ln -s /var/www/html www
cd ~/www && sudo rm index.nginx-debian.html
sudo chown fmocnik:fmocnik /var/www/html  # replace with correct username
cd ~ && git clone https://github.com/mocnik-science/osm-vis
cd ~ && git clone ssh://git@github-osm-vis/GIScience/osm-vis-data.git
git config --global user.email "mocnik@uni-heidelberg.de"
git config --global user.name "Franz-Benjamin Mocnik"
```

## add inejction for privacy policy

Create a file `/home/f/fmocnik/osm-vis/inject-comment.html` (via `vi`) with the following content:

```
<a href="https://www.uni-heidelberg.de/privacypolicy_web.html" target="_blank>privacy policy</a>
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
