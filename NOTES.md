# BRouter Demo Local Setup Notes

These notes document the exact BRouter setup used for this demo on macOS with the demo repo at:

```text
~/Workspaces/pnb/brouter-demo
```

The BRouter source checkout lives next to it at:

```text
~/Workspaces/pnb/brouter
```

The demo calls the local BRouter HTTP service at:

```text
http://localhost:17777/brouter
```

## 1. Git Identity

The local Git identity was configured in the demo repo with:

```sh
git config user.email "4379326+spaceshiptrip@users.noreply.github.com"
git config user.name "spaceshiptrip"
```

Those commands affect only the current repo unless `--global` is used. If you want the same identity in the cloned BRouter repo, run the same commands from inside:

```text
~/Workspaces/pnb/brouter
```

## 2. Clone BRouter

From the parent workspace:

```sh
cd ~/Workspaces/pnb
git clone https://github.com/abrensch/brouter
cd brouter
```

After cloning, `gradlew` exists in the BRouter repo:

```sh
ls -l gradlew
```

The demo repo itself does not have `gradlew`; the Gradle wrapper belongs to the BRouter source checkout.

## 3. Build BRouter

Run the source build from:

```text
~/Workspaces/pnb/brouter
```

Use:

```sh
./gradlew clean build
```

Do not use this command unless you have confirmed the Android app project is included:

```sh
./gradlew clean build -x :brouter-routing-app:build
```

That command failed here with:

```text
Cannot locate excluded tasks that match ':brouter-routing-app:build'
```

Reason: BRouter's `settings.gradle` only includes `:brouter-routing-app` when `local.properties` exists with an Android SDK path:

```groovy
if (file('local.properties').exists()) {
    include ':brouter-routing-app'
}
```

Because no Android SDK config was present, the Android app was automatically left out of the Gradle project graph. The plain build command was the correct command:

```sh
./gradlew clean build
```

The build completed successfully and produced the BRouter server JARs under:

```text
~/Workspaces/pnb/brouter/brouter-server/build/libs/
```

Observed output included:

```text
BUILD SUCCESSFUL
```

The generated server fat JAR was:

```text
brouter-server/build/libs/brouter-1.7.10-beta-all.jar
```

## 4. Segment Directory

BRouter needs OpenStreetMap routing segment files in `.rd5` format. The service can start without them, but route requests fail until the correct tile files are present.

Create the segment directory in the BRouter source checkout:

```sh
cd ~/Workspaces/pnb/brouter
mkdir -p misc/segments4
```

The final path used here was:

```text
~/Workspaces/pnb/brouter/misc/segments4
```

## 5. Start the Local BRouter Service

The standard script is:

```sh
./misc/scripts/standalone/server.sh
```

For this macOS/source-checkout run, the service was started with explicit paths so the script did not have to infer the JAR, segment, profile, or custom profile locations:

```sh
cd ~/Workspaces/pnb/brouter

CLASSPATH=brouter-server/build/libs/brouter-1.7.10-beta-all.jar \
SEGMENTSPATH=misc/segments4 \
PROFILESPATH=misc/profiles2 \
CUSTOMPROFILESPATH=misc/customprofiles \
./misc/scripts/standalone/server.sh
```

Expected startup output:

```text
BRouter 1.7.10-beta
```

The service listens on:

```text
http://127.0.0.1:17777
http://localhost:17777
```

Requesting `/brouter` without route parameters can return `404 Not Found`. That still confirms the HTTP service is alive if the response comes from BRouter.

Stop the service with:

```text
Ctrl+C
```

## 6. Demo Error Encountered

The browser demo showed:

```text
BRouter server reachable
Routing [trekking] 3 pts...
Error: HTTP 400: datafile W120_N30.rd5 not found
```

The clicked waypoints were near:

```text
33.13205, -117.22394
33.13267, -117.22370
33.13140, -117.22393
```

BRouter segment files cover 5-by-5 degree tiles. For longitude `-117.x` and latitude `33.x`, the needed south-west tile is:

