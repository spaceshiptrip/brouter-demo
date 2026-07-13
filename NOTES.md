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

