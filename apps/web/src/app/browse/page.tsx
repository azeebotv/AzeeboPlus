'use client';
import React from 'react';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function BrowsePage(): JSX.Element {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [universes, setUniverses] = useState<{ id: string; name: string; icon?: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedUniverse, setSelectedUniverse] = useState<string | null>(null);
  const [content, setContent] = useState<
    {
      id: string;
      title: string;
      description?: string;
      thumbnail: string;
      duration?: number;
      category?: string;
      universe?: { id: string; name: string; icon?: string };
      creator?: { name: string };
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCategories = async (): Promise<void> => {
      try {
        const response = await api.content.getCategories();
        if (response.success && response.data) {
          setCategories(response.data);
        }
      } catch (error) {
        // Error handling is intentionally minimal here
      }
    };

    const fetchUniverses = async (): Promise<void> => {
      try {
        const response = await api.universe.getUniverses();
        if (response.success && response.data) {
          setUniverses(response.data);
        }
      } catch (error) {
        // Error handling is intentionally minimal here
      }
    };

    fetchCategories();
    fetchUniverses();
  }, []);

  useEffect(() => {
    const fetchContent = async (): Promise<void> => {
      try {
        setIsLoading(true);

        if (selectedUniverse) {
          const response = await api.content.getContentByUniverse(selectedUniverse);
          if (response.success && response.data) {
            setContent(response.data.items);
          }
        } else if (selectedCategory) {
          const response = await api.content.getContentByCategory(selectedCategory);
          if (response.success && response.data) {
            setContent(response.data.items);
          }
        } else {
          const response = await api.content.getFeaturedContent();
          if (response.success && response.data) {
            setContent(response.data);
          }
        }
      } catch (error) {
        // Error handling is intentionally minimal here
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [selectedCategory, selectedUniverse]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <h1 className="text-2xl font-bold">Azeebo+</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/" className="font-medium hover:text-primary transition-colors">
              Home
            </a>
            <a href="/browse" className="font-medium text-primary border-b-2 border-primary pb-1">
              Browse
            </a>
            <a href="/library" className="font-medium hover:text-primary transition-colors">
              Library
            </a>
            <a href="/creators" className="font-medium hover:text-primary transition-colors">
              Creators
            </a>
          </nav>
          <div className="flex items-center space-x-4">
            <button className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
              Sign In
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Browse Content</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-card rounded-lg p-4 mb-6">
              <h3 className="font-bold text-lg mb-4">Categories</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      !selectedCategory ? 'bg-primary text-white' : 'hover:bg-muted'
                    }`}
                  >
                    All Categories
                  </button>
                </li>
                {categories.map((category) => (
                  <li key={category.id}>
                    <button
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-primary text-white'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-card rounded-lg p-4">
              <h3 className="font-bold text-lg mb-4">Universes</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setSelectedUniverse(null)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      !selectedUniverse ? 'bg-primary text-white' : 'hover:bg-muted'
                    }`}
                  >
                    All Universes
                  </button>
                </li>
                {universes.map((universe) => (
                  <li key={universe.id}>
                    <button
                      onClick={() => setSelectedUniverse(universe.id)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        selectedUniverse === universe.id
                          ? 'bg-primary text-white'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {universe.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Content Grid */}
          <div className="md:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">
                {selectedCategory
                  ? categories.find((c) => c.id === selectedCategory)?.name
                  : selectedUniverse
                    ? universes.find((u) => u.id === selectedUniverse)?.name
                    : 'All Content'}
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <select className="border border-border rounded-md px-3 py-1 text-sm bg-card">
                  <option>Popular</option>
                  <option>Newest</option>
                  <option>A-Z</option>
                  <option>Rating</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div
                    key={item}
                    className="bg-card rounded-lg overflow-hidden shadow-sm animate-pulse"
                  >
                    <div className="h-48 bg-muted"></div>
                    <div className="p-4">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {content.map((item) => (
                  <div
                    key={item.id}
                    className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="h-48 bg-muted flex items-center justify-center">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-lg mb-2">{item.title}</h4>
                      <p className="text-muted-foreground text-sm mb-3">
                        {item.description.length > 80
                          ? `${item.description.substring(0, 80)}...`
                          : item.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {item.universe.name}
                        </span>
                        <button className="text-primary hover:text-primary/80 text-sm font-medium">
                          Watch Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && content.length === 0 && (
              <div className="bg-card rounded-lg p-8 text-center">
                <svg
                  className="h-16 w-16 text-muted-foreground mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
                <h3 className="text-lg font-medium mb-2">No content found</h3>
                <p className="text-muted-foreground">
                  Try selecting a different category or universe
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-muted border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold mb-4">Azeebo+</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Press
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Help</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Support
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Cookies
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Facebook
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2026 Azeebo+. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