```text
W120_N30.rd5
```

That file was missing because `misc/segments4` was empty.

## 7. Download the Missing Segment

Download the required tile into the BRouter segment directory:

```sh
cd ~/Workspaces/pnb/brouter
curl -fL "https://brouter.de/brouter/segments4/W120_N30.rd5" -o misc/segments4/W120_N30.rd5
```

Verify:

```sh
ls -lh misc/segments4
```

Expected result:

```text
W120_N30.rd5
```

The downloaded file was about `50M`.

Download more `.rd5` files from:

```text
https://brouter.de/brouter/segments4/
```

Only download tiles for areas you need. If the browser demo reports another missing `*.rd5` file, download that exact file into `misc/segments4`.

### Cache the Southern California and Mammoth Lakes Route Data

For the places we discussed, use these BRouter `.rd5` files:

```text
W120_N30.rd5
W120_N35.rd5
```

What they cover:

```text
W120_N30.rd5
  longitude -120 to -115
  latitude    30 to   35
  covers Los Angeles, Los Angeles County, San Diego, San Diego County,
  Oceanside, Carlsbad, Palm Springs, Riverside County, nearby San Bernardino
  County areas, and most Southern California routes in that rectangle.

W120_N35.rd5
  longitude -120 to -115
  latitude    35 to   40
  covers Mammoth Lakes and routing north of Southern California in that
  rectangle.
```

Palm Springs is in Riverside County. Some nearby desert/mountain routes can cross into San Bernardino County, but both are still inside `W120_N30.rd5` for this longitude/latitude range.

Run these commands from the BRouter source checkout:

```sh
cd ~/Workspaces/pnb/brouter
mkdir -p misc/segments4
```

Download both files with resume support:

```sh
curl -fL -C - "https://brouter.de/brouter/segments4/W120_N30.rd5" -o misc/segments4/W120_N30.rd5
curl -fL -C - "https://brouter.de/brouter/segments4/W120_N35.rd5" -o misc/segments4/W120_N35.rd5
```

The `-C -` option tells `curl` to resume a partial download if the network drops. This is useful on a slow or unreliable connection.

Verify that the files exist:

```sh
ls -lh misc/segments4
```

Expected result:

```text
W120_N30.rd5
W120_N35.rd5
```

Check file sizes:

```sh
du -h misc/segments4/W120_N30.rd5 misc/segments4/W120_N35.rd5
```

The exact sizes change when BRouter regenerates weekly segment data, but expect files in the tens of megabytes. `W120_N30.rd5` downloaded here at about `50M`.

If BRouter is already running, it is usually simplest to stop and restart it after adding new `.rd5` files:

```text
Ctrl+C
```

Then restart from the BRouter source checkout:

```sh
cd ~/Workspaces/pnb/brouter

CLASSPATH=brouter-server/build/libs/brouter-1.7.10-beta-all.jar \
SEGMENTSPATH=misc/segments4 \
PROFILESPATH=misc/profiles2 \
CUSTOMPROFILESPATH=misc/customprofiles \
./misc/scripts/standalone/server.sh
```

### Test the Cached Route Data

Test San Diego County / Carlsbad / Oceanside area:

```sh
curl -sS --max-time 30 "http://127.0.0.1:17777/brouter?lonlats=-117.22394,33.13205|-117.22370,33.13267|-117.22393,33.13140&profile=trekking&alternativeidx=0&format=geojson"
```

Test Los Angeles area:

```sh
curl -sS --max-time 30 "http://127.0.0.1:17777/brouter?lonlats=-118.2437,34.0522|-118.15,34.20&profile=trekking&alternativeidx=0&format=geojson"
```

Test Mammoth Lakes area:

```sh
curl -sS --max-time 30 "http://127.0.0.1:17777/brouter?lonlats=-118.9721,37.6485|-118.9850,37.6300&profile=trekking&alternativeidx=0&format=geojson"
```

