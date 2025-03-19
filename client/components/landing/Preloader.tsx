"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

export default function PreLoader() {
    const [show, setShow] = useState(true)
    const words = ["Hello", "Bonjour", "Ciao", "Olà", "やあ", "Hallå", "Guten tag", "Hallo"]
    const [index, setIndex] = useState(0)

    useEffect(() => {
       const timeout = setTimeout( () => {
            setShow(false);
            document.body.style.cursor = 'default'
            window.scrollTo(0,0);
          }, 2000)

          return () => clearTimeout(timeout)
    }, [])
    
    useEffect(() => {
        if(index == words.length - 1) return;
        setTimeout(() => {
            setIndex(index + 1)
        }, index == 0 ? 1000 : 150)
    }, [index])

    return (
        <AnimatePresence mode="wait">
            {show && (
          <motion.div
          className="fixed inset-0 bg-black flex items-center justify-center z-50"
          initial={{ opacity: 1 }}
          animate={{ 
            opacity: 1,
            transition: { duration: 1, delay: 0.2 }
          }}
          exit={{ 
            opacity: 1, 
            y: "-100vh",
            transition: { 
              duration: 0.8, 
              ease: [0.76, 0, 0.24, 1], 
              delay: 0.2 
            }
          }}
        >
          <motion.h1
            className="text-4xl md:text-5xl font-bold text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {words[index]}
          </motion.h1>
        </motion.div>
        )}
        </AnimatePresence>
    )
}