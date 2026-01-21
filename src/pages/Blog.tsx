import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Tag, ChevronRight, BookOpen, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SEO } from '@/components/SEO';
import { useTheme } from '@/hooks/useTheme';
import { blogPosts, getCategories } from '@/lib/blogData';

const Blog = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = getCategories();

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = !selectedCategory || post.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <SEO 
        title="Blog - TradeMoq"
        description="Learn about trading signal tracking, TradingView webhooks, strategy optimization, and how to get the most out of TradeMoq."
        keywords="trading blog, signal tracking, TradingView webhooks, trading strategies, trading analytics"
        canonical="https://trademoq.com/blog"
      />
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/60 backdrop-blur-xl overflow-hidden" style={{ height: '64px' }}>
          <div className="container mx-auto px-6 h-full flex items-center justify-between">
            <Link to="/" className="flex items-center group h-full">
              <img
                src={isDarkMode ? '/tm_logo.svg' : '/tm_logo_black.svg'}
                alt="TradeMoq Logo"
                className="h-48 w-auto transition-all duration-300 group-hover:scale-105"
                key={theme}
              />
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              <Link to="/#features" className="nav-link">Features</Link>
              <Link to="/#how-it-works" className="nav-link">How It Works</Link>
              <Link to="/#pricing" className="nav-link">Pricing</Link>
              <Link to="/blog" className="nav-link text-primary">Blog</Link>
            </div>
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-12 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
          
          <div className="container mx-auto max-w-4xl relative">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
                <BookOpen className="h-3 w-3" />
                <span>TradeMoq Blog</span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
                Trading Insights &{' '}
                <span className="gradient-text">Guides</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Learn how to maximize your trading signal tracking, optimize strategies, and get the most out of TradeMoq.
              </p>
            </div>
          </div>
        </section>

        {/* Search and Filter */}
        <section className="pb-8 px-6">
          <div className="container mx-auto max-w-4xl">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <main className="pb-20 px-6">
          <div className="container mx-auto max-w-4xl">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No articles found matching your criteria.</p>
                <Button
                  variant="ghost"
                  className="mt-4"
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery('');
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredPosts.map((post, index) => (
                  <Link 
                    key={post.slug} 
                    to={`/blog/${post.slug}`}
                    className="block group"
                  >
                    <article className={`
                      relative p-6 rounded-xl border border-border/50 bg-card/50 
                      hover:border-primary/30 hover:bg-card transition-all duration-300
                      ${index === 0 ? 'md:p-8' : ''}
                    `}>
                      {/* Featured badge for first post */}
                      {index === 0 && (
                        <div className="absolute -top-3 left-6 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                          Latest
                        </div>
                      )}
                      
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Category */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                              {post.category}
                            </span>
                          </div>
                          
                          {/* Title */}
                          <h2 className={`
                            font-heading font-semibold mb-2 group-hover:text-primary transition-colors
                            ${index === 0 ? 'text-2xl md:text-3xl' : 'text-xl'}
                          `}>
                            {post.title}
                          </h2>
                          
                          {/* Excerpt */}
                          <p className="text-muted-foreground mb-4 line-clamp-2">
                            {post.excerpt}
                          </p>
                          
                          {/* Meta */}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4" />
                              <span>{post.readTime}</span>
                            </div>
                          </div>
                          
                          {/* Tags */}
                          <div className="flex flex-wrap gap-2 mt-4">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span 
                                key={tag} 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs"
                              >
                                <Tag className="h-3 w-3" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {/* Arrow indicator */}
                        <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* CTA Section */}
        <section className="py-16 px-6 border-t border-border bg-muted/20">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
              Ready to Start Tracking Signals?
            </h2>
            <p className="text-muted-foreground mb-6">
              Put these insights into practice with TradeMoq's real-time signal tracking platform.
            </p>
            <Link to="/auth">
              <Button size="lg" className="gap-2 shadow-lg shadow-primary/25">
                Get Started Free
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8 px-6 bg-muted/10">
          <div className="container mx-auto max-w-4xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © 2026 TradeMoq. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link to="/blog" className="text-foreground font-medium">Blog</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Blog;
