const { Receiver } = require('sacn');
const _ = require('lodash');

let currentState = {};

const sACN = new Receiver({
  universes: [1],
});

const processState = _.throttle(() => {

    console.log("Updated value received..");
    console.log(currentState);

    // Various light states
    // 0 or N/A - Off State
    // 1-10% - Purple
    // 10-20% - Red
    // 20-30% - Orange
    // 30-40% - White  

    if(_.has(currentState, '1')) {

        if(currentState['1'] > 0 && currentState['1'] < 10) {
            // Turn on.
            console.log("Turning light on");
            
        }

    } else {
        // Turn bulb off
        console.log('Turning light off');
        
    }


}, 1000);
 
sACN.on('packet', (packet) => {

    if(!_.isEqual(currentState, packet.payload)) {
        currentState = packet.payload;
        processState();
    }

});

console.log('Listening for sACN data..');

