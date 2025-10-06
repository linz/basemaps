# Developer guide

Documentation of the Basemaps codebase for developers

- [How to run `basemaps` locally](./run-basemaps-locally.md)
- Contributing guidelines
- TypeDoc API docs

## Creating and updating docs

The best way to run the docs locally is to use the same container as the CI process

To start the container in a local dev mode which creates a server on [http://localhost:8000](http://localhost:8000)

```bash
docker run --rm \
    -v $PWD:/docs \
    -p 8000:8000 \
    ghcr.io/linz/basemaps-mkdocs:v1 serve \
    -a 0.0.0.0:8000
```

As it is run inside of a container the additional `-a` to allow external connections to access it.
