'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Github, Twitter, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#161617] border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Browse */}
          <div>
            <h3 className="text-white font-semibold mb-4">Browse</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/category/ui-kits" className="text-gray-400 hover:text-white transition-colors">Featured products</a></li>
              <li><a href="/category/ui-kits" className="text-gray-400 hover:text-white transition-colors">UI Kits</a></li>
              <li><a href="/category/coded-templates" className="text-gray-400 hover:text-white transition-colors">Coded Templates</a></li>
              <li><a href="/category/wireframe-kits" className="text-gray-400 hover:text-white transition-colors">Wireframe kits</a></li>
              <li><a href="/category/illustrations" className="text-gray-400 hover:text-white transition-colors">Illustrations</a></li>
              <li><a href="/category/mockups" className="text-gray-400 hover:text-white transition-colors">Mockups</a></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-white font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/all-access" className="text-gray-400 hover:text-white transition-colors">All-Access Pass</a></li>
              <li><a href="/studio" className="text-gray-400 hover:text-white transition-colors">UI8 Design Studio</a></li>
              <li><a href="/become-author" className="text-gray-400 hover:text-white transition-colors">Become an author</a></li>
              <li><a href="/affiliate" className="text-gray-400 hover:text-white transition-colors">Affiliate program</a></li>
              <li><a href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms & Licensing</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-2">
            <h3 className="text-white font-semibold mb-4">Sign up for our newsletter!</h3>
            <p className="text-gray-400 text-sm mb-4">
              Get our latest news, updates, and special offers delivered to your inbox.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="designer@example.com"
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 flex-1"
              />
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-800">
          {/* Copyright */}
          <div className="flex items-center mb-4 md:mb-0">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center mr-2">
              <span className="text-white font-bold text-xs">UI</span>
            </div>
            <span className="text-gray-400 text-sm">© 2025, Robot Global FZCO / UI8</span>
          </div>

          {/* Connect with us */}
          <div className="flex items-center space-x-4">
            <span className="text-gray-400 text-sm">Connect with us</span>
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Github className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Linkedin className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
