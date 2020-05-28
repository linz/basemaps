# Provider Configuration utility

This tool is designed to configure the basemaps provider information. Provider information is used when a user requests a `WMTSCapabilities.xml` file

The entire history of the provider is stored inside the metadata database and version tags are used to configure what is supplied to the user.

Common tags:

-   `head` - The most recent provider information
-   `production` - The provider information which is supplied by default to the user

## Info

To retrieve information about the provider,

_This by default will show the current version_

To see a specific version use `-v :versionNumber`

```
./provider info -v 0

Title: Land Information New Zealand
CreatedAt: 1970-01-01T00:00:00.000Z
UpdatedAt: 2020-05-15T00:24:15.834Z
Version: v0
Content:{
  serviceProvider: {...},
  serviceIdentification: {...}
}
```

## Log

To see a history of changes for the provider as well as what version each tag is assigned to

```
./provider log

Title: Land Information New Zealand
CreatedAt: 1970-01-01T00:00:00.000Z
UpdatedAt: 2020-05-15T00:33:35.572Z
Version: v1
Content:{...}
History:
v   	CreatedAt                               	Tags
v1  	1970-01-01T00:00:00.000Z                	head
v0  	1970-01-01T00:00:00.000Z                	production
```

## Tag

To change the version a tag is using

```
# Update tag production to v3

./provider tag -t production -v 3 --commit
```

## Updating

The update command can be used to change the provider information supplied to the user, each time the `--commit` is used a new version is created and the `head` tag is updated to point at it. `--source` supplies the path to a JSON file that contains the fields to change or, for the first time, add.

```
./provider update --source path/to/provider.json --commit

```

To cause the production data to be updated the `production` tag will need to be set to the new version after the version is validated.

## Provider format
```typescript
interface TileMetadataProviderRecord {
    serviceIdentification: {
        title: string;
        description: string;
        fees: string;
        accessConstraints: string;
    };
    serviceProvider: {
        name: string;
        site: string;
        contact: {
            individualName: string;
            position: string;
            phone: string;
            address: {
                deliveryPoint: string;
                city: string;
                postalCode: string;
                country: string;
                email: string;
            };
        };
    };
}
```
