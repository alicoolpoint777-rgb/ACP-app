// Shared image resolver for Services and Products

export const SERVICE_IMAGES = {
  repair: require('../../assets/products/split_ac.jpg'),
  install: require('../../assets/products/ceiling_icon.jpg'),
  maintenance: require('../../assets/products/pm_icon.jpg'),
  hvac: require('../../assets/products/hvac_icon.jpg'),
  preventive: require('../../assets/products/electric_icon.jpg'),
  amc: require('../../assets/products/amc_icon.jpg'),
  renovation: require('../../assets/products/reno_icon.jpg'),
  ceiling: require('../../assets/products/false_ceiling.jpg'),
  electrical: require('../../assets/products/electric_icon.jpg'),
  default: require('../../assets/products/split_ac.jpg'),
};

export const PRODUCT_IMAGES = {
  split: require('../../assets/products/split_ac.jpg'),
  cassette: require('../../assets/products/cassette_ac.jpg'),
  floor: require('../../assets/products/floor_ac.jpg'),
  standing: require('../../assets/products/floor_ac.jpg'),
  window: require('../../assets/products/split_ac.jpg'),
  default: require('../../assets/products/split_ac.jpg'),
};

export function getServiceImage(service) {
  if (!service) return SERVICE_IMAGES.default;
  if (service.imageUrl && service.imageUrl.startsWith('http')) {
    return { uri: service.imageUrl };
  }
  const name = (service.name || service.title || '').toLowerCase();
  if (name.includes('repair')) return SERVICE_IMAGES.repair;
  if (name.includes('install')) return SERVICE_IMAGES.install;
  if (name.includes('preventive')) return SERVICE_IMAGES.preventive;
  if (name.includes('maintenance')) return SERVICE_IMAGES.maintenance;
  if (name.includes('hvac')) return SERVICE_IMAGES.hvac;
  if (name.includes('amc') || name.includes('annual')) return SERVICE_IMAGES.amc;
  if (name.includes('reno')) return SERVICE_IMAGES.renovation;
  if (name.includes('ceiling')) return SERVICE_IMAGES.ceiling;
  if (name.includes('electr')) return SERVICE_IMAGES.electrical;
  return SERVICE_IMAGES.default;
}

export function getProductImage(product) {
  if (!product) return PRODUCT_IMAGES.default;
  if (product.imageUrl && product.imageUrl.startsWith('http')) {
    return { uri: product.imageUrl };
  }
  const str = `${product.title || ''} ${product.name || ''} ${product.category || ''} ${product.description || ''}`.toLowerCase();
  if (str.includes('cassette')) return PRODUCT_IMAGES.cassette;
  if (str.includes('floor') || str.includes('standing') || str.includes('stand')) return PRODUCT_IMAGES.floor;
  if (str.includes('window')) return PRODUCT_IMAGES.window;
  if (str.includes('split')) return PRODUCT_IMAGES.split;
  return PRODUCT_IMAGES.default;
}
