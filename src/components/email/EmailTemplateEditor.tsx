'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Eye, Code, Save, Send, Copy, Trash2, Edit, Image,
  Type, Layout, Palette, Settings, Monitor, Smartphone
} from 'lucide-react'

interface EmailTemplate {
  _id: string
  name: string
  description: string
  category: 'welcome' | 'marketing' | 'transactional' | 'newsletter' | 'abandoned_cart'
  subject: string
  preheader: string
  htmlContent: string
  textContent: string
  variables: { [key: string]: string }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface TemplateBlock {
  type: 'header' | 'text' | 'image' | 'button' | 'footer' | 'spacer'
  content: any
  id: string
}

export default function EmailTemplateEditor({
  template,
  onSave,
  onClose
}: {
  template?: EmailTemplate
  onSave: (template: Partial<EmailTemplate>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState<Partial<EmailTemplate>>({
    name: '',
    description: '',
    category: 'marketing',
    subject: '',
    preheader: '',
    htmlContent: '',
    textContent: '',
    variables: {},
    isActive: true,
    ...template
  })

  const [blocks, setBlocks] = useState<TemplateBlock[]>([])
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [activeTab, setActiveTab] = useState('design')

  useEffect(() => {
    if (template?.htmlContent) {
      // Parse existing HTML content into blocks (simplified)
      parseHtmlToBlocks(template.htmlContent)
    }
  }, [template])

  const parseHtmlToBlocks = (html: string) => {
    // Simplified parser - in real app, use a proper HTML parser
    const mockBlocks: TemplateBlock[] = [
      {
        id: '1',
        type: 'header',
        content: {
          title: 'Welcome to UI8',
          subtitle: 'Your design journey starts here',
          backgroundColor: '#1f2937',
          textColor: '#ffffff'
        }
      },
      {
        id: '2',
        type: 'text',
        content: {
          text: 'Thank you for joining our community of designers and creators.',
          fontSize: 16,
          textAlign: 'left',
          padding: { top: 20, bottom: 20, left: 24, right: 24 }
        }
      },
      {
        id: '3',
        type: 'button',
        content: {
          text: 'Get Started',
          href: 'https://ui8.net/browse',
          backgroundColor: '#3b82f6',
          textColor: '#ffffff',
          borderRadius: 8,
          padding: { top: 12, bottom: 12, left: 24, right: 24 }
        }
      }
    ]
    setBlocks(mockBlocks)
  }

  const addBlock = (type: TemplateBlock['type']) => {
    const newBlock: TemplateBlock = {
      id: Date.now().toString(),
      type,
      content: getDefaultBlockContent(type)
    }
    setBlocks([...blocks, newBlock])
  }

  const getDefaultBlockContent = (type: TemplateBlock['type']) => {
    switch (type) {
      case 'header':
        return {
          title: 'Header Title',
          subtitle: 'Header subtitle',
          backgroundColor: '#1f2937',
          textColor: '#ffffff'
        }
      case 'text':
        return {
          text: 'Enter your text here...',
          fontSize: 16,
          textAlign: 'left',
          padding: { top: 20, bottom: 20, left: 24, right: 24 }
        }
      case 'image':
        return {
          src: '',
          alt: 'Image',
          width: '100%',
          padding: { top: 20, bottom: 20, left: 24, right: 24 }
        }
      case 'button':
        return {
          text: 'Click Here',
          href: '#',
          backgroundColor: '#3b82f6',
          textColor: '#ffffff',
          borderRadius: 8,
          padding: { top: 12, bottom: 12, left: 24, right: 24 }
        }
      case 'footer':
        return {
          text: '© 2024 UI8. All rights reserved.',
          backgroundColor: '#f3f4f6',
          textColor: '#6b7280',
          padding: { top: 24, bottom: 24, left: 24, right: 24 }
        }
      case 'spacer':
        return {
          height: 20
        }
      default:
        return {}
    }
  }

  const updateBlock = (blockId: string, content: any) => {
    setBlocks(blocks.map(block =>
      block.id === blockId ? { ...block, content } : block
    ))
  }

  const deleteBlock = (blockId: string) => {
    setBlocks(blocks.filter(block => block.id !== blockId))
    setSelectedBlock(null)
  }

  const generateHtml = () => {
    // Generate HTML from blocks
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${formData.subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
    `

    blocks.forEach(block => {
      switch (block.type) {
        case 'header':
          html += `
            <tr>
              <td style="background-color: ${block.content.backgroundColor}; color: ${block.content.textColor}; padding: 40px 24px; text-align: center;">
                <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: bold;">${block.content.title}</h1>
                <p style="margin: 0; font-size: 16px; opacity: 0.9;">${block.content.subtitle}</p>
              </td>
            </tr>
          `
          break
        case 'text':
          html += `
            <tr>
              <td style="padding: ${block.content.padding.top}px ${block.content.padding.right}px ${block.content.padding.bottom}px ${block.content.padding.left}px;">
                <p style="margin: 0; font-size: ${block.content.fontSize}px; text-align: ${block.content.textAlign};">${block.content.text}</p>
              </td>
            </tr>
          `
          break
        case 'button':
          html += `
            <tr>
              <td style="padding: 20px; text-align: center;">
                <a href="${block.content.href}" style="display: inline-block; background-color: ${block.content.backgroundColor}; color: ${block.content.textColor}; text-decoration: none; padding: ${block.content.padding.top}px ${block.content.padding.right}px ${block.content.padding.bottom}px ${block.content.padding.left}px; border-radius: ${block.content.borderRadius}px; font-weight: bold;">
                  ${block.content.text}
                </a>
              </td>
            </tr>
          `
          break
        case 'image':
          html += `
            <tr>
              <td style="padding: ${block.content.padding.top}px ${block.content.padding.right}px ${block.content.padding.bottom}px ${block.content.padding.left}px;">
                <img src="${block.content.src}" alt="${block.content.alt}" style="width: ${block.content.width}; height: auto; display: block;" />
              </td>
            </tr>
          `
          break
        case 'footer':
          html += `
            <tr>
              <td style="background-color: ${block.content.backgroundColor}; color: ${block.content.textColor}; padding: ${block.content.padding.top}px ${block.content.padding.right}px ${block.content.padding.bottom}px ${block.content.padding.left}px; text-align: center; font-size: 14px;">
                ${block.content.text}
              </td>
            </tr>
          `
          break
        case 'spacer':
          html += `
            <tr>
              <td style="height: ${block.content.height}px; line-height: ${block.content.height}px;">&nbsp;</td>
            </tr>
          `
          break
      }
    })

    html += `
        </table>
      </body>
      </html>
    `

    return html
  }

  const handleSave = () => {
    const htmlContent = generateHtml()
    onSave({
      ...formData,
      htmlContent,
      textContent: blocks.map(block => {
        if (block.type === 'text') return block.content.text
        if (block.type === 'header') return `${block.content.title}\n${block.content.subtitle}`
        if (block.type === 'button') return block.content.text
        return ''
      }).join('\n\n')
    })
  }

  const BlockEditor = ({ block }: { block: TemplateBlock }) => {
    switch (block.type) {
      case 'header':
        return (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={block.content.title}
                onChange={(e) => updateBlock(block.id, { ...block.content, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input
                value={block.content.subtitle}
                onChange={(e) => updateBlock(block.id, { ...block.content, subtitle: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Background Color</Label>
                <Input
                  type="color"
                  value={block.content.backgroundColor}
                  onChange={(e) => updateBlock(block.id, { ...block.content, backgroundColor: e.target.value })}
                />
              </div>
              <div>
                <Label>Text Color</Label>
                <Input
                  type="color"
                  value={block.content.textColor}
                  onChange={(e) => updateBlock(block.id, { ...block.content, textColor: e.target.value })}
                />
              </div>
            </div>
          </div>
        )
      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <Label>Content</Label>
              <Textarea
                value={block.content.text}
                onChange={(e) => updateBlock(block.id, { ...block.content, text: e.target.value })}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Font Size</Label>
                <Input
                  type="number"
                  value={block.content.fontSize}
                  onChange={(e) => updateBlock(block.id, { ...block.content, fontSize: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Text Align</Label>
                <Select
                  value={block.content.textAlign}
                  onValueChange={(value) => updateBlock(block.id, { ...block.content, textAlign: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )
      case 'button':
        return (
          <div className="space-y-4">
            <div>
              <Label>Button Text</Label>
              <Input
                value={block.content.text}
                onChange={(e) => updateBlock(block.id, { ...block.content, text: e.target.value })}
              />
            </div>
            <div>
              <Label>Link URL</Label>
              <Input
                value={block.content.href}
                onChange={(e) => updateBlock(block.id, { ...block.content, href: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Background Color</Label>
                <Input
                  type="color"
                  value={block.content.backgroundColor}
                  onChange={(e) => updateBlock(block.id, { ...block.content, backgroundColor: e.target.value })}
                />
              </div>
              <div>
                <Label>Text Color</Label>
                <Input
                  type="color"
                  value={block.content.textColor}
                  onChange={(e) => updateBlock(block.id, { ...block.content, textColor: e.target.value })}
                />
              </div>
            </div>
          </div>
        )
      default:
        return <div>Block editor not implemented for this type</div>
    }
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">
            {template ? 'Edit Template' : 'Create Template'}
          </h2>
          <p className="text-sm text-gray-600">
            Design responsive email templates with drag & drop
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 border-r flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="design" className="flex-1 p-4 space-y-4">
              {/* Add Blocks */}
              <div>
                <h3 className="font-semibold mb-3">Add Blocks</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addBlock('header')}
                    className="flex flex-col h-16"
                  >
                    <Layout className="w-4 h-4 mb-1" />
                    Header
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addBlock('text')}
                    className="flex flex-col h-16"
                  >
                    <Type className="w-4 h-4 mb-1" />
                    Text
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addBlock('image')}
                    className="flex flex-col h-16"
                  >
                    <Image className="w-4 h-4 mb-1" />
                    Image
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addBlock('button')}
                    className="flex flex-col h-16"
                  >
                    <Palette className="w-4 h-4 mb-1" />
                    Button
                  </Button>
                </div>
              </div>

              {/* Block Editor */}
              {selectedBlock && (
                <div>
                  <h3 className="font-semibold mb-3">Edit Block</h3>
                  <Card>
                    <CardContent className="p-4">
                      {blocks.find(b => b.id === selectedBlock) && (
                        <BlockEditor block={blocks.find(b => b.id === selectedBlock)!} />
                      )}
                      <div className="mt-4 pt-4 border-t">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteBlock(selectedBlock)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Block
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="flex-1 p-4 space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Template Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter template name"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Template description"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="transactional">Transactional</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                      <SelectItem value="abandoned_cart">Abandoned Cart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Email Subject</Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Email subject line"
                  />
                </div>
                <div>
                  <Label>Preheader Text</Label>
                  <Input
                    value={formData.preheader}
                    onChange={(e) => setFormData({ ...formData, preheader: e.target.value })}
                    placeholder="Preview text that appears after subject"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 p-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Preview</h3>
                  <div className="flex gap-2">
                    <Button
                      variant={previewMode === 'desktop' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewMode('desktop')}
                    >
                      <Monitor className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={previewMode === 'mobile' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewMode('mobile')}
                    >
                      <Smartphone className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <div
                    className={`bg-white transition-all duration-300 ${
                      previewMode === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
                    }`}
                  >
                    <div dangerouslySetInnerHTML={{ __html: generateHtml() }} />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Content - Visual Editor */}
        <div className="flex-1 p-6 bg-gray-50">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              {/* Email Header */}
              <div className="bg-gray-100 p-4 border-b">
                <div className="text-sm text-gray-600">
                  <strong>Subject:</strong> {formData.subject || 'No subject'}
                </div>
                {formData.preheader && (
                  <div className="text-xs text-gray-500 mt-1">
                    {formData.preheader}
                  </div>
                )}
              </div>

              {/* Email Body */}
              <div className="relative">
                {blocks.map((block, index) => (
                  <div
                    key={block.id}
                    className={`relative group cursor-pointer ${
                      selectedBlock === block.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedBlock(block.id)}
                  >
                    {/* Block Content */}
                    <div className="pointer-events-none">
                      {block.type === 'header' && (
                        <div
                          style={{
                            backgroundColor: block.content.backgroundColor,
                            color: block.content.textColor,
                            padding: '40px 24px',
                            textAlign: 'center'
                          }}
                        >
                          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 'bold' }}>
                            {block.content.title}
                          </h1>
                          <p style={{ margin: '0', fontSize: '16px', opacity: 0.9 }}>
                            {block.content.subtitle}
                          </p>
                        </div>
                      )}
                      {block.type === 'text' && (
                        <div style={{
                          padding: `${block.content.padding.top}px ${block.content.padding.right}px ${block.content.padding.bottom}px ${block.content.padding.left}px`
                        }}>
                          <p style={{
                            margin: '0',
                            fontSize: `${block.content.fontSize}px`,
                            textAlign: block.content.textAlign
                          }}>
                            {block.content.text}
                          </p>
                        </div>
                      )}
                      {block.type === 'button' && (
                        <div style={{ padding: '20px', textAlign: 'center' }}>
                          <a
                            href={block.content.href}
                            style={{
                              display: 'inline-block',
                              backgroundColor: block.content.backgroundColor,
                              color: block.content.textColor,
                              textDecoration: 'none',
                              padding: `${block.content.padding.top}px ${block.content.padding.right}px ${block.content.padding.bottom}px ${block.content.padding.left}px`,
                              borderRadius: `${block.content.borderRadius}px`,
                              fontWeight: 'bold'
                            }}
                          >
                            {block.content.text}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Block Controls */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedBlock(block.id)
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteBlock(block.id)
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {blocks.length === 0 && (
                  <div className="p-12 text-center text-gray-500">
                    <Layout className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Start Building Your Email</h3>
                    <p className="mb-4">Add blocks from the sidebar to create your email template.</p>
                    <Button onClick={() => addBlock('header')}>
                      Add Header Block
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
