import article from './article'
import category from './category'
import quiz from './__cms/quiz'
import author from './__cms/author'
import faqItem from './__cms/faqItem'
import legalDoc from './legalDoc'
import deal from './deal'
import filterGroup from './filterGroup'
import effectTag from './effectTag'
import banner from './banner'
// Removed other legacy imports; focusing on enterprise content types

const schemaTypes = [
  article,
  category,
  // core enterprise CMS types
  legalDoc,
  deal,
  banner,
  filterGroup,
  effectTag,
]

export default schemaTypes
