It's simple script to download and convert [IP2Location Lite](https://lite.ip2location.com/) database to MaxMind format. What can be used in [OPNsense](https://docs.opnsense.org/manual/how-tos/maxmind_geo_ip.html).

**Usage:**

You should set `IP2L_TOKEN` enviroment variable with your IP2Location api token. It can be obtained [here](https://lite.ip2location.com/database-download) after free registration.
This script using DB1.LITE database. You can override download url by set `IP2L_URL` variable.

`node ./index.js`

It will generate `ip2l.zip` file in MaxMind format. Output filename can be overridden by setting `IP2L_OUT` variable.
To use this file with OPNsense you should publish it on any webserver and fill the link in Firewall -> Aliases -> GeoIP settings of OPNsense.

For testing and experimental purpose you can use this [link](https://lab.triptrack.net/ip2l.zip)
