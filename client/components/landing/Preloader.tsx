"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import styles from './preloader.module.css'

export default function PreLoader() {
    const [show, setShow] = useState(true)
    const words = ["ChatPulse", "Lets GO!!!"]
    const [index, setIndex] = useState(0)
    const [dimension, setDimension] = useState({width: 0, height: 0})

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
        }, index == 0 ? 1000 : 1500)
    }, [index, words.length])

    useEffect(() => {
        setDimension({width: window.innerWidth, height: window.innerHeight})
        
        const handleResize = () => {
            setDimension({width: window.innerWidth, height: window.innerHeight})
        }
        
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Animation variants
    const initialPath = `M0 0 L${dimension.width} 0 L${dimension.width} ${dimension.height} Q${dimension.width/2} ${dimension.height + 500} 0 ${dimension.height} L0 0`
    const targetPath = `M0 0 L${dimension.width} 0 L${dimension.width} ${dimension.height} Q${dimension.width/2} ${dimension.height - 100} 0 ${dimension.height} L0 0`
    
    const curve = {
        initial: {
            d: initialPath,
            transition: {duration: 0.7, ease: [0.76, 0, 0.24, 1]}
        },
        exit: {
            d: targetPath,
            transition: {duration: 0.7, ease: [0.76, 0, 0.24, 1], delay: 0.3}
        }
    }

    const slideUp = {
        initial: {
            y: 0
        },
        exit: {
            y: "-100vh",
            transition: {
                duration: 0.8,
                ease: [0.76, 0, 0.24, 1],
                delay: 0.2
            }
        }
    }

    const opacity = {
        initial: {
            opacity: 0
        },
        enter: {
            opacity: 1,
            transition: {duration: 0.5}
        }
    }

    return (
        <AnimatePresence mode="wait">
            {show && (
                <motion.div variants={slideUp} initial="initial" exit="exit" className={styles.introduction}>
                    {dimension.width > 0 && 
                    <>
                        <motion.p variants={opacity} initial="initial" animate="enter">
                            <span></span>{words[index]}
                        </motion.p>
                        <svg>
                            <motion.path variants={curve} initial="initial" exit="exit"></motion.path>
                        </svg>
                    </>
                    }
                </motion.div>
            )}
        </AnimatePresence>
    )
}