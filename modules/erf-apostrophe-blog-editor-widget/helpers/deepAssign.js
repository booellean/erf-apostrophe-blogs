const setObject = (obj, objChangeFunc, type, id, emitter) => {
    if(obj instanceof Array) {
        for(var i = 0; i < obj.length; i++) {
            obj[i] = setObject(obj[i], objChangeFunc, type, id, emitter);
        }
    }
    else
    {
        if(obj.type === type && obj.fileId === id){
            obj = objChangeFunc(obj, emitter)
        }else if(obj.components && obj.components.length){
            obj.components = setObject(obj.components, objChangeFunc, type, id, emitter)
        }

    }
    return obj;
}

module.exports = setObject;
