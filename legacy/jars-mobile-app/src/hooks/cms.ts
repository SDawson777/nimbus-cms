import {useQuery} from '@tanstack/react-query'
import {cms} from '../lib/cmsClient'

export const useLegal = (
  type: 'terms' | 'privacy' | 'accessibility',
  preview?: {enabled: boolean; secret: string},
) =>
  useQuery({
    queryKey: ['legal', type, preview?.enabled],
    queryFn: () => cms.legal(type, preview),
    staleTime: 24 * 60 * 60 * 1000,
  })

export const useFaqs = (preview?: {enabled: boolean; secret: string}) =>
  useQuery({
    queryKey: ['faqs', preview?.enabled],
    queryFn: () => cms.faqs(preview),
    staleTime: 24 * 60 * 60 * 1000,
  })

export const useFilters = () =>
  useQuery({queryKey: ['filters'], queryFn: () => cms.filters(), staleTime: 12 * 60 * 60 * 1000})

export const useArticles = (
  page = 1,
  limit = 20,
  tag?: string,
  preview?: {enabled: boolean; secret: string},
) =>
  useQuery({
    queryKey: ['articles', {page, limit, tag, preview: preview?.enabled}],
    queryFn: () => cms.articles({page, limit, tag}, preview),
    staleTime: 5 * 60 * 1000,
  })

export const useArticle = (slug: string, preview?: {enabled: boolean; secret: string}) =>
  useQuery({
    queryKey: ['article', slug, preview?.enabled],
    queryFn: () => cms.article(slug, preview),
    staleTime: 5 * 60 * 1000,
    enabled: !!slug,
  })

export const useDeals = (storeId?: string, limit = 20) =>
  useQuery({
    queryKey: ['deals', {storeId, limit}],
    queryFn: () => cms.deals({storeId, limit}),
    staleTime: 5 * 60 * 1000,
  })

export const useAppCopy = (
  context: 'onboarding' | 'emptyStates' | 'awards' | 'accessibility' | 'dataTransparency',
) =>
  useQuery({
    queryKey: ['copy', context],
    queryFn: () => cms.copy(context),
    staleTime: 24 * 60 * 60 * 1000,
  })
