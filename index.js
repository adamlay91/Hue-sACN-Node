const { Receiver } = require('sacn');
const _ = require('lodash');
const v3 = require('node-hue-api').v3,
  discovery = v3.discovery,
  hueApi = v3.api,
  LightState = v3.lightStates.LightState;

const config = {
    /* Your Hue bridge IP address */
    bridgeIp: '192.168.1.39',
    /* Your Hue bridge username */
    bridgeUsername: 'WIb3s1wiZRx2yw-Axgt7gWp48n5uy7sBJPXWboh2',
    /* Patch your hue bulbs to DMX addresses */
    lights: [
                {hueId: 23, dmxAddress: 1},
                {hueId: 24, dmxAddress: 7},
                {hueId: 25, dmxAddress: 13},
            ],
    /* Throttle to one request per x milliseconds to
    not overwhelm the Hue bridge */
    throttle: 250,
}



const sACN = new Receiver({
  universes: [1],
});

// Connect to the bridge
const connectToBridge = async () => {

    // Create a new API instance that is authenticated with the new user we created
    const bridge = await hueApi.createLocal(config.bridgeIp).connect(config.bridgeUsername);

    let currentState = {};
    const processState = _.throttle(() => {

    /** Hue Fixture Profile
     * 
     * Ch 1: Brightness
     * Ch 2: Red
     * Ch 3: Green
     * Ch 4: Blue
     * Ch 5: Transition Time 0-5s
     * Ch 6: Macros
     */
    
    config.lights.forEach(async (light, index) =>{

        // If we have anything for brightness or macros
        if(_.has(currentState, light.dmxAddress) || _.has(currentState, light.dmxAddress + 5)) {
            
            // If we are not running a macro
            if(!_.has(currentState, light.dmxAddress + 5)) {

                // Get the transition time
                const transitionValue = currentState[light.dmxAddress + 4] || 0;
                const transitionTimeFromValue = Math.round(transitionValue) * 50;

                // Create a new Light State
                const updatedLightState = new LightState();

                // Get the color data
                const rgb = [
                    Math.round((currentState[light.dmxAddress + 1] || 0)*255/100),
                    Math.round((currentState[light.dmxAddress + 2] || 0)*255/100),
                    Math.round((currentState[light.dmxAddress + 3] || 0)*255/100),
                ];

                // Set the values from DMX channels
                updatedLightState
                .on()
                .effect('none')
                .brightness(currentState[light.dmxAddress])
                // .sat(254)
                .rgb(rgb)
                .transition(transitionTimeFromValue)

                // Make the call

                // Do something with the authenticated user/api
                bridge.lights.setLightState(light.hueId, updatedLightState);

            } else {
                // Handle macros.
            }
                    
        
        } else {

            // Get the transition time
            const transitionValue = currentState[light.dmxAddress + 4] || 0;
            const transitionTimeFromValue = Math.round(transitionValue) * 50;

            const offLightState = new LightState();

            // Turn the light off
            offLightState
                .off()
                .transition(transitionTimeFromValue)

            bridge.lights.setLightState(light.hueId, offLightState);

        }

    });

}, config.throttle);

sACN.on('packet', (packet) => {

    if(!_.isEqual(currentState, packet.payload)) {
        currentState = packet.payload;
        processState();
    }

});

};

connectToBridge();

console.log('Listening for sACN data..');