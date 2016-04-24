var cheerio = require('cheerio');

var stores = {
  'CW': {name:'Chemist Warehouse', priceExtractor: priceFrom('[itemprop=price]') },
  'MC': {name:'My Chemist', priceExtractor: priceFrom('[itemprop=price]') },
  'PL': {name:'Priceline', priceExtractor: priceFrom('[itemprop=price]') },
  'CO': {name:'Coles', priceExtractor: priceFrom('.price') },
  'WW': {name:'Woolworths', priceUrlGenerator: woolworthsPriceUrl, priceExtractor: woolworthsPriceExtractor },
  'TR': {name:'ToysRus', priceExtractor: priceFrom('.prodPrice .price')},
  'BB': {name:'Baby Bunting', priceExtractor: priceFrom('[itemprop=price]') },
  'PO': {name:'Pharmacy online', priceExtractor: priceFrom('.m-price .price')},
  'JJ': {name:'Jack and Jill'},
  'SK': {name:'Sukin'},
};

function extractPrice(text, pattern) {
	var pattern = pattern || /\$([0-9.]+)/;
    var result = text.match(pattern);
    if (result && result.length > 1) {
    	return Number(result[1]);
    }
	return null;
}

function priceFrom(selector) {
  return function(html) {
    return extractPrice(cheerio.load(html)(selector).text().trim());
  };
}

function woolworthsPriceUrl(product) {
  return 'https://www.woolworths.com.au/apis/ui/product/detail/' + product.productId;
}

function woolworthsPriceExtractor(json) {
  return JSON.parse(json).Product.Price;
}

module.exports = {
  stores: stores
};
