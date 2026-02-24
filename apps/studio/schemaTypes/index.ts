// Canonical Studio schema registry
// Prefer organized schemas under `__cms` and `__admin` to avoid
// duplicate type names. Keep a few top-level utility types here.
import accessibilityPage from "./__cms/accessibilityPage";
import cmsArticle from "./__cms/article";
import author from "./__cms/author";
import awardsExplainer from "./__cms/awardsExplainer";
import category from "./__cms/category";
import contentMetric from "./__cms/contentMetric";
import contentMetricDaily from "./__cms/contentMetricDaily";
import deal from "./__cms/deal";
import faqItem from "./__cms/faqItem";
import legalDoc from "./__cms/legalPage";
import loyaltyReward from "./__cms/loyaltyReward";
import loyaltyRule from "./__cms/loyaltyRule";
import loyaltyTier from "./__cms/loyaltyTier";
import promo from "./__cms/promo";
import quiz from "./__cms/quiz";
import heroFooter from "./__cms/heroFooter";
import themeConfig from "./__cms/themeConfig";
import transparencyPage from "./__cms/transparencyPage";
import wayToShop from "./__cms/wayToShop";
import whiteLabelConfig from "./__cms/whiteLabelConfig";

import analyticsSettings from "./__admin/analyticsSettings";
import adminBanner from "./__admin/banner";
import brand from "./__admin/brand";
import complianceMonitor from "./__admin/complianceMonitor";
import complianceSnapshot from "./__admin/complianceSnapshot";
import drop from "./__admin/drop";
import homeHeroSettings from "./__admin/homeHeroSettings";
import organization from "./__admin/organization";
import personalizationRule from "./__admin/personalizationRule";
import product from "./__admin/product";
import productType from "./__admin/productType";
import recallAudit from "./__admin/recallAudit";
import rewardsConfig from "./__admin/rewardsConfig";
import store from "./__admin/store";
import variantInventory from "./__admin/variantInventory";

// top-level utility/object schemas
import filterGroup from "./filterGroup";
import effectTag from "./effectTag";

const schemaTypes = [
  // CMS content types
  accessibilityPage,
  cmsArticle,
  author,
  awardsExplainer,
  category,
  contentMetric,
  contentMetricDaily,
  deal,
  faqItem,
  heroFooter,
  legalDoc,
  loyaltyReward,
  loyaltyRule,
  loyaltyTier,
  promo,
  quiz,
  themeConfig,
  transparencyPage,
  wayToShop,
  whiteLabelConfig,

  // Admin / control-plane types
  analyticsSettings,
  adminBanner,
  brand,
  complianceMonitor,
  complianceSnapshot,
  drop,
  homeHeroSettings,
  organization,
  personalizationRule,
  product,
  productType,
  recallAudit,
  rewardsConfig,
  store,
  variantInventory,

  // Shared objects
  filterGroup,
  effectTag,
];

export default schemaTypes;
