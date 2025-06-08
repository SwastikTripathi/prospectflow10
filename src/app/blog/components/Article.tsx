
'use client';

import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { cn } from '@/lib/utils';

interface ArticleProps {
  content: string;
  className?: string;
}

const NAVBAR_HEIGHT_OFFSET = 80;

export default function Article({ content, className }: ArticleProps) {
  return (
    <article
      className={cn(
        "prose prose-medium lg:prose-xl dark:prose-invert break-words", // Removed font-sans, will inherit Inter from body
        // Specific overrides for typography elements
        "prose-p:text-gray-700 prose-p:dark:text-gray-300 prose-p:leading-relaxed prose-p:text-base md:prose-p:text-[1.05rem] prose-p:mb-5", // Added mb-5 for paragraph spacing
        "prose-headings:text-gray-900 prose-headings:dark:text-gray-100",
        "prose-h1:text-3xl prose-h1:sm:text-4xl prose-h1:md:text-[2.5rem] prose-h1:font-bold prose-h1:tracking-tight prose-h1:leading-tight prose-h1:mt-12 prose-h1:mb-6", // Adjusted margins
        "prose-h2:text-2xl prose-h2:md:text-3xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-5", // Adjusted margins
        "prose-h3:text-xl prose-h3:md:text-2xl prose-h3:font-semibold prose-h3:mt-10 prose-h3:mb-4", // Adjusted margins
        "prose-h4:text-lg prose-h4:md:text-xl prose-h4:font-semibold prose-h4:mt-8 prose-h4:mb-3", // Adjusted margins
        "prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6 prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6", // Added list styling and spacing
        "prose-li:my-2 prose-li:leading-relaxed", // Added list item spacing
        "prose-a:text-sky-600 prose-a:dark:text-sky-500 prose-a:no-underline hover:prose-a:underline",
        "prose-blockquote:border-l-primary prose-blockquote:text-gray-600 prose-blockquote:dark:text-gray-400 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-6",
        "prose-code:bg-gray-100 prose-code:dark:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-normal",
        "prose-pre:bg-gray-900 prose-pre:dark:bg-gray-900 prose-pre:text-gray-100 prose-pre:dark:text-gray-200 prose-pre:p-4 prose-pre:rounded-md prose-pre:overflow-x-auto prose-pre:my-6",
        className
      )}
    >
      <ReactMarkdown
        rehypePlugins={[rehypeHighlight]}
        components={{
            h1: ({node, ...props}) => {
                const id = String(props.children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
                return <h1 id={id} {...props} style={{scrollMarginTop: `${NAVBAR_HEIGHT_OFFSET}px`}} />;
            },
            h2: ({node, ...props}) => {
                const id = String(props.children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
                return <h2 id={id} {...props} style={{scrollMarginTop: `${NAVBAR_HEIGHT_OFFSET}px`}} />;
            },
            h3: ({node, ...props}) => {
                const id = String(props.children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
                return <h3 id={id} {...props} style={{scrollMarginTop: `${NAVBAR_HEIGHT_OFFSET}px`}} />;
            },
            h4: ({node, ...props}) => {
                const id = String(props.children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
                return <h4 id={id} {...props} style={{scrollMarginTop: `${NAVBAR_HEIGHT_OFFSET}px`}} />;
            },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
