import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'analyticsSettings',
  type: 'document',
  title: 'Analytics Settings',
  fields: [
    defineField({name: 'orgSlug', title: 'Organization Slug', type: 'string'}),
    defineField({
      name: 'windowDays',
      title: 'Historic window (days)',
      type: 'number',
      initialValue: 30,
    }),
    defineField({
      name: 'recentDays',
      title: 'Recent window (days)',
      type: 'number',
      initialValue: 7,
    }),
    defineField({
      name: 'wRecentClicks',
      title: 'Weight recent clicks',
      type: 'number',
      initialValue: 2.5,
    }),
    defineField({
      name: 'wRecentViews',
      title: 'Weight recent views',
      type: 'number',
      initialValue: 0.2,
    }),
    defineField({
      name: 'wHistoricClicks',
      title: 'Weight historic clicks',
      type: 'number',
      initialValue: 1,
    }),
    defineField({
      name: 'wHistoricViews',
      title: 'Weight historic views',
      type: 'number',
      initialValue: 0.05,
    }),
    defineField({
      name: 'thresholdRising',
      title: 'Threshold: rising',
      type: 'number',
      initialValue: 200,
    }),
    defineField({
      name: 'thresholdSteady',
      title: 'Threshold: steady',
      type: 'number',
      initialValue: 40,
    }),
    defineField({
      name: 'thresholdFalling',
      title: 'Threshold: falling',
      type: 'number',
      initialValue: 10,
    }),
  ],
  preview: {select: {title: 'orgSlug'}},
})
