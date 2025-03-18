import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header 
      className={`fixed top-4 left-0 right-0 z-50 w-[95%] mx-auto max-w-7xl transition-all duration-400 ease-in-out ${
        scrolled ? 'bg-primary/30 backdrop-blur-md' : 'bg-transparent'
      } rounded-2xl`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center">
            <a href="#" className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
                <div className="w-4 h-4 bg-background rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                </div>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-primary">ChatRooms</span>
            </a>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            {['Features', 'FAQ', 'About'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-200"
              >
                {item}
              </a>
            ))}
          </nav>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={toggleMobileMenu}
              className="text-foreground focus:outline-none"
            >
              {mobileMenuOpen ? (
                <X size={24} className="text-foreground" />
              ) : (
                <Menu size={24} className="text-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div 
        className={`md:hidden bg-white/30 backdrop-blur-md absolute top-full left-0 w-full mt-2 py-4 px-4 rounded-xl transition-all duration-400 ease-in-out ${
          mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <nav className="flex flex-col space-y-4 py-2">
          {['Features', 'FAQ', 'About'].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`}
              className="text-base font-medium text-foreground hover:text-primary px-4 py-2 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item}
            </a>
          ))}
          <Button 
            variant="default" 
            size="sm" 
            className="mt-2 mx-4"
            onClick={() => setMobileMenuOpen(false)}
          >
            Get Started
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;