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
    function medianFilter(config) {
        RED.nodes.createNode(this, config);
        this.on('input', (msg, send, done) => {
            const safeDivisionUnit = 1e-10;
            const contextParams = { buffer: 'buffer', count: 'count' };
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
            let size = Number(getValue('size', 0, config, null, msg));
            let count = Number(getValue(contextParams.count, 0, null, context, msg));
            let buffer = getValue(contextParams.buffer, [], null, context, msg);
            if (buffer.length !== size) {
                buffer = [];
                for (let i = 0; i < size; i++) buffer[i] = 0;
            }
            buffer[count] = entry;
            if ((count < size - 1) && (buffer[count] > buffer[count + 1])) {
                for (let i = count; i < size - 1; i++) {
                    if (buffer[i] > buffer[i + 1]) {
                        const temp = buffer[i];
                        buffer[i] = buffer[i + 1];
                        buffer[i + 1] = temp;
                    }
                }
            } else {
                if ((count > 0) && (buffer[count - 1] > buffer[count])) {
                    for (let i = count; i > 0; i--) {
                        if (buffer[i] < buffer[i - 1]) {
                            const temp = buffer[i];
                            buffer[i] = buffer[i - 1];
                            buffer[i - 1] = temp;
                        }
                    }
                }
            }
            count++;
            if (count >= size) count = 0;
            let output =  buffer[Math.floor(size / 2)];
            nodeContext.set(contextParams.buffer, buffer);
            nodeContext.set(contextParams.count, count);
            msg.payload = output;
            send(msg);
            done();
        });
        this.on('close', () => { for (let e of Object.values(context)) this.context().set(e, null); });
    }
    RED.nodes.registerType('median-filter', medianFilter);
}

