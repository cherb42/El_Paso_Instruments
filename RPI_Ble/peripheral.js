var util = require('util');

var bleno = require('bleno');
var sensor = require('./bme680Sensor');

var BlenoPrimaryService = bleno.PrimaryService;
var BlenoCharacteristic = bleno.Characteristic;
var BlenoDescriptor = bleno.Descriptor;

console.log('bleno');

var NotifyOnlyCharacteristic = function() {
  NotifyOnlyCharacteristic.super_.call(this, {
    uuid: '3022b821-e6d0-4406-a23d-90334637e350',
    properties: ['notify']
  });
};

util.inherits(NotifyOnlyCharacteristic, BlenoCharacteristic);

NotifyOnlyCharacteristic.prototype.onSubscribe = function(maxValueSize, updateValueCallback) {
  console.log('NotifyOnlyCharacteristic subscribe');
  this.changeInterval = setInterval(function() {
	sensor.measureAll()
	   .then(({gasResistance, humidity, pressure, temperature}) => {		
    		   var data = new Buffer(16);
 		   data.writeUInt32LE(gasResistance, 0);
		   data.writeFloatLE(humidity, 4);
		   //data.writeUInt32LE(pressure,0);
		   data.writeFloatLE(pressure,8);
		   data.writeFloatLE(temperature, 12);

    console.log('NotifyOnlyCharacteristic update value: ' + gasResistance, humidity, pressure, temperature);
    updateValueCallback(data);
	   });
  }.bind(this), 1000);
};

NotifyOnlyCharacteristic.prototype.onUnsubscribe = function() {
  console.log('NotifyOnlyCharacteristic unsubscribe');

  if (this.changeInterval) {
    clearInterval(this.changeInterval);
    this.changeInterval = null;
  }
};

NotifyOnlyCharacteristic.prototype.onNotify = function() {
  console.log('NotifyOnlyCharacteristic on notify');
};


function SampleService() {
  SampleService.super_.call(this, {
    uuid: 'd880e8eb-f203-431e-9901-90b5ef55d4f4',
    characteristics: [
      new NotifyOnlyCharacteristic()
    ]
  });
}

util.inherits(SampleService, BlenoPrimaryService);

bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state + ', address = ' + bleno.address);

  if (state === 'poweredOn') {
    bleno.startAdvertising('test', ['d880e8eb-f203-431e-9901-90b5ef55d4f4']);
  } else {
    bleno.stopAdvertising();
  }
});

// Linux only events /////////////////
bleno.on('accept', function(clientAddress) {
  console.log('on -> accept, client: ' + clientAddress);

  bleno.updateRssi();
});

bleno.on('disconnect', function(clientAddress) {
  console.log('on -> disconnect, client: ' + clientAddress);
});

bleno.on('rssiUpdate', function(rssi) {
  console.log('on -> rssiUpdate: ' + rssi);
});
//////////////////////////////////////

bleno.on('mtuChange', function(mtu) {
  console.log('on -> mtuChange: ' + mtu);
});

bleno.on('advertisingStart', function(error) {
  console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

  if (!error) {
    bleno.setServices([
      new SampleService()
    ]);
  }
});

bleno.on('advertisingStop', function() {
  console.log('on -> advertisingStop');
});

bleno.on('servicesSet', function(error) {
  console.log('on -> servicesSet: ' + (error ? 'error ' + error : 'success'));
});
