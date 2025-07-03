# About Vector Tiles

Vector tiles are a modern approach to delivering map data that offers significant advantages over traditional raster tiles. Unlike raster tiles which are pre-rendered images, vector tiles contain raw geographic data that can be styled dynamically on the client side. This means you can customize colors, labels, and visibility of features without requesting new tiles from the server.

## Why Use Vector Tiles?

- **Scalability**: Vector tiles scale infinitely without pixelation, making them perfect for high-resolution displays
- **Customization**: Style your maps on-the-fly - change colors, fonts, and feature visibility
- **Performance**: Smaller file sizes compared to raster tiles at equivalent quality
- **Flexibility**: Rotate maps, switch between light/dark modes, and apply custom styles without server requests

## Which LINZ Basemaps Maps Use Vector Tiles?
- [Topographic](https://basemaps.linz.govt.nz/?style=topographic-v2)
- [Topolite](https://basemaps.linz.govt.nz/?style=topolite-v2)
- [Labels](https://basemaps.linz.govt.nz/?style=labels-v2)

Note: All these 3 maps use the same tileset, but have different styles which change the way they look.

- [How to use vector tiles][1]
- [How to customize vector tiles][2]

[1]: _How-to-use-vector-tiles/README.md
[2]: how-to-customize-vector-tiles/README.md