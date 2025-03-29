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
    function emaFilter(config) {
        RED.nodes.createNode(this, config);
        this.on('input', (msg, send, done) => {
            const safeDivisionUnit = 1e-10;
            const contextParams = { prev: 'prev', step: 'step' };
            const nodeContext = this.context();
            const context = {};
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
            let length = Number(getValue('length', 0, config, null, msg));
            let prev = Number(getValue(contextParams.prev, 0, null, context, msg));
            let step = Number(getValue(contextParams.step, 0, null, context, null));
            const alpha = 2 / (length + 1);
            let ouptut = step >= length ? entry * alpha + prev * (1 - alpha) : entry;
            step++;
            nodeContext.set(contextParams.prev, ouptut);
            nodeContext.set(contextParams.step, step);
            msg.payload = ouptut;
            send(msg);
            done();
        });
        this.on('close', () => { for (let e of Object.values(context)) this.context().set(e, null); });
    }
    RED.nodes.registerType('ema-filter', emaFilter);
}
