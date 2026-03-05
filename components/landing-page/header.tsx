"use client";
import React, { useState } from 'react';
import { Button } from "../ui/button";
import { Menu, X, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '../theme/theme-toggle';
import { AuthButton } from '../auth/auth-button';
import Image from 'next/image';

const navigation = [
  { 
    name: 'Beranda', 
    href: '/' 
  },
  { 
    name: 'Kelas', 
    href: '/kelas',
    description: 'Daftar kelas EPS-TOPIK dan bahasa Korea'
  },
  { 
    name: 'Latihan Soal', 
    href: '/soal/latihan',
    description: 'Bank soal latihan EPS-TOPIK'
  },
  { 
    name: 'Tryout', 
    href: '/soal/tryout',
    description: 'Simulasi ujian EPS-TOPIK'
  },
  { 
    name: 'Vocabulary', 
    href: '/vocabulary',
    description: 'Kosakata bahasa Korea'
  },
  { 
    name: 'Live Session', 
    href: '/live-session',
    description: 'Kelas langsung dengan pengajar'
  },
];

const dropdownLinks = {
  'Latihan Soal': [
    { name: 'Latihan Harian', href: '/soal/latihan', description: 'Latihan soal rutin setiap hari' },
    { name: 'Bank Soal', href: '/soal', description: 'Koleksi soal lengkap' },
  ],
  'Tryout': [
    { name: 'Tryout Gratis', href: '/soal/tryout', description: 'Simulasi ujian gratis' },
    { name: 'Tryout Premium', href: '/kelas', description: 'Simulasi ujian lengkap' },
  ],
};

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-all duration-200">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-primary to-primary/80">
                <Image
                  priority={true}
                  src="/logo/hakgyo-light.png"
                  alt="Hakgyo Logo - Platform Belajar Bahasa Korea dan EPS-TOPIK"
                  width={40}
                  height={40}
                  className="dark:hidden p-1"
                />
                <Image
                  priority={true}
                  src="/logo/hakgyo-dark.png"
                  alt="Hakgyo Logo - Platform Belajar Bahasa Korea dan EPS-TOPIK"
                  width={40}
                  height={40}
                  className="hidden dark:block p-1"
                />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-xl text-foreground">Hakgyo</span>
                <p className="text-xs text-muted-foreground -mt-1">EPS-TOPIK & Bahasa Korea</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {navigation.map((item) => (
              <div 
                key={item.name} 
                className="relative group"
                onMouseEnter={() => setActiveDropdown(item.name)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link href={item.href}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors gap-1"
                  >
                    {item.name}
                    {dropdownLinks[item.name as keyof typeof dropdownLinks] && (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </Link>

                {/* Dropdown Menu */}
                {dropdownLinks[item.name as keyof typeof dropdownLinks] && activeDropdown === item.name && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-background border border-border/40 rounded-lg shadow-xl overflow-hidden">
                    {dropdownLinks[item.name as keyof typeof dropdownLinks].map((link) => (
                      <Link 
                        key={link.name} 
                        href={link.href}
                        className="block px-4 py-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="font-medium text-sm">{link.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{link.description}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <AuthButton variant="outline" size="sm" className="shadow-sm hidden sm:inline-flex" />
            
            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border/40 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <div key={item.name}>
                  <Link 
                    href={item.href}
                    className="block px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="font-medium">{item.name}</div>
                    {item.description && (
                      <div className="text-sm text-muted-foreground mt-0.5">{item.description}</div>
                    )}
                  </Link>
                  
                  {/* Mobile Dropdown */}
                  {dropdownLinks[item.name as keyof typeof dropdownLinks] && (
                    <div className="ml-4 space-y-1 mt-1">
                      {dropdownLinks[item.name as keyof typeof dropdownLinks].map((link) => (
                        <Link
                          key={link.name}
                          href={link.href}
                          className="block px-4 py-2 rounded-lg hover:bg-muted/50 transition-colors text-sm text-muted-foreground"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {link.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Mobile Auth Button */}
              <div className="pt-4 border-t border-border/40">
                <AuthButton variant="default" size="lg" className="w-full" />
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};
