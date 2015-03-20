/*This document contains the templates for database migration*/

// log to production db: 
heroku config | grep MONGOLAB_URI 
// to extract the url: mongodb://<user>:<password>0@<instance>, and login
mongo <instance> -u <user> -p <password>


// Change tax type for a whole category
db.products.find({'category': {$all: ['Baby Bath, Hair & Skin']}}).count();
db.products.update({'category': {$all: ['Baby Bath, Hair & Skin']}}, {$set: {isHighTax: true}}, {multi:true});

// Change category name
db.products.find({'category.0': 'Health'}).count();
db.products.update({'category.0': 'Health'}, {$set: {'category.0': 'Vitamins'}}, {multi:true});

// remove by id
db.products.remove({_id: ObjectId("5508090d2f5d1b030000000c")});

// shopping list aggregation
db.orders.aggregate([{$match: {status:'active'}}, {$unwind: '$items'}, {$group: {_id: '$items.product', orderItems: {$push:  {orderName: '$name', price: '$items.price', number: '$items.number', itemId: '$items._id', orderId: '$_id'}}}}]);

// list all shopping list products
db.orders.aggregate([{$match: {status:'active'}}, {$unwind: '$items'}, {$group: {_id: '$items.product'}}]);

// caculate sales info
db.orders.aggregate([{$match: {status:'active'}}, {$unwind: '$items'}, {$group: {_id: '$items.product', orderedActive: {$sum: '$item.number'}}}]);
db.orders.aggregate([{$unwind: '$items'}, {$group: {_id: '$items.product', orderedTotal: {$sum: '$item.number'}}}]);
db.purchases.aggregate([{$group: {_id: '$product', inStock: {$sum: '$quantityInStock'}}}]);

// delete product (make sure that they don't have salesInfo)
db.products.find({name: 'Sukin Rose Hip Oil 50ml'}).pretty();
db.products.remove({name: 'Sukin Rose Hip Oil 50ml'});

// delete product store 
db.products.find({name: 'Sukin Certified Organic Rose Hip Oil 25ml'}).pretty();
db.products.update({name: 'Sukin Certified Organic Rose Hip Oil 25ml'}, {$pull: {stores: {storeName: 'PO'}}});