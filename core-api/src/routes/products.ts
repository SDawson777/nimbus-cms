import {Router} from 'express'
import {z} from 'zod'
import {prisma} from '../lib/prisma'

export const products = Router()

const listSchema = z.object({
  storeId: z.string(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(24),
  q: z.string().trim().optional(),
  brand: z.union([z.string(), z.array(z.string())]).optional(),
  category: z.union([z.string(), z.array(z.string())]).optional(),
  strain: z.union([z.string(), z.array(z.string())]).optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  thcMin: z.coerce.number().optional(),
  thcMax: z.coerce.number().optional(),
  cbdMin: z.coerce.number().optional(),
  cbdMax: z.coerce.number().optional(),
  inStock: z.coerce.boolean().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'popular', 'name_asc', 'name_desc']).optional(),
})

products.get('/', async (req, res) => {
  const p = listSchema.parse(req.query)
  const skip = (p.page - 1) * p.limit

  // Base filters
  const spWhere: any = {
    storeId: p.storeId,
    active: true,
    store: {isActive: true},
    product: {isActive: true},
  }
  if (p.inStock) spWhere.stock = {gt: 0}
  if (p.priceMin != null || p.priceMax != null) {
    spWhere.price = {
      ...(p.priceMin != null ? {gte: p.priceMin} : {}),
      ...(p.priceMax != null ? {lte: p.priceMax} : {}),
    }
  }

  // Product filters
  const productWhere: any = {}
  if (p.q)
    productWhere.OR = [
      {name: {contains: p.q, mode: 'insensitive'}},
      {brand: {contains: p.q, mode: 'insensitive'}},
    ]
  if (p.brand) {
    const arr = Array.isArray(p.brand) ? p.brand : [p.brand]
    productWhere.brand = {in: arr}
  }
  if (p.category) {
    const arr = Array.isArray(p.category) ? p.category : [p.category]
    productWhere.category = {in: arr as any}
  }
  if (p.strain) {
    const arr = Array.isArray(p.strain) ? p.strain : [p.strain]
    productWhere.strainType = {in: arr as any}
  }

  // Sort
  const orderBy: any[] = []
  switch (p.sort) {
    case 'price_asc':
      orderBy.push({price: 'asc'})
      break
    case 'price_desc':
      orderBy.push({price: 'desc'})
      break
    case 'name_asc':
      orderBy.push({product: {name: 'asc'}})
      break
    case 'name_desc':
      orderBy.push({product: {name: 'desc'}})
      break
    case 'popular':
    default:
      orderBy.push({product: {purchasesLast30d: 'desc'}})
      break
  }

  const where: any = {...spWhere, product: productWhere}

  const rangeFilters: any[] = []
  if (p.thcMin != null || p.thcMax != null) {
    const range = {
      ...(p.thcMin != null ? {gte: p.thcMin} : {}),
      ...(p.thcMax != null ? {lte: p.thcMax} : {}),
    }
    rangeFilters.push({
      OR: [
        {variant: {thcPercent: range}},
        {
          AND: [
            {OR: [{variant: {is: null}}, {variant: {thcPercent: null}}]},
            {OR: [{product: {thcPercent: null}}, {product: {thcPercent: range}}]},
          ],
        },
      ],
    })
  }
  if (p.cbdMin != null || p.cbdMax != null) {
    const range = {
      ...(p.cbdMin != null ? {gte: p.cbdMin} : {}),
      ...(p.cbdMax != null ? {lte: p.cbdMax} : {}),
    }
    rangeFilters.push({
      OR: [
        {variant: {cbdPercent: range}},
        {
          AND: [
            {OR: [{variant: {is: null}}, {variant: {cbdPercent: null}}]},
            {OR: [{product: {cbdPercent: null}}, {product: {cbdPercent: range}}]},
          ],
        },
      ],
    })
  }
  if (rangeFilters.length) where.AND = rangeFilters

  const [count, items] = await Promise.all([
    prisma.storeProduct.count({where}),
    prisma.storeProduct.findMany({
      where,
      include: {product: true, variant: true},
      orderBy,
      skip,
      take: p.limit,
    }),
  ])

  res.json({
    items: items.map((sp) => ({
      storeProductId: sp.id,
      productId: sp.productId,
      variantId: sp.variantId ?? null,
      name: sp.product.name + (sp.variant?.name ? ` — ${sp.variant.name}` : ''),
      brand: sp.product.brand,
      category: sp.product.category,
      strainType: sp.product.strainType,
      slug: sp.product.slug,
      price: sp.price ?? sp.variant?.price ?? sp.product.defaultPrice ?? null,
      stock: sp.stock ?? 0,
      thcPercent: sp.variant?.thcPercent ?? sp.product.thcPercent ?? null,
      cbdPercent: sp.variant?.cbdPercent ?? sp.product.cbdPercent ?? null,
    })),
    page: p.page,
    limit: p.limit,
    total: count,
    totalPages: Math.ceil(count / p.limit),
  })
})

products.get('/:id', async (req, res) => {
  const p = z.object({id: z.string(), storeId: z.string()}).parse({...req.params, ...req.query})
  const product = await prisma.product.findUnique({
    where: {id: p.id},
    include: {variants: {where: {active: true}}},
  })
  if (!product) return res.status(404).json({error: 'NOT_FOUND'})

  const sps = await prisma.storeProduct.findMany({
    where: {storeId: p.storeId, productId: p.id, active: true},
    include: {variant: true},
  })

  const variants = (product.variants.length ? product.variants : [null as any]).map((v) => {
    const sp = sps.find((x) => (v ? x.variantId === v.id : x.variantId == null))
    return {
      variantId: v?.id ?? null,
      name: v?.name ?? null,
      price: sp?.price ?? v?.price ?? product.defaultPrice ?? null,
      stock: sp?.stock ?? 0,
      thcPercent: v?.thcPercent ?? product.thcPercent ?? null,
      cbdPercent: v?.cbdPercent ?? product.cbdPercent ?? null,
      sku: v?.sku ?? null,
    }
  })

  res.json({
    id: product.id,
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    category: product.category,
    strainType: product.strainType,
    description: product.description,
    thcPercent: product.thcPercent,
    cbdPercent: product.cbdPercent,
    variants,
  })
})
