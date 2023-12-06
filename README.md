# Netlify Plugin - MaxMind GeoIP CSV Extractor

A Netlify plugin that processes and compresses GeoIP databases for enhanced precision in geolocations, outputting optimized JSON files for Netlify geolocation functions.


## Install
* `npm install netlify-plugin-maxmind-geoip-csv -S`

Add it to your `netlify.toml` file.  

```toml

[[plugins]]

package = "netlify-plugin-maxmind-geoip-csv"
  
# All inputs are optional, so you can omit this section.

# Defaults are shown below.

[plugins.inputs]

  - name: 
    required: false
    description: Number of kilometer threshold
  - name: filterPattern
    required: false
    description: An optional Regex pattern to filter zip or postal codes
  - name: ipv4OutputFile
    required: false
    description: Specifies where the ipv4 entries should be saved
  - name: ipv6OutputFile
    required: false
    description: Specifies where the ipv6 entries should be saved

# Number of kilometer or less threshold to be extracted

precision = 10

# An optional Regex pattern to filter zip or postal codes

filterPattern = ""

# Specifies where the ipv4 entries should be saved

ipv4OutputFile = ""

# Specifies where the ipv6 entries should be saved 
ipv6OutputFile = ""

```


## Setup

First add credentials to a .env file, which you won't commit. If you track this in your file, and especially if the site is open source, you will leak your admin API key. Add your MaxMind License Key

```
// DEVELOPING: .env.development
// BUILDING: .env.production

MAXMIND_KEY=XXX
```
