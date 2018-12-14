'use strict';

const os = require('os');
const ifaces = os.networkInterfaces();
const nodeWifi = require('node-wifi');
const mongoose = require('mongoose');
const dateTime = require('node-datetime');

let device = '';

Object.keys(ifaces).forEach((ifname) => {
  if (ifname === 'en0' || ifname === 'wlan0') {
    console.log(device);
    device = ifname;
  }
});

const Schema = mongoose.Schema;

/**
 * Connects to preexisting MongoDb Hotspot
 */
mongoose.connect('mongodb://localhost/Hotspot', { useNewUrlParser: true }).catch(err => { throw new err });

/**
 * Validates and creates consistent connection to MongoDb
 */
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

/**
 * Creates MongoDb Schema
 */
const hotspotSchema = new Schema({
  name: String,
  bssid: String,
  mac: String,
  channel: Number,
  frequency: Number,
  signal_level: Number,
  security: String,
  security_flags: String,
  createdAt: String
});

/**
 * Uses {hotspotSchema} to create a collection for wlan data to be stored
 *
 * @type {Model}
 */
const Hotspot = mongoose.model('Hotspot', hotspotSchema);

/**
 * Async function that scans the local available wireless networks on interface specified
 * these are sent to mongoDb if they do not already exist
 *
 * @returns {Promise<void>}
 */
nodeWifi.init({ iface: device });
async function wifiScan() {
  return await nodeWifi.scan((err, networks) => {
    if (err) throw new err;
    for (let network in networks) {
      const dt = dateTime.create();
      const timeNow = dt.format('Y-m-d H:M:S');
      Hotspot.collection.countDocuments({name: networks[network].ssid}, ((err, count) => {
        if (count === 1 || count <= 1) {
          let hotspot = new Hotspot({
            name: networks[network].ssid,
            bssid: networks[network].bssid,
            mac: networks[network].mac,
            channel: networks[network].channel,
            frequency: networks[network].frequency,
            signal_level: networks[network].signal_level,
            security: networks[network].security,
            security_flags: networks[network].security_flags,
            createdAt: timeNow
          });
          hotspot.save((err, hotspot) => {
            console.log(`${hotspot.name} saved - ${hotspot.security}`)
          });
        }
      }));
    }
  });
}

/**
 * Updates database with latest hotspots
 */
wifiScan().catch((err => { console.error(err, 'Critical Error')}));

// testing reaver
const reaver = spawn('reaver', '-i', device, '-b', mongoose.get(Hotspot.collection.findById(id, {name: 'Microwave802.11'}, {select: 'bssid'}, function(err, callback) { console.log(`error: ${err} \n callback: ${callback}`)})));

console.log(reaver);

// DC from mongo
mongoose.disconnect();
