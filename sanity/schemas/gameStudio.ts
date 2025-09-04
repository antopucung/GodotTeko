import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'gameStudio',
  title: 'Game Development Studio',
  type: 'document',
  icon: () => '🏢',
  fields: [
    defineField({
      name: 'name',
      title: 'Studio Name',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'logo',
      title: 'Studio Logo',
      type: 'image',
      options: {
        hotspot: true
      }
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: {
        hotspot: true
      }
    }),
    defineField({
      name: 'bio',
      title: 'Studio Bio',
      type: 'text',
      rows: 3
    }),
    defineField({
      name: 'description',
      title: 'Detailed Description',
      type: 'array',
      of: [{ type: 'block' }]
    }),
    defineField({
      name: 'foundedYear',
      title: 'Founded Year',
      type: 'number'
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'object',
      fields: [
        { name: 'city', type: 'string', title: 'City' },
        { name: 'country', type: 'string', title: 'Country' },
        { name: 'isRemote', type: 'boolean', title: 'Remote Team', initialValue: false }
      ]
    }),
    defineField({
      name: 'teamSize',
      title: 'Current Team Size',
      type: 'number'
    }),
    defineField({
      name: 'specialties',
      title: 'Specialties',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          'Indie Games', 'Mobile Games', 'VR/AR', 'Web Games',
          'Educational Games', 'Serious Games', 'Art/Narrative',
          'Technical Innovation', 'Game Engines', 'Tools Development',
          'Pixel Art', '3D Art', 'Procedural Generation', 'AI/ML',
          'Multiplayer', 'Real-time Strategy', 'Roguelikes'
        ]
      }
    }),
    defineField({
      name: 'technologies',
      title: 'Primary Technologies',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          'Unity', 'Unreal Engine', 'Godot', 'GameMaker Studio',
          'Construct 3', 'Defold', 'Flutter', 'React Native',
          'C#', 'C++', 'JavaScript', 'Python', 'Rust',
          'Blender', 'Maya', 'Photoshop', 'Aseprite',
          'FMOD', 'Wwise', 'Audacity'
        ]
      }
    }),
    defineField({
      name: 'teamMembers',
      title: 'Team Members',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'name', type: 'string', title: 'Name' },
            { name: 'role', type: 'string', title: 'Role' },
            { name: 'avatar', type: 'image', title: 'Avatar', options: { hotspot: true } },
            { name: 'bio', type: 'text', title: 'Short Bio' },
            { name: 'portfolio', type: 'url', title: 'Portfolio URL' },
            { name: 'twitter', type: 'string', title: 'Twitter Handle' },
            { name: 'isFounder', type: 'boolean', title: 'Founder', initialValue: false },
            { name: 'joinedYear', type: 'number', title: 'Joined Year' }
          ]
        }
      ]
    }),
    defineField({
      name: 'projects',
      title: 'Projects',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'gameProject' }] }]
    }),
    defineField({
      name: 'achievements',
      title: 'Achievements & Awards',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', type: 'string', title: 'Achievement Title' },
            { name: 'year', type: 'number', title: 'Year' },
            { name: 'organization', type: 'string', title: 'Awarding Organization' },
            { name: 'project', type: 'reference', to: [{ type: 'gameProject' }], title: 'Related Project' },
            { name: 'description', type: 'text', title: 'Description' }
          ]
        }
      ]
    }),
    defineField({
      name: 'stats',
      title: 'Studio Statistics',
      type: 'object',
      fields: [
        { name: 'totalProjects', type: 'number', title: 'Total Projects', initialValue: 0 },
        { name: 'releasedProjects', type: 'number', title: 'Released Projects', initialValue: 0 },
        { name: 'totalDownloads', type: 'number', title: 'Total Downloads', initialValue: 0 },
        { name: 'followers', type: 'number', title: 'Followers', initialValue: 0 }
      ]
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'object',
      fields: [
        { name: 'website', type: 'url', title: 'Website' },
        { name: 'twitter', type: 'url', title: 'Twitter/X' },
        { name: 'youtube', type: 'url', title: 'YouTube' },
        { name: 'discord', type: 'url', title: 'Discord' },
        { name: 'github', type: 'url', title: 'GitHub' },
        { name: 'itchIo', type: 'url', title: 'itch.io' },
        { name: 'steam', type: 'url', title: 'Steam Developer Page' },
        { name: 'linkedin', type: 'url', title: 'LinkedIn' }
      ]
    }),
    defineField({
      name: 'isVerified',
      title: 'Verified Studio',
      type: 'boolean',
      initialValue: false,
      description: 'Verified studios have been authenticated by our team'
    }),
    defineField({
      name: 'isActive',
      title: 'Currently Active',
      type: 'boolean',
      initialValue: true
    }),
    defineField({
      name: 'joinedAt',
      title: 'Joined Platform',
      type: 'datetime'
    })
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'location.city',
      media: 'logo',
      teamSize: 'teamSize'
    },
    prepare(selection) {
      const { title, subtitle, media, teamSize } = selection
      return {
        title,
        subtitle: subtitle ? `${subtitle} • ${teamSize || 0} members` : `${teamSize || 0} members`,
        media
      }
    }
  }
})
