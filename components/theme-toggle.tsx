 "use client"
 
 import { useTheme } from "next-themes"
 import { Sun, Moon } from "lucide-react"
 import { Button } from "@/components/ui/button"
 import { useEffect, useState } from "react"
 
 export default function ThemeToggle() {
   const { theme, setTheme } = useTheme()
   const [mounted, setMounted] = useState(false)
   useEffect(() => setMounted(true), [])
   if (!mounted) return null
   const isDark = theme === "dark"
   return (
     <Button
       variant="outline"
       size="icon"
       aria-label="Toggle theme"
       title={isDark ? "Switch to light" : "Switch to dark"}
       onClick={() => setTheme(isDark ? "light" : "dark")}
     >
       {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
     </Button>
   )
 }
