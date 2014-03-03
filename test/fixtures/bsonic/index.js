var types = require('bson').native(),
  BSON = types.BSON,
  encode, decode, bson;


bson = new BSON('Long ObjectID Binary Code DBRef Symbol Double Timestamp MaxKey MinKey'.split(' ').map(function(t){
  return types[t];
}));

module.exports.encode = function(doc){
  return bson.serialize(doc, true, true);
};
module.exports.decode = function(buf){
  return bson.deserialize(buf, true, true);
};
