/*This document contains the templates for database migration*/

// Change tax type for a whole category
db.products.find({'category': {$all: ['Baby Bath, Hair & Skin']}}).count();
db.products.update({'category': {$all: ['Baby Bath, Hair & Skin']}}, {$set: {isHighTax: true}}, {multi:true});

// Change category name
db.products.find({'category.0': 'Health'}).count();
db.products.update({'category.0': 'Health'}, {$set: {'category.0': 'Vitamins'}}, {multi:true});