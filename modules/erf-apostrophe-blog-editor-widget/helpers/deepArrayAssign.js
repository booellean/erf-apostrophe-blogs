const deepArrayAssign = (obj, type, arr = []) => {
  if(obj.type === type && obj.fileId){
    arr.push(obj.fileId)
  }else if(obj instanceof Array) {
    for(var i = 0; i < obj.length; i++) {
      deepArrayAssign(obj[i], type, arr)
    }
  }else if(obj.components && obj.components.length > 0){
    deepArrayAssign(obj.components, type, arr) 
  }
  return arr;
}

export default deepArrayAssign;