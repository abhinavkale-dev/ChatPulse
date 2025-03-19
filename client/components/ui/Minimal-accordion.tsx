import { motion, Variants } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import React, { useState } from 'react'

interface AccordionItemProps {
  title: string
  content: string
  isExpanded: boolean
  onToggle: () => void
}

interface AccordionProps {
  items: Array<{
    title: string
    content: string
  }>
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  content,
  isExpanded,
  onToggle,
}) => {
  const cardVariants: Variants = {
    collapsed: {
      height: '60px',
      transition: { type: 'spring', stiffness: 300, damping: 15 },
    },
    expanded: {
      height: 'auto',
      transition: { type: 'spring', stiffness: 300, damping: 15 },
    },
  }

  const contentVariants: Variants = {
    collapsed: { opacity: 0 },
    expanded: {
      opacity: 1,
      transition: { delay: 0.1 },
    },
  }

  const chevronVariants: Variants = {
    collapsed: { rotate: 0 },
    expanded: { rotate: 180 },
  }

  return (
    <motion.div
      className="my-4 cursor-pointer select-none overflow-hidden rounded-lg border dark:border-gray-700"
      variants={cardVariants}
      initial="collapsed"
      animate={isExpanded ? 'expanded' : 'collapsed'}
      onClick={onToggle}
    >
      <div className="flex items-center justify-between p-4 text-gray-900 dark:text-gray-100">
        <h2 className="m-0 text-sm font-semibold text-foreground">{title}</h2>
        <motion.div variants={chevronVariants}>
          <ChevronDown size={18} />
        </motion.div>
      </div>
      <motion.div
        className="text-md select-none px-4 py-4"
        variants={contentVariants}
        initial="collapsed"
        animate={isExpanded ? 'expanded' : 'collapsed'}
      >
        <p className="m-0 text-sm text-gray-900 dark:text-gray-100">
          {content}
        </p>
      </motion.div>
    </motion.div>
  )
}

const Accordion: React.FC<AccordionProps> = ({ items }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const handleToggle = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          title={item.title}
          content={item.content}
          isExpanded={expandedIndex === index}
          onToggle={() => handleToggle(index)}
        />
      ))}
    </div>
  )
}

const accordionItems = [
  {
    title: 'Public Chat Rooms',
    content:
      'Join open chat rooms and engage in conversations with people from all around the world.',
  },
  {
    title: 'Real-Time Messaging',
    content:
      'Chat instantly with smooth, real-time messaging to keep the conversation flowing.',
  },
  {
    title: 'Express with GIFs & Emojis',
    content:
      'Make your chats fun and lively with a vast collection of GIFs and emojis.',
  },
  {
    title: 'Global Community',
    content:
      'Connect with a diverse and active community to share thoughts, ideas, and experiences.',
  },
];

const AccordionComp: React.FC = () => {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-xl p-8">
        <Accordion items={accordionItems} />
      </div>
    </div>
  )
}

export default AccordionComp