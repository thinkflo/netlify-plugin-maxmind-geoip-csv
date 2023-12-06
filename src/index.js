/* 
  GeoIP DB Downloader
  Author: Hal Wong - hal@pixelpusher.ca

  This prebuild script downloads and unzips GeoIP Databases
  and filters for high precision, Canadian entries.
  
  These are compiled into 2 json files that are stored in the 
  netlify/functions/geoip directory for consumption 
  by the geolocation edge function
  
  
  First we loop through the entire GeoIP database and filter out only entries that match the first 
  three digits of a valid Canadian Postal Code.  
  
  On found Canadian entries, we process both halves to store it in a compressed manner. 

  CSV schema assumptions:

  row[0] is an ip subnet mask:                                192.168.1.0/24
  row[6] is a three digit Canadian Postal Code in uppercase:  M5H
  row[7] is latitude format to 4 decimals:                    43.1234
  row[8] is longitute format to 4 decimals as a negative:     -123.4567
  row[9] is a number ranging from 20 to 1000:                 1000 
*/

import fs from 'fs'
import AdmZip from 'adm-zip'

const zooms = {
  '10': 12,
  '5': 13
}
const octets = {}
const groups = {}

export const onPreBuild = async ({inputs}) => {
  const { 
    precision = 10,
    filterPattern = "",
    ipv4OutputFile = 'ipv4.json',
    ipv6OutputFile = 'ipv6.json'
  } = inputs

  const pattern = new RegExp(filterPattern);

  console.log("Downloading MaxMind GeoIP CSV")
  return await fetch(`https://download.maxmind.com/app/geoip_download?edition_id=GeoIP2-City-North-America-CSV&license_key=${process.env.MAXMIND_KEY}&suffix=zip`)
  .then(res => res.arrayBuffer())
  .then(arrayBuffer => Buffer.from(arrayBuffer))
  .then(body => {
    const zip = new AdmZip(body);
    const zipEntries = zip.getEntries();

    zipEntries.forEach(async (entry) => {
      switch(true) {
        case /GeoIP2-City-North-America-Blocks-IPv4[.]csv/.test(entry.entryName):
          console.log("Begin Extracting MaxMind GeoIP CSV - IPv4");
          zip.readAsText(entry).split("\n").map(currentRow => {
            const row = currentRow.split(",");
            
            if (row[6] && row[6].match(pattern) && row[9] && JSON.parse(row[9]) <= precision) {
              if (!octets[Number(row[0].split(".").slice(0,1))]?.length) {
                octets[Number(row[0].split(".").slice(0,1))] = []
              }
              octets[Number(row[0].split(".").slice(0,1))].push([row[0],row[6],Number(row[7]),Number(row[8]),zooms[row[9]]]);
            }
          });
          console.log("Completed Extracting MaxMind GeoIP CSV - IPv4");
          console.log("Writing IPv4 file");
          console.log(`${ipv4OutputFile}`, octets.length);
          fs.writeFileSync(`${ipv4OutputFile}`, JSON.stringify(octets));
        break;
        case /GeoIP2-City-North-America-Blocks-IPv6[.]csv/.test(entry.entryName):
          console.log("Begin Extracting MaxMind GeoIP CSV - IPv6");
          zip.readAsText(entry).split("\n").map(currentRow => {
            const row = currentRow.split(",");
            if (row[6] && row[6].match(pattern) && Number(row[0].split(":").slice(0,1)) && row[9] && JSON.parse(row[9]) <= precision) {
              if (!groups[Number(row[0].split(":").slice(0,1))]?.length) {
                groups[Number(row[0].split(":").slice(0,1))] = []
              }
              groups[Number(row[0].split(":").slice(0,1))].push([row[0],row[6],Number(row[7]),Number(row[8]),zooms[row[9]]]);
            }
          });
          console.log("Completed Extracting MaxMind GeoIP CSV - IPv6");
          console.log("Writing IPv6 file");
          fs.writeFileSync(`${ipv6OutputFile}`, JSON.stringify(groups));
        break; 
      }
    })  
  })
  .catch((err) => console.error(err))
}
   