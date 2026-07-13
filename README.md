# BRouter Demo

A lightweight static HTML demo for hitting a local **BRouter** server and drawing routes on a Leaflet map.

The demo expects the BRouter HTTP service to be running at:

```text
http://localhost:17777/brouter
```

## Files

- `brouter-demo.html` — route-builder demo UI
- `tile-cache-sw.js` — service worker that caches app files and map tiles that have actually been viewed
- `NOTES.md` — detailed source-build setup log and troubleshooting notes from the local BRouter install
- `BRouter-Setup.md` — older release-zip setup notes

## Prerequisites

- Java JDK installed and available on your `PATH`
- `git`
- A browser
- Optional: Docker, if you prefer running BRouter in a container

## Install BRouter Locally

Clone BRouter outside this demo repo:

```sh
git clone https://github.com/abrensch/brouter.git
cd brouter
```

Build BRouter without the Android app. If you do not have `local.properties` with an Android SDK path, BRouter automatically leaves the Android app out of the Gradle build:

```sh
./gradlew clean build
```

Build the runnable server/map-creator JAR:

```sh
./gradlew clean build fatJar
```

The server JAR is written under:

```text
brouter-server/build/libs/
```

## Download Routing Segments

BRouter needs `.rd5` segment files for the geographic area you want to route in. Segment files cover 5-by-5 degree tiles and are named by the south-west corner of the tile.

Examples:

- Routing near `West48/North37` needs `W50_N35.rd5`
- Routing near `East7/North47` needs `E5_N45.rd5`

Download the needed files from:

```text
https://brouter.de/brouter/segments4/
```

Put the downloaded `.rd5` files in the BRouter repo at:

```text
misc/segments4/
```

## Run the BRouter Service

From the BRouter repo, start the local HTTP server:

```sh
./misc/scripts/standalone/server.sh
```

On Windows with Command Prompt:

```bat
misc\scripts\standalone\server.cmd
```

The service should listen on port `17777`.

You can verify it with a browser or `curl`:

```sh
curl "http://localhost:17777/brouter?lonlats=-122.4194,37.7749|-122.4089,37.7831&profile=trekking&alternativeidx=0&format=geojson"
```

If the request fails because no route data is available, confirm that the downloaded `.rd5` segment covers your test coordinates and is in `misc/segments4/`.

## Run with Docker

From the BRouter repo, build the image:

```sh
docker build -t brouter .
```

Download segment files into `misc/segments4/`, then run:

```sh
docker run --rm \
  -v ./misc/segments4:/segments4 \
  -p 17777:17777 \
  --name brouter \
  brouter
```

To use custom routing profiles, mount them at `/profiles2`:

```sh
docker run --rm \
  -v ./misc/segments4:/segments4 \
  -v /path/to/custom/profiles:/profiles2 \
  -p 17777:17777 \
  --name brouter \
  brouter
```

## Run This Demo

1. Start the local BRouter service.
2. Open `brouter-demo.html` in a browser.
3. Click the map to add 2 or more waypoints.
4. Click **Calculate Route**.

If your browser blocks local file requests, serve this directory with a tiny static server:

```sh
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/brouter-demo.html
```

When served over `http://localhost`, the demo registers `tile-cache-sw.js`. It caches the app shell plus Carto basemap tiles that the browser actually requests while you pan and zoom. It does not bulk-download map areas.

For offline map visibility, first open the demo while online and pan/zoom through the places and zoom levels you need. Later, those exact viewed tiles can be served from the browser cache. BRouter routing still needs the matching local `.rd5` files.

## Notes

- The demo expects BRouter at `http://localhost:17777/brouter`.
- This is designed for local development before integrating into the full Trail Viewer app.
