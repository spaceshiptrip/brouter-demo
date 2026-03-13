
# BRouter Local Setup (Mac / Linux)

This guide installs **BRouter** locally and verifies that routing works.
It is intended for development with the **Trail Viewer route builder**.

BRouter is an **offline OpenStreetMap routing engine** that can return routes in **GeoJSON** or **GPX**.

---

# 1. Install Java

BRouter requires Java.

The recommended method is **SDKMAN** (keeps Java separate from system tools).

## Install SDKMAN

```bash
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"
```

Verify:

```bash
sdk version
```

## Install Java

```bash
sdk install java 17.0.10-tem
sdk default java 17.0.10-tem
```

Verify:

```bash
java -version
```

Expected output:

```
openjdk version "17.x"
```

---

# 2. Download BRouter

Create a workspace folder:

```bash
mkdir -p ~/Workspaces/brouter
cd ~/Workspaces/brouter
```

Download the latest release:

```bash
curl -L https://github.com/abrensch/brouter/releases/download/v1.7.8/brouter-1.7.8.zip -o brouter.zip
```

Extract:

```bash
unzip brouter.zip
cd brouter-1.7.8
```

You should now see:

```
brouter-1.7.8-all.jar
profiles2/
lib/
```

---

# 3. Download Routing Data (Segments)

BRouter uses **5×5 degree tiles** derived from OpenStreetMap.

Create the segment folder:

```bash
mkdir segments4
cd segments4
```

Download the tiles needed for **Southern California**:

```bash
curl -C - -O https://brouter.de/brouter/segments4/W120_N30.rd5
curl -C - -O https://brouter.de/brouter/segments4/W120_N35.rd5
```

Return to root folder:

```bash
cd ..
```

Verify tiles:

```bash
ls -lh segments4
```

Example:

```
W120_N30.rd5
W120_N35.rd5
```

---

# 4. Start the BRouter HTTP Server

Create a custom profile folder:

```bash
mkdir customprofiles
```

Run the server:

```bash
java -Xmx128M -Xms128M -Xmn8M -DmaxRunningTime=300 -DuseRFCMimeType=false \
  -cp brouter-1.7.8-all.jar \
  btools.server.RouteServer \
  segments4 profiles2 customprofiles 17777 1
```

You should see:

```
BRouter 1.7.8
```

The server now listens on:

```
http://localhost:17777
```

---

# 5. Test the Router

Open a new terminal and run:

```bash
curl "http://localhost:17777/brouter?lonlats=-118.2437,34.0522|-118.15,34.20&profile=trekking&format=geojson"
```

If successful, you will receive **GeoJSON route data** containing coordinates.

Example response snippet:

```
{
  "type": "FeatureCollection",
  "features": [...]
}
```

---

# 6. Save Route as GeoJSON

You can save the route output:

```bash
curl -s "http://localhost:17777/brouter?lonlats=-118.2437,34.0522|-118.15,34.20&profile=trekking&format=geojson" -o route.geojson
```

This file can be loaded directly into mapping applications.

---

# 7. Optional Shell Alias

Add this to `~/.zshrc`:

```bash
alias brouter='cd ~/Workspaces/brouter/brouter-1.7.8 && \
java -Xmx128M -Xms128M -Xmn8M -DmaxRunningTime=300 -DuseRFCMimeType=false \
-cp brouter-1.7.8-all.jar \
btools.server.RouteServer \
segments4 profiles2 customprofiles 17777 1'
```

Reload shell:

```bash
source ~/.zshrc
```

Start BRouter with:

```bash
brouter
```

---

# 8. Example API Request

BRouter requests follow this pattern:

```
/brouter?lonlats=<lon,lat>|<lon,lat>&profile=<profile>&format=<format>
```

Example:

```
http://localhost:17777/brouter?lonlats=-118.2437,34.0522|-118.15,34.20&profile=trekking&format=geojson
```

Parameters:

| Parameter | Description                          |
| --------- | ------------------------------------ |
| `lonlats` | Start and end coordinates            |
| `profile` | Routing profile (trekking, mtb, etc) |
| `format`  | Output format (`geojson`, `gpx`)     |

---

# 9. Useful Profiles

Available in `profiles2/`:

```
trekking
hiking-mountain
mtb
fastbike
shortest
```

For hiking routes:

```
profile=trekking
```

---

# 10. Directory Layout

Final structure:

```
Workspaces/
  brouter/
    brouter-1.7.8/
      brouter-1.7.8-all.jar
      profiles2/
      segments4/
        W120_N30.rd5
        W120_N35.rd5
      customprofiles/
```

---

# 11. Stopping the Server

Press:

```
CTRL+C
```

---

# Notes

* BRouter runs entirely **offline** once segment files are downloaded.
* More tiles can be downloaded from:

```
https://brouter.de/brouter/segments4/
```

* Only download tiles covering your routing area.

---

# Related

* BRouter project:
  https://github.com/abrensch/brouter

* Example web client:
  http://brouter.de/brouter-web/

---
