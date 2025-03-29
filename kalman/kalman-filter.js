function getValue(name, def, config = null, context = null, msg = null) {
    const checkConfig = config === null ? false : true, checkContext = context === null ? false : true, checkMsg = msg === null ? false : true;
    let target = def;
    if (checkConfig) {
        let configTarget = config[name];
        target = configTarget != null && configTarget != undefined ? configTarget : target;
    }
    if (checkContext) {
        let contextTarget = context[name];
        target = contextTarget != null && contextTarget != undefined ? contextTarget : target;
    }
    if (checkMsg) {
        let msgTarget = msg[name];
        target = msgTarget != null && msgTarget != undefined ? msgTarget : target;
    }
    return target;
}

module.exports = (RED) => {
    function kalmanFilter(config) {
        RED.nodes.createNode(this, config)
        this.on('input', (msg, send, done) => {
            const safeDivisionUnit = 1e-10;
            const contextParams = { eEst: 'eEst', lastEstimate: 'lastEstimate' };
            const nodeContext = this.context();
            const context = {}
            for (let e of nodeContext.keys()) context[e] = nodeContext.get(e);
            let clearCache = getValue('clearCache', 'false', null, null, msg) === 'false' ? false : true;
            if (clearCache) {
                for (let e of Object.values(context)) nodeContext.set(e, null);
                msg.payload = 0;
                send(msg);
                done();
                return;
            }
            let entry = Number(getValue('payload', 0, null, null, msg));
            let eMea = Number(getValue('eMea', 0, config, null, msg));
            let eEst = Number(getValue(contextParams.eEst, 0, config, context, msg));
            let q = Number(getValue('q', 0, config, null, msg));
            let lastEstimate = Number(getValue(contextParams.lastEstimate, 0, null, context, msg));
            let kalmanGain = eEst / (eEst + eMea + safeDivisionUnit);
            let currentEstimate = lastEstimate + kalmanGain * (entry - lastEstimate);
            eEst = (1 - kalmanGain) * eEst + Math.abs(lastEstimate - currentEstimate) * q;
            lastEstimate = currentEstimate;
            nodeContext.set(contextParams.eEst, eEst);
            nodeContext.set(contextParams.lastEstimate, lastEstimate);
            msg.payload = currentEstimate;
            send(msg);
            done();
        });
        this.on('close', () => { for (let e of Object.values(context)) this.context().set(e, null); });
    }
    RED.nodes.registerType('kalman-filter', kalmanFilter);
}
