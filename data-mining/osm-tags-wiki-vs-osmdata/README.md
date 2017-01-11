# osm-vis/osm-tags-wiki-vs-osmdata

The tool extracts first occurences of currently [documented](https://wiki.openstreetmap.org/wiki/Map_Features) OSM tags (using [taghistory's API](https://github.com/tyrasd/taghistory#api)) and merges that with the creation dates of the corresponding pages on the OSM wiki.

## Installation

To install the tool, nodejs needs to be installed. Then execute:
```
npm install
```

## Usage

To fetch and process the data, first run the data mining of "osm-tags-history-wiki", then execute:
```
npm start
```

## Author

This application is written and maintained by Martin Raifer, <martin@raifer.tech>.

(c) by Martin Raifer, 2017.

The code is licensed under the [GPL-3](http://github.com/mocnik-science/osm-vis/blob/master/LICENSE.md).
