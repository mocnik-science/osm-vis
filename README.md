# OSMvis - OpenStreetMap Visualization

OSMvis is a collection of visualizations related to [OpenStreetMap (OSM)](http://www.openstreetmap.org), in particular the OSM database, the OSM wiki, and the use of OSM data in general. OSMvis aims at exploring the generation, modification, and use of OSM by the methods of information visualization.

## Website

A running version of OSMvis can be found on:

* **[http://osm-vis.geog.uni-heidelberg.de](http://osm-vis.geog.uni-heidelberg.de)**, and
* **[http://projects.mocnik-science.net/osm-vis/](http://projects.mocnik-science.net/osm-vis/)**.

## Data

The data that is visualized can either be mined as described in the following section, or by downloading it from the following repository:

[http://github.com/mocnik-science/osm-vis-data](http://github.com/mocnik-science/osm-vis-data)

## Installation

The repository contains all source code to generate a directory containing only static files to be uploaded to a web server. Please run the following steps to generate this directory:

1. Install the [Haskell Platform](https://www.haskell.org/platform/)
2. Install [Node.js](https://nodejs.org)
3. Install the dependencies using Node.js:
```shell
npm install
```
4. Download and build all datasets needed for the visualizations. Follow the instructions giving in each subdirectory of contained in [`data-mining/`](https://github.com/mocnik-science/osm-vis/tree/master/visualizations)
5. Generate the directory `www-dist`:
```shell
npm run dist
```

The directory `www-dist` inside your repository should now contain all html, css, and js files, as well as the data, used for the visualizations. Upload them to any server you like. Enjoy exploring OSM visualizations!

## Installation automatic data mining

see [documentation of automated data mining](docs/automatic_data_mining.md)

## Acknowledgements

The author would like to thank the following persons for providing useful comments: Michael Auer, Chiao-Ling Kuo, Lukas Loos, Martin Raifer, Alexander Zipf.

## Author

This application is written and maintained by Franz-Benjamin Mocnik, <mail@mocnik-science.net>. Conbributions were made by Martin Raifer.

(c) by Franz-Benjamin Mocnik, 2016.

The code is licensed under the [GPL-3](http://github.com/mocnik-science/osm-vis/blob/master/LICENSE.md).
