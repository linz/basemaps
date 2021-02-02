# Basemaps Configuration utility

This tool is designed to configure the basemaps rendering engine priority.

### Tile Sets

To render a basemap, a collection of imagery needs to be configured, basemaps uses a 'TileSet' for this configuration.

A tile set is a list of imagery along with the zoom levels to render at and the priority for rendering. The higher the number, the later the imagery will be layered onto the canvas. So bigger number means it will be on top when viewed.

The entire history of the tile set is stored inside the metadata database and version tags are used to configure what is rendered to the user

Common tags:

-   `head` - The most recent tile set configuration
-   `production` - The tile set configuration which is rendered by default to the user

## Info

To retrieve information about a tile set,

_This by default will show the current version_

To see a specific version use `-v :versionNumber`

```
./basemaps info -n aerial -p 3857

TileSet: aerial
CreatedAt: Wed Apr 29 2020 12:32:46 GMT+1200 (New Zealand Standard Time)
UpdatedAt: Wed Apr 29 2020 12:48:20 GMT+1200 (New Zealand Standard Time)
Version: v3 (3)
Imagery:
#   	Id                            	Name                                    	Zoom
1   	im_01DYE4EGR92TNMV16AHXSR45JH	gebco                                   	0 -> 15
2   	im_01E4PN40AEH10EH128AG28YSDM	new_zealand_sentinel_2018-19_10m        	0 -> 32
3   	im_01E3N4FQ7CKMS59BHBFY5RS0PN	northland_rural_2014-16_0-4m            	13 -> 32
4   	im_01E3NFVEFRE332V08RP2YBNQSX	west-coast_rural_2015-16_0-3m           	13 -> 32
...
```

## Log

To see a history of changes for a tile set as well as what version each tag is assigned to

```
./basemaps log -n aerial -p 3857

TileSet: aerial
CreatedAt: Wed Apr 29 2020 12:32:46 GMT+1200 (New Zealand Standard Time)
UpdatedAt: Wed Apr 29 2020 12:48:20 GMT+1200 (New Zealand Standard Time)
Version: v3 (3)
History:
v   	CreatedAt                               	Tags
v3  	2020-04-29T00:32:46.514Z                	head
v2  	2020-04-29T00:32:46.514Z
v1  	2020-04-29T00:32:46.514Z
v0  	2020-04-29T00:32:46.514Z                	production
...
```

## Export

The metadata database can be exported to a JSON file for a specific name and projection that match the state of a tag. Its format is simplified for easier updating by hand any changes that are needed. Defaults can be supplied via `--defaults` which further simplifies the output; defaults are included in the output.

```sh
# Create config for current state of production tag for aerial/3857
./basemaps export -n aerial -p 3857 -t production --defaults path/to/defaults-config.json -o path/to/imagery-config.json
```

### Defaults config

A Defaults config format is an array of values for `priority`, `minZoom` and `maxZoom`. A default is applied if the image name contains the text in the `nameContains` field or there is no `nameContains` field.

```json
[
  {
    "nameContains": "_urban_",
    "priority": 3000, "minZoom": 14
  },
  {
    "nameContains": "_rural_",
    "priority": 2000, "minZoom": 13
  },
  {
    "priority": 1000, "minZoom": 0, "maxZoom": 32
  }
]
```

## Import

The metadata database can be reconfigured using a config file like the one created from export (above). Only the changes needed to reconcile the metadata database to match the config file for a given tag will be made. It will also invalidate the relevant paths in cloudfront.

```sh
# Reconcile config with the current state of production tag
./basemaps import -t production -c path/to/imagery-config.json --commit
```

## Tag

To change the version a tag is using

```sh
# Update tag production to v3

./basemaps tag -n aerial -p 3857 -t production -v 3 --commit
```

## Updating

The update command can be used to configure the rendering of a tile set, each time the `--commit` is used a new version is created and the `head` tag is updated to point at it.

```sh
# Make gebco priority 2
./basemaps update -n aerial -p 3857 -i im_01DYE4EGR92TNMV16AHXSR45JH --priority 2 --commit

# Remove gebco from rendering
./basemaps update -n aerial -p 3857 -i im_01DYE4EGR92TNMV16AHXSR45JH --priority -1 --commit

# Change zoom levels gebco is rendered at
./basemaps update -n aerial -p 3857 -i im_01DYE4EGR92TNMV16AHXSR45JH --max-zoom 5 --min-zoom 2 --commit
```

To cause the production rendering to be updated the `production` tag will need to be set to the new version after the version is validated.

## Invalidating

Sometimes it is useful to force a full rerender on a tileset, this can be achieved by invalidating the basemaps's caches

```sh
# Destroy basemaps projection aerial imagery cache for projection 3857
./basemaps invalidate --tileset-name aerial --projection 3857 --tag production --commit

# Destroy the cache for a configuration pull request tag
./basemaps invalidate --tileset-name aerial --projection 3857 --tag pr-16 --commit
```