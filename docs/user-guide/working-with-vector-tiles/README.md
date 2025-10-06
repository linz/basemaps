# Working with Vector Tiles

Vector tiles are a modern approach to delivering map data that offers significant advantages over traditional raster tiles. Unlike raster tiles, which are pre-rendered images, vector tiles contain raw geographic data that you can styled dynamically client-side. This means you can customise the colors, labels, and visibility of features without requesting new tiles from the server.

## Why use Vector Tiles?

- **Customization**

  Style your maps on-the-fly - change colors, fonts, and feature visibility.

- **Flexibility**

  Rotate maps and apply custom styles without server requests.

- **Performance**

  Smaller file sizes compared to raster tiles at equivalent quality.

- **Scalability**

  Vector tiles scale infinitely without pixelation, making them perfect for high-resolution displays.

## Which LINZ Basemaps' use Vector Tiles?

We have two sets of vector tiles, each defined by a different tile matrix: one in [NZTM2000Quad], and one in [WebMercatorQuad]. For each set, we have three vector basemaps based on the same underlying data, but styled differently using separate stylesheets:

[NZTM2000Quad]: https://epsg.io/2193
[WebMercatorQuad]: https://epsg.io/3857

|        [Labels]        |        [Topolite]        |        [Topographic]        |
| :--------------------: | :----------------------: | :-------------------------: |
| ![](static/labels.png) | ![](static/topolite.png) | ![](static/topographic.png) |

[Labels]: https://basemaps.linz.govt.nz/?style=labels-v2
[Topolite]: https://basemaps.linz.govt.nz/?style=topolite-v2
[Topographic]: https://basemaps.linz.govt.nz/?style=topographic-v2

We have three guides for working with vector tiles:

- [How to **Use** our Vector Tiles][3]
- [How to **Style** our Vector Tiles][2]
- [How we **Create** our Vector Tiles][1]

[1]: creation/README.md
[2]: styling/README.md
[3]: usage/README.md