If a request returns GeoJSON with `"type": "FeatureCollection"`, the route data cache is working for that route.

If BRouter returns another error like:

```text
datafile W115_N30.rd5 not found
```

download exactly that file:

```sh
cd ~/Workspaces/pnb/brouter
curl -fL -C - "https://brouter.de/brouter/segments4/W115_N30.rd5" -o misc/segments4/W115_N30.rd5
```

The rule is: trust the filename in BRouter's error. Put that exact `.rd5` file in:

```text
~/Workspaces/pnb/brouter/misc/segments4/
```

### How to Think About `.rd5` Tile Names

BRouter names segment files by the south-west corner of a 5-by-5 degree tile.

Examples:

```text
longitude -117.x, latitude 33.x -> W120_N30.rd5
longitude -118.x, latitude 37.x -> W120_N35.rd5
longitude -114.x, latitude 33.x -> W115_N30.rd5
```

For western longitudes, round down to the next 5-degree west boundary. For northern latitudes, round down to the next 5-degree north boundary.

For example, Carlsbad is around:

```text
longitude -117.22
latitude   33.13
```

That lands in:

```text
longitude -120 to -115
latitude    30 to   35
```

So BRouter needs:

```text
W120_N30.rd5
```

## 8. Verify Routing from the Command Line

With the BRouter service running and `W120_N30.rd5` present, this request verifies the same area used in the browser demo:

```sh
curl -sS --max-time 30 "http://127.0.0.1:17777/brouter?lonlats=-117.22394,33.13205|-117.22370,33.13267|-117.22393,33.13140&profile=trekking&alternativeidx=0&format=geojson"
```

The verified response was GeoJSON and included:

```text
"creator": "BRouter-1.7.10-beta"
"name": "brouter_trekking_0"
"track-length": "243"
```

That confirmed BRouter could route the selected Carlsbad/San Diego County test coordinates after the tile was downloaded.

## 9. Run the Demo

From the demo repo:

```sh
cd ~/Workspaces/pnb/brouter-demo
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000/brouter-demo.html
```

The browser demo can also be opened directly from disk, but serving it locally avoids browser restrictions around local files.

Use the demo:

1. Make sure BRouter is running at `http://localhost:17777/brouter`.
2. Click the map to add at least two waypoints.
3. Click the route button, or press Enter if the page supports it.
4. If the page reports a missing `.rd5` file, download that exact segment into `~/Workspaces/pnb/brouter/misc/segments4`.

## 10. Current Known Good State

The setup was verified with:

```text
BRouter source: ~/Workspaces/pnb/brouter
BRouter version: 1.7.10-beta
Server JAR: brouter-server/build/libs/brouter-1.7.10-beta-all.jar
Segment directory: misc/segments4
Installed segment: W120_N30.rd5
Service URL: http://localhost:17777/brouter
Demo URL: http://localhost:8000/brouter-demo.html
Profile tested: trekking
Output format tested: geojson
```

## 11. Common Problems

### `gradlew` not found

You are probably in the demo repo. Change to the BRouter repo:

```sh
cd ~/Workspaces/pnb/brouter
```

### `Cannot locate excluded tasks that match ':brouter-routing-app:build'`

Use:

```sh
./gradlew clean build
```

The Android app project is not included unless BRouter has `local.properties` with an Android SDK path.

### `datafile W120_N30.rd5 not found`

Download the missing file:

```sh
cd ~/Workspaces/pnb/brouter
curl -fL "https://brouter.de/brouter/segments4/W120_N30.rd5" -o misc/segments4/W120_N30.rd5
```

### BRouter reachable, but route request fails

Check the requested coordinates and the missing tile name in the error. The fix is usually to download the exact `.rd5` tile named by BRouter.

### Port 17777 already in use

Stop the existing BRouter server with `Ctrl+C` in the terminal running it, or find the process using port `17777` and stop it.

## 12. Basemap Tile Cache

