import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import { 
  Bold, Italic, Underline as UnderlineIcon, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Undo, Redo,
  Type, Palette, Highlighter
} from 'lucide-react';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  bgColor?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const fonts = [
    { name: 'Default', value: 'Inter' },
    { name: 'Serif', value: 'Merriweather, serif' },
    { name: 'Mono', value: 'JetBrains Mono, monospace' },
    { name: 'Comic', value: 'Comic Sans MS, Comic Sans' },
  ];

  const colors = [
    { name: 'White', value: '#ffffff' },
    { name: 'Gray', value: '#94a3b8' },
    { name: 'Red', value: '#f87171' },
    { name: 'Orange', value: '#fb923c' },
    { name: 'Yellow', value: '#facc15' },
    { name: 'Green', value: '#4ade80' },
    { name: 'Blue', value: '#60a5fa' },
    { name: 'Purple', value: '#c084fc' },
    { name: 'Pink', value: '#f472b6' },
  ];

  const highlightColors = [
    { name: 'Yellow', value: '#fef08a' },
    { name: 'Green', value: '#bbf7d0' },
    { name: 'Blue', value: '#bfdbfe' },
    { name: 'Pink', value: '#fbcfe8' },
    { name: 'Purple', value: '#e9d5ff' },
    { name: 'None', value: 'transparent' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-white/10 bg-[#121118] sticky top-0 z-10">
      <div className="flex items-center gap-1 pr-2 border-r border-white/10">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-white/5 transition-colors ${editor.isActive('bold') ? 'text-primary bg-primary/10' : 'text-gray-400'}`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-white/5 transition-colors ${editor.isActive('italic') ? 'text-primary bg-primary/10' : 'text-gray-400'}`}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded hover:bg-white/5 transition-colors ${editor.isActive('underline') ? 'text-primary bg-primary/10' : 'text-gray-400'}`}
          title="Underline"
        >
          <UnderlineIcon size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1 px-2 border-r border-white/10">
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-1.5 rounded hover:bg-white/5 transition-colors ${editor.isActive({ textAlign: 'left' }) ? 'text-primary bg-primary/10' : 'text-gray-400'}`}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-1.5 rounded hover:bg-white/5 transition-colors ${editor.isActive({ textAlign: 'center' }) ? 'text-primary bg-primary/10' : 'text-gray-400'}`}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-1.5 rounded hover:bg-white/5 transition-colors ${editor.isActive({ textAlign: 'right' }) ? 'text-primary bg-primary/10' : 'text-gray-400'}`}
          title="Align Right"
        >
          <AlignRight size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`p-1.5 rounded hover:bg-white/5 transition-colors ${editor.isActive({ textAlign: 'justify' }) ? 'text-primary bg-primary/10' : 'text-gray-400'}`}
          title="Justify"
        >
          <AlignJustify size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1 px-2 border-r border-white/10">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-white/5 transition-colors ${editor.isActive('bulletList') ? 'text-primary bg-primary/10' : 'text-gray-400'}`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-white/5 transition-colors ${editor.isActive('orderedList') ? 'text-primary bg-primary/10' : 'text-gray-400'}`}
          title="Ordered List"
        >
          <ListOrdered size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded hover:bg-white/5 transition-colors ${editor.isActive('blockquote') ? 'text-primary bg-primary/10' : 'text-gray-400'}`}
          title="Blockquote"
        >
          <Quote size={16} />
        </button>
      </div>

      <div className="flex items-center gap-2 px-2 border-r border-white/10">
        <div className="flex items-center gap-1">
          <Type size={14} className="text-gray-500" />
          <select
            onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
            className="bg-transparent text-xs text-gray-300 outline-none hover:text-white transition-colors"
          >
            {fonts.map(font => (
              <option key={font.value} value={font.value} className="bg-[#121118]">{font.name}</option>
            ))}
          </select>
        </div>
        
        <div className="group relative">
          <button className="p-1.5 rounded hover:bg-white/5 text-gray-400" title="Text Color">
            <Palette size={16} />
          </button>
          <div className="absolute top-full left-0 mt-1 hidden group-hover:grid grid-cols-3 gap-1 p-2 bg-[#1A1C23] border border-white/10 rounded-lg shadow-xl z-20">
            {colors.map(color => (
              <button
                key={color.value}
                onClick={() => editor.chain().focus().setColor(color.value).run()}
                className="w-5 h-5 rounded-full border border-white/10"
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        <div className="group relative">
          <button
            className={`p-1.5 rounded hover:bg-white/5 transition-colors ${editor.isActive('highlight') ? 'text-primary bg-primary/10' : 'text-gray-400'}`}
            title="Highlight"
          >
            <Highlighter size={16} />
          </button>
          <div className="absolute top-full left-0 mt-1 hidden group-hover:grid grid-cols-3 gap-1 p-2 bg-[#1A1C23] border border-white/10 rounded-lg shadow-xl z-20">
            {highlightColors.map(color => (
              <button
                key={color.value}
                onClick={() => {
                  if (color.value === 'transparent') {
                    editor.chain().focus().unsetHighlight().run();
                  } else {
                    editor.chain().focus().setHighlight({ color: color.value }).run();
                  }
                }}
                className="w-5 h-5 rounded-full border border-white/10"
                style={{ backgroundColor: color.value === 'transparent' ? '#333' : color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 pl-2">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded hover:bg-white/5 text-gray-400 disabled:opacity-30"
          title="Undo"
        >
          <Undo size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded hover:bg-white/5 text-gray-400 disabled:opacity-30"
          title="Redo"
        >
          <Redo size={16} />
        </button>
      </div>
    </div>
  );
};

export default function TiptapEditor({ content, onChange, bgColor = '#0A0B10' }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[60vh] text-slate-300 text-lg leading-relaxed font-serif p-4',
      },
    },
  });

  // Update editor content if it changes externally (e.g. chapter switch)
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div 
      className="w-full border border-white/10 rounded-xl overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: bgColor }}
    >
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
