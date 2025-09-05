import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './sanity/schemas'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!

export default defineConfig({
  name: 'godot-tekko-marketplace',
  title: 'Godot Tekko Marketplace',
  projectId,
  dataset,
  plugins: [structureTool(), visionTool()],
  basePath: '/studio',
  schema: {
    types: schemaTypes as any,
  },
})