The `.rd5` files are only for BRouter routing. They do not provide the visible Leaflet basemap. Without internet, BRouter can still calculate routes from local `.rd5` files, but the map background will be blank unless the visual map tiles have already been cached.

This demo now registers:

```text
tile-cache-sw.js
```

The service worker caches:

```text
local demo HTML files
Leaflet/CSS/font assets after they are requested
Carto basemap raster tiles after they are requested
```

It only caches tiles the browser actually loads while a human pans and zooms the map. It does not pre-download Los Angeles County, San Diego County, Mammoth Lakes, or any other region.

That distinction matters because public OSM tile infrastructure must not be bulk downloaded or used for offline region prefetching. Normal browser-style caching of viewed tiles is acceptable; pre-seeding entire areas or zoom stacks is not.

Use it like this:

```sh
cd ~/Workspaces/pnb/brouter-demo
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000/brouter-demo.html
```

While online, pan and zoom through the areas and zoom levels you care about. Those exact viewed tiles are cached by the service worker. Later, if you are offline, the demo can show tiles that were previously viewed at the same zoom level and tile coordinates.

Important limitations:

```text
Service workers do not run from file:// URLs.
Open the demo from http://localhost:8000, not directly from disk.
Only previously viewed tiles are available offline.
Different zoom levels use different tile images.
Different basemap styles use different tile URLs and separate cached images.
Clearing browser site data removes the cache.
```

Why not IndexedDB directly:

```text
Cross-origin raster tile images are often opaque browser responses.
Opaque image responses are not practical to read into IndexedDB as blobs.
Service Worker Cache Storage is the right API for this case.
```

If true offline regional maps are needed, use a provider that explicitly permits offline caching, self-host raster/vector tiles, or package vector tiles with something like PMTiles/MBTiles.

### What `tile-cache-sw.js` Actually Does

The demo pages register this service worker:

```js
navigator.serviceWorker.register('./tile-cache-sw.js')
```

This only happens when the page is served over HTTP, for example:

```text
http://localhost:8000/brouter-demo.html
```

It will not run when opening the HTML file directly with a `file://` URL.

The service worker watches browser `fetch` requests. When Leaflet asks Carto for a raster tile such as:

```text
https://a.basemaps.cartocdn.com/rastertiles/voyager/12/703/1635.png
```

the service worker:

```text
1. checks the browser Cache Storage for that exact URL
2. returns the cached tile immediately if it exists
3. otherwise fetches it from the network
4. stores the fetched tile in Cache Storage
5. returns the tile to Leaflet
```

That means offline map visibility depends on what you have already looked at. To cache tiles for later use:

```text
1. Start the local demo server.
2. Open the demo while online.
3. Pan to Los Angeles, San Diego, Oceanside, Carlsbad, Palm Springs, Mammoth Lakes, etc.
4. Zoom to the levels you expect to use offline.
5. Wait for the map tiles to finish drawing at each zoom level.
6. Later, when offline, revisit those same places and zoom levels.
```

Each zoom level is different. Seeing Los Angeles at zoom `10` does not cache zoom `14`. If you need street-level detail offline, you must view the area at that street-level zoom while online.

### Inspect or Clear the Browser Tile Cache

In Chrome or Edge:

```text
DevTools -> Application -> Cache Storage
```

Look for caches named like:

```text
brouter-demo-v1-app
brouter-demo-v1-tiles
```

To reset the app and tile cache:

```text
DevTools -> Application -> Storage -> Clear site data
```

Then reload the page while online to rebuild the cache.

### Why This Does Not Bulk Cache Counties

The service worker does not have a list of counties, cities, or bounding boxes. It only sees normal browser requests caused by the visible map viewport.

That keeps the behavior aligned with normal browser caching:

```text
allowed pattern: user views a map tile, browser caches that tile
bad pattern: code loops over all tile x/y/z coordinates for a county and downloads them
```

The second pattern is bulk downloading/pre-seeding. Do not do that against public OSM-derived tile services unless the tile provider explicitly allows it.
