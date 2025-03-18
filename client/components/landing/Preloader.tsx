// "use client"

// import { motion, AnimatePresence } from "framer-motion"
// import { useEffect, useState } from "react"

// export default function PreLoader() {
//     const [show, setShow] = useState(true)

//     useEffect(() => {
//         const timeout = setTimeout(() => setShow(false), 3000)
//         return () => clearTimeout(timeout)
//     }, [])

//     return (
//         <AnimatePresence>
//             {show && (
//           <motion.div
//           className="fixed inset-0 bg-black flex items-center justify-center z-50"
//           initial={{ opacity: 1 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           transition={{ duration: 1 }}
//         >
//           <motion.h1
//             className="text-4xl md:text-5xl font-bold text-white"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 1 }}
//           >
//             ChatPulse
//           </motion.h1>
//         </motion.div>
//         )}
//         </AnimatePresence>
//     )
// }