# checktor.github.io

## Getting started

### Run local development server

```bash
npm ci
npx ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

### Run Docker container

```bash
sudo docker compose up -d
```

As soon as the container is successfully started, application is reachable via `http://localhost:4200/`. Changes in source code require a container rebuild with `sudo docker compose up -d --build`.

### Run unit tests

```bash
npm ci
npx ng test
```

### Run build

```bash
npm ci
npx ng build
```

Resulting build artifacts can be found in `./dist/app` folder.
