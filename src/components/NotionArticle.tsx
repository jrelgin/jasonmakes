// Server Component - no 'use client' directive
import { Render } from '@9gustin/react-notion-render'

// Import default styles from the new renderer
import '@9gustin/react-notion-render/dist/index.css'

// Server component for rendering Notion blocks
export default function NotionArticle({ blocks }: { blocks: any[] }) {
  return (
    <div className="notion-article prose prose-lg max-w-none">
      <Render 
        blocks={blocks}
        useStyles // Use the built-in styles
        classNames // Allow custom class names
        emptyBlocks // Render empty blocks
      />
    </div>
  )
}