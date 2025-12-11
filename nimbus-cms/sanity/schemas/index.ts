import article from "./__cms/article";
import category from "./__cms/category";
import quiz from "./__cms/quiz";
import author from "./__cms/author";
import faqItem from "./__cms/faqItem";
import legalDoc from "./__cms/legalPage";
import deal from "./__cms/deal";
import promo from "./__cms/promo";
import transparencyPage from "./__cms/transparencyPage";
import accessibilityPage from "./__cms/accessibilityPage";
import awardsExplainer from "./__cms/awardsExplainer";
import product from "./__admin/product";
import productType from "./__admin/productType";
import banner from "./__admin/banner";
import drop from "./__admin/drop";
import store from "./__admin/store";
import organization from "./__admin/organization";
import brand from "./__admin/brand";
import variantInventory from "./__admin/variantInventory";
import complianceSnapshot from "./__admin/complianceSnapshot";
import complianceMonitor from "./__admin/complianceMonitor";
import recallAudit from "./__admin/recallAudit";
import personalizationRule from "./__admin/personalizationRule";

export const schemaTypes = [
  article,
  category,
  quiz,
  author,
  faqItem,
  // tenant-aware CMS types
  organization,
  brand,
  legalDoc,
  deal,
  promo,
  transparencyPage,
  accessibilityPage,
  awardsExplainer,
  product,
  productType,
  banner,
  drop,
  store,
  variantInventory,
  complianceSnapshot,
  complianceMonitor,
  recallAudit,
  personalizationRule,
];
