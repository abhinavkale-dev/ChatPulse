import { Hexagon, Github, Twitter } from "lucide-react"
import { Footer } from "@/components/ui/footer"

function FooterComp() {
  return (
    <div className="w-full">
      <Footer
        logo={<Hexagon className="h-10 w-10" />}
        brandName="ChatPulse"
        socialLinks={[
          {
            icon: <Twitter className="h-5 w-5" />,
            href: "https://twitter.com/Abhinavstwt",
            label: "Twitter",
          },
          {
            icon: <Github className="h-5 w-5" />,
            href: "https://github.com/abhinavkale-dev",
            label: "GitHub",
          },
        ]}
        mainLinks={[
          { href: "/", label: "Products" },
          { href: "/", label: "About" },
          { href: "/", label: "Blog" },
          { href: "/", label: "Contact" },
        ]}
        legalLinks={[
          { href: "/", label: "Privacy" },
          { href: "/", label: "Terms" },
        ]}
        copyright={{
          text: "© 2025 ChatPulse",
          license: "All rights reserved",
        }}
      />
    </div>
  )
}

export { FooterComp }