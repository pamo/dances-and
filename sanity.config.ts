'use client'

/**
 * This configuration is used to for the Sanity Studio that's mounted on the `/app/studio/[[...tool]]/page.tsx` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {apiVersion, dataset, projectId} from './src/sanity/env'
import {schema} from './src/sanity/schemaTypes'
import {structure} from './src/sanity/structure'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  schema,
  plugins: [
    structureTool({structure}),
    visionTool({defaultApiVersion: apiVersion}),
  ],
  document: {
    actions: (prev, {schemaType, getClient}) => {
      if (schemaType !== 'show') return prev

      return prev.map((action) => {
        if (action.action !== 'publish') return action

        return (props) => {
          const originalAction = action(props)
          if (!originalAction) return null
          return {
            ...originalAction,
            label: originalAction.label ?? action.action ?? 'Untitled',
            onHandle: async () => {
              const doc = props.draft || props.published
              if (!doc) return originalAction.onHandle?.()

              const client = getClient({apiVersion})
              const patches: Record<string, unknown> = {}

              // Auto-generate title if missing
              if (!doc.title && doc.artist && doc.venue) {
                const [artist, venue] = await Promise.all([
                  client.fetch(`*[_id == $id][0].name`, {
                    id: (doc.artist as {_ref: string})._ref,
                  }),
                  client.fetch(`*[_id == $id][0].name`, {
                    id: (doc.venue as {_ref: string})._ref,
                  }),
                ])
                if (artist && venue) {
                  patches.title = `${artist} at ${venue}`
                }
              }

              // Auto-generate slug if missing
              if (!doc.slug?.current && doc.date) {
                const title =
                  (patches.title as string) || (doc.title as string) || ''
                const artistName = title.includes(' at ')
                  ? title.split(' at ')[0]
                  : title
                if (artistName) {
                  patches.slug = {
                    _type: 'slug',
                    current: slugify(`${doc.date}-${artistName}`),
                  }
                }
              }

              // Apply patches to draft before publish
              if (Object.keys(patches).length > 0) {
                const draftId = `drafts.${doc._id.replace('drafts.', '')}`
                await client.patch(draftId).set(patches).commit()
              }

              return originalAction.onHandle?.()
            },
          }
        }
      })
    },
  },
})
